#!/usr/bin/env python3
"""Classify the raw footage into labelled segments and score every moment.

Combines three signals:
  1. Verbal cues from references/cue-lexicon.json -> segment boundaries and labels
  2. Audio RMS envelope                            -> excitement spikes
  3. ffmpeg silencedetect                          -> dead air

Output feeds build_edl.py.

    python3 analyze.py raw.mp4 work/transcript.json -o work/analysis.json
"""

from __future__ import annotations

import argparse
from pathlib import Path

from common import (
    any_match, audio_rms_envelope, compile_patterns, detect_silence, die,
    hhmmss, load_lexicon, match_names, probe_duration, read_json, require,
    write_json,
)

# Segment labels whose content is information the viewer must read. Per
# edit-grammar.md these are allowed to breathe and are never compressed.
INFORMATION_SEGMENTS = {
    "roster_moves", "roster_cuts", "postgame_analysis", "weekly_recap",
    "prospect_profile", "opponent_preview", "position_group", "halftime_report",
}

# Beats that carry the series' identity. Never merged away during collapsing,
# never trimmed by build_edl, and checked for by qa.
BRAND_LABELS = {"cta_open", "cta_close", "episode_end"}


def build_matchers(lex: dict) -> dict:
    boundaries = [
        {
            "label": entry["label"],
            "strength": entry["strength"],
            "position": entry.get("position"),
            "compiled": compile_patterns(entry["patterns"]),
        }
        for entry in lex["segment_boundaries"]
    ]
    hype = {
        tier: {
            "weight": cfg["weight"],
            "compiled": compile_patterns(cfg["patterns"]),
        }
        for tier, cfg in lex["hype_markers"].items()
        if not tier.startswith("_")
    }
    comedy = {
        kind: compile_patterns(cfg["patterns"])
        for kind, cfg in lex["comedy_beats"].items()
        if not kind.startswith("_")
    }
    return {
        "boundaries": boundaries,
        "hype": hype,
        "comedy": comedy,
        "plays": compile_patterns(lex["play_boundaries"]["patterns"]),
        "catchphrases": compile_patterns(lex["catchphrases"]["patterns"]),
        "filler": compile_patterns(lex["filler"]["patterns"]),
        "menu": compile_patterns(lex["menu_context"]["patterns"]),
    }


def rms_at(envelope: list[tuple[float, float]], t: float) -> float:
    if not envelope:
        return 0.0
    step = envelope[1][0] - envelope[0][0] if len(envelope) > 1 else 0.5
    idx = min(int(t / step), len(envelope) - 1)
    return envelope[idx][1]


def boundary_allowed(entry: dict, t: float, duration: float) -> bool:
    """Honour the lexicon's `position` field.

    Without this, "make sure to hit the like button" in the opening 30 seconds
    matches both cta_open and cta_close, and cta_close wins on strength.
    """
    position = entry.get("position")
    if position == "episode_start":
        return t <= max(duration * 0.15, 90)
    if position == "episode_end":
        return t >= min(duration * 0.80, duration - 180)
    return True


