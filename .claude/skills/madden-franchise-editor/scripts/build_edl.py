#!/usr/bin/env python3
"""Turn the analysis into an edit decision list.

Applies the rules in references/edit-grammar.md:
  - information segments breathe (never compressed)
  - dead air and filler are removed
  - pre-snap waiting is trimmed
  - low-value plays in decided games are dropped
  - catchphrases and highlights are protected

The EDL is the source of truth. render.py consumes it.

    python3 build_edl.py work/analysis.json -o work/edl.json --target 22
"""

from __future__ import annotations

import argparse

from common import hhmmss, read_json, write_json

PAD = 0.35          # seconds of breathing room kept around every kept span
MIN_KEEP = 0.8      # spans shorter than this aren't worth a cut point
MERGE_GAP = 0.6     # kept spans closer than this are merged


def utterances_in(analysis: dict, seg: dict) -> list[dict]:
    lo, hi = seg["utterance_range"]
    return analysis["utterances"][lo:hi]


def silence_overlaps(analysis: dict, start: float, end: float) -> list[dict]:
    return [
        s for s in analysis["silence"]
        if s["end"] > start and s["start"] < end
    ]


def keep_whole(seg: dict, reason: str) -> dict:
    return {
        "segment": seg["index"],
        "label": seg["label"],
        "action": "keep",
        "reason": reason,
        "spans": [{"start": seg["start"], "end": seg["end"]}],
    }


def merge_spans(spans: list[dict]) -> list[dict]:
    merged: list[dict] = []
    for span in sorted(spans, key=lambda s: s["start"]):
        if merged and span["start"] - merged[-1]["end"] < MERGE_GAP:
            merged[-1]["end"] = max(merged[-1]["end"], span["end"])
        else:
            merged.append(dict(span))
    return merged


def dead_ranges(analysis: dict, start: float, end: float, min_silence: float,
                utts: list[dict]) -> list[tuple[float, float]]:
    """Silence and filler inside [start, end) that is safe to drop."""
    drops: list[tuple[float, float]] = []
    for sil in silence_overlaps(analysis, start, end):
        a, b = max(sil["start"], start), min(sil["end"], end)
        if b - a >= min_silence:
            drops.append((a + PAD, b - PAD))
    for utt in utts:
        if (utt["is_filler"] and not utt["is_catchphrase"]
                and start <= utt["start"] < end):
            drops.append((utt["start"], utt["end"]))
    return sorted((a, b) for a, b in drops if b - a > 0.25)


def subtract(spans: list[dict], drops: list[tuple[float, float]]) -> list[dict]:
    """Remove drop ranges from kept spans."""
    out: list[dict] = []
    for span in spans:
        cursor = span["start"]
        for a, b in drops:
            if b <= cursor or a >= span["end"]:
                continue
            if a > cursor + MIN_KEEP:
                out.append({"start": round(cursor, 2), "end": round(a, 2)})
            cursor = max(cursor, b)
        if span["end"] > cursor + MIN_KEEP:
            out.append({"start": round(cursor, 2), "end": round(span["end"], 2)})
    return merge_spans(out)


def tighten(analysis: dict, seg: dict, min_silence: float) -> dict:
    """Keep the segment but drop dead air and filler utterances."""
    utts = utterances_in(analysis, seg)
    drops = dead_ranges(analysis, seg["start"], seg["end"], min_silence, utts)
    spans = subtract([{"start": seg["start"], "end": seg["end"]}], drops)

    removed = max(0.0, seg["duration"] - sum(s["end"] - s["start"] for s in spans))
    return {
        "segment": seg["index"],
        "label": seg["label"],
        "action": "tighten",
        "reason": f"removed {removed:.0f}s of dead air and filler",
        "spans": spans,
    }