def annotate(utterances: list[dict], m: dict,
             envelope: list[tuple[float, float]], duration: float) -> list[dict]:
    """Tag each utterance with cue hits and an excitement score."""
    values = [v for _, v in envelope] or [0.0]
    baseline = sorted(values)[len(values) // 2]
    peak = max(values) or 1.0

    out = []
    for utt in utterances:
        text = utt["text"]
        hype = 0.0
        for cfg in m["hype"].values():
            if any_match(cfg["compiled"], text):
                hype = max(hype, cfg["weight"])

        loudness = rms_at(envelope, utt["start"])
        # How far above the median this moment sits, normalised against the peak.
        energy = max(0.0, (loudness - baseline) / max(peak - baseline, 1e-6))

        comedy = [k for k, pats in m["comedy"].items() if any_match(pats, text)]

        out.append({
            **utt,
            "hype": round(hype, 3),
            "energy": round(min(energy, 1.0), 3),
            "score": round(min(hype * 0.65 + min(energy, 1.0) * 0.35, 1.0), 3),
            "is_play_start": any_match(m["plays"], text),
            "is_catchphrase": any_match(m["catchphrases"], text),
            "is_filler": any_match(m["filler"], text),
            "is_menu_context": any_match(m["menu"], text),
            "comedy": comedy,
            "boundary": next(
                (
                    {"label": b["label"], "strength": b["strength"]}
                    for b in sorted(m["boundaries"], key=lambda x: -x["strength"])
                    if boundary_allowed(b, utt["start"], duration)
                    and any_match(b["compiled"], text)
                ),
                None,
            ),
            "cues": match_names(m["catchphrases"], text),
        })
    return out


def segment(annotated: list[dict], duration: float) -> list[dict]:
    """Split the timeline at boundary cues; label the spans between them."""
    marks = [
        {"index": i, "time": u["start"], **u["boundary"]}
        for i, u in enumerate(annotated) if u["boundary"]
    ]

    # Collapse cues that fire close together, but only when they'd produce a
    # meaningless sliver. Two different labels a few seconds apart are usually
    # two real beats — the cold open runs straight into the CTA — so keep both.
    collapsed: list[dict] = []
    for mk in marks:
        if not collapsed:
            collapsed.append(mk)
            continue
        gap = mk["time"] - collapsed[-1]["time"]
        same = mk["label"] == collapsed[-1]["label"]
        # Brand beats are never merged away; QA checks for their presence.
        protected = BRAND_LABELS & {mk["label"], collapsed[-1]["label"]}
        if same and gap < 25:
            if mk["strength"] > collapsed[-1]["strength"]:
                collapsed[-1] = mk
            continue
        if gap < 3 and not protected:
            if mk["strength"] > collapsed[-1]["strength"]:
                collapsed[-1] = mk
            continue
        collapsed.append(mk)

    if not collapsed or collapsed[0]["time"] > 5:
        collapsed.insert(0, {"index": 0, "time": 0.0, "label": "cold_open",
                             "strength": 0.5})

    segments = []
    for n, mk in enumerate(collapsed):
        # Transcripts can run a little past the video; clamp so no segment
        # starts or ends outside the source.
        start = min(mk["time"], duration)
        end = min(collapsed[n + 1]["time"] if n + 1 < len(collapsed) else duration,
                  duration)
        end_index = (collapsed[n + 1]["index"] if n + 1 < len(collapsed)
                     else len(annotated))
        members = annotated[mk["index"]:end_index]
        if not members or end - start < 0.5:
            continue
        mk = {**mk, "time": start}

        menu_ratio = sum(u["is_menu_context"] for u in members) / len(members)
        play_ratio = sum(u["is_play_start"] for u in members) / len(members)
        label = mk["label"]

        # A stretch dense with play cues is gameplay regardless of which
        # boundary opened it — game_start in particular always becomes one.
        if (label not in INFORMATION_SEGMENTS
                and play_ratio > 0.15
                and (label == "game_start" or end - start > 90)):
            label = "gameplay"

        segments.append({
            "index": n,
            "label": label,
            "start": round(mk["time"], 2),
            "end": round(end, 2),
            "duration": round(end - mk["time"], 2),
            "start_tc": hhmmss(mk["time"]),
            "end_tc": hhmmss(end),
            "utterance_range": [mk["index"], end_index],
            "menu_ratio": round(menu_ratio, 3),
            "play_ratio": round(play_ratio, 3),
            "is_information": label in INFORMATION_SEGMENTS or menu_ratio > 0.4,
            "peak_score": round(max((u["score"] for u in members), default=0.0), 3),
            "catchphrases": [u["text"] for u in members if u["is_catchphrase"]],
            "comedy_beats": [
                {"time": round(u["start"], 2), "kinds": u["comedy"], "text": u["text"]}
                for u in members if u["comedy"]
            ],
        })
    return segments


def highlights(annotated: list[dict], top_n: int = 25) -> list[dict]:
    ranked = sorted(
        (u for u in annotated if u["score"] > 0.35),
        key=lambda u: -u["score"],
    )
    picked: list[dict] = []
    for utt in ranked:
        # Keep highlights at least 25s apart so one touchdown isn't listed 4 times.
        if any(abs(utt["start"] - p["start"]) < 25 for p in picked):
            continue
        picked.append({
            "start": round(utt["start"], 2),
            "start_tc": hhmmss(utt["start"]),
            "score": utt["score"],
            "text": utt["text"],
        })
        if len(picked) >= top_n:
            break
    return sorted(picked, key=lambda p: p["start"])


def detect_episode_type(segments: list[dict], duration: float) -> str:
    """Match against the four skeletons in references/series-profile.md."""
    labels = {s["label"] for s in segments}
    gameplay = sum(s["duration"] for s in segments if s["label"] == "gameplay")

    # Roster cuts are the defining beat of a preseason episode.
    if "roster_cuts" in labels:
        return "B_preseason"
    # No meaningful gameplay at all -> position-by-position roster tour.
    if gameplay < max(60.0, duration * 0.08):
        return ("D_prospect_profile" if "prospect_profile" in labels
                else "A_roster_tour")
    return "C_regular_season"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("transcript")
    ap.add_argument("-o", "--out", default="work/analysis.json")
    ap.add_argument("--lexicon", default=None)
    args = ap.parse_args()

    require("ffmpeg", "ffprobe")
    if not Path(args.video).exists():
        die(f"no such file: {args.video}")

    utterances = read_json(args.transcript)["segments"]
    if not utterances:
        die("transcript has no segments")

    duration = probe_duration(args.video)
    print("reading audio energy envelope...")
    envelope = audio_rms_envelope(args.video)
    print("detecting silence...")
    silence = detect_silence(args.video)

    matchers = build_matchers(load_lexicon(Path(args.lexicon) if args.lexicon else None))
    annotated = annotate(utterances, matchers, envelope, duration)
    segments = segment(annotated, duration)
    episode_type = detect_episode_type(segments, duration)

    write_json(args.out, {
        "source": args.video,
        "duration": round(duration, 2),
        "episode_type": episode_type,
        "segments": segments,
        "utterances": annotated,
        "silence": [{"start": round(a, 2), "end": round(b, 2)} for a, b in silence],
        "highlights": highlights(annotated),
    })

    dead = sum(b - a for a, b in silence)
    print(f"\nepisode type : {episode_type}")
    print(f"duration     : {hhmmss(duration)}")
    print(f"segments     : {len(segments)}")
    print(f"dead air     : {hhmmss(dead)} across {len(silence)} spans")
    print(f"\n{'label':<20} {'start':>12} {'dur':>10}  info")
    for seg in segments:
        flag = "yes" if seg["is_information"] else ""
        print(f"{seg['label']:<20} {seg['start_tc']:>12} "
              f"{hhmmss(seg['duration']):>10}  {flag}")
    print(f"\n-> {args.out}")


if __name__ == "__main__":
    main()