def condense_gameplay(analysis: dict, seg: dict, min_silence: float,
                      play_floor: float) -> dict:
    """Split gameplay into plays; keep the ones that earn their place.

    A play is kept when it scores above the floor, contains a catchphrase, or the
    narration is specifically discussing it (menu/stat context inside gameplay
    means he is explaining something on screen).
    """
    utts = utterances_in(analysis, seg)
    starts = [u for u in utts if u["is_play_start"]]
    if len(starts) < 3:
        return tighten(analysis, seg, min_silence)

    plays = []
    for i, head in enumerate(starts):
        end = starts[i + 1]["start"] if i + 1 < len(starts) else seg["end"]
        body = [u for u in utts if head["start"] <= u["start"] < end]
        plays.append({
            "start": head["start"],
            "end": end,
            "score": max((u["score"] for u in body), default=0.0),
            "catchphrase": any(u["is_catchphrase"] for u in body),
            "discussed": any(u["is_menu_context"] for u in body),
            "comedy": any(u["comedy"] for u in body),
        })

    spans, dropped = [], 0
    for play in plays:
        keep = (
            play["score"] >= play_floor
            or play["catchphrase"]
            or play["discussed"]
            or play["comedy"]
        )
        if not keep:
            dropped += 1
            continue
        # Trim pre-snap: start at the cue, not wherever the previous play ended.
        spans.append({
            "start": round(max(seg["start"], play["start"] - PAD), 2),
            "end": round(min(seg["end"], play["end"]), 2),
        })

    if not spans:  # never empty a whole segment
        return tighten(analysis, seg, min_silence)

    # A play kept for its highlight can still contain "uh, hold on" or dead air.
    drops = dead_ranges(analysis, seg["start"], seg["end"], min_silence, utts)
    merged = subtract(merge_spans(spans), drops)

    kept = sum(s["end"] - s["start"] for s in merged)
    return {
        "segment": seg["index"],
        "label": seg["label"],
        "action": "condense",
        "reason": (f"kept {len(plays) - dropped}/{len(plays)} plays, "
                   f"{seg['duration'] - kept:.0f}s removed"),
        "spans": merged,
    }


def build(analysis: dict, play_floor: float, min_silence: float) -> list[dict]:
    decisions = []
    for seg in analysis["segments"]:
        label = seg["label"]
        if label in ("cta_open", "cta_close", "episode_end"):
            decisions.append(keep_whole(seg, "CTA — brand beat, never trimmed"))
        elif seg["is_information"]:
            # Information breathes, but dead air is still dead air.
            d = tighten(analysis, seg, min_silence * 1.6)
            d["reason"] += " (information segment — pacing preserved)"
            decisions.append(d)
        elif label == "gameplay":
            decisions.append(condense_gameplay(analysis, seg, min_silence, play_floor))
        elif label == "menu_navigation":
            decisions.append({
                "segment": seg["index"], "label": label, "action": "remove",
                "reason": "menu traversal", "spans": [],
            })
        else:
            decisions.append(tighten(analysis, seg, min_silence))
    return decisions


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("analysis")
    ap.add_argument("-o", "--out", default="work/edl.json")
    ap.add_argument("--target", type=float, default=None,
                    help="target runtime in minutes; raises the play floor to fit")
    ap.add_argument("--play-floor", type=float, default=0.42,
                    help="minimum score for a play to survive (0-1)")
    ap.add_argument("--min-silence", type=float, default=1.2,
                    help="silence this long or longer is removed")
    args = ap.parse_args()

    analysis = read_json(args.analysis)
    floor = args.play_floor
    decisions = build(analysis, floor, args.min_silence)

    if args.target:
        target = args.target * 60
        for _ in range(12):
            total = sum(s["end"] - s["start"] for d in decisions for s in d["spans"])
            if total <= target or floor >= 0.9:
                break
            floor = round(floor + 0.05, 3)
            decisions = build(analysis, floor, args.min_silence)

    runtime = sum(s["end"] - s["start"] for d in decisions for s in d["spans"])
    source = analysis["duration"]

    write_json(args.out, {
        "source": analysis["source"],
        "episode_type": analysis["episode_type"],
        "source_duration": source,
        "runtime": round(runtime, 2),
        "play_floor": floor,
        "decisions": decisions,
        "highlights": analysis["highlights"],
    })

    print(f"source   : {hhmmss(source)}")
    print(f"edit     : {hhmmss(runtime)}  ({runtime / source * 100:.0f}% retained)")
    print(f"play floor: {floor}")
    print(f"\n{'label':<20} {'action':<10} reason")
    for d in decisions:
        print(f"{d['label']:<20} {d['action']:<10} {d['reason']}")
    print(f"\n-> {args.out}")


if __name__ == "__main__":
    main()
