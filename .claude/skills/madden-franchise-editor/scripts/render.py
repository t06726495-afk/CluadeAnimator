#!/usr/bin/env python3
"""Render the EDL.

Produces, in the output directory:
  rough_cut.mp4          the assembled edit
  clips/NNN_label.mp4    numbered, in order — drag straight into CapCut
  captions.srt           plain subtitles, timed to the CUT timeline
  caption_emphasis.json  which words to accent (CapCut can't do this from SRT)
  edit_notes.md          what was cut and where to add graphics

    python3 render.py work/edl.json work/analysis.json -o out/
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from common import die, hhmmss, read_json, require, srt_time, write_json

# Words worth accenting per edit-grammar.md: names, numbers, conclusions.
EMPHASIS_HINTS = (
    "touchdown", "intercepted", "sacked", "fumble", "first down", "unbelievable",
    "phenomenal", "dominant", "elite", "rookie", "overall", "million",
    "record", "win", "loss", "injured", "cut", "traded", "signed",
)


def cut_clip(source: Path, start: float, end: float, dest: Path) -> bool:
    """Re-encode the span. Frame-accurate; stream copy would snap to keyframes."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y",
            "-ss", f"{start:.3f}", "-i", str(source), "-t", f"{end - start:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k",
            "-avoid_negative_ts", "make_zero",
            str(dest),
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"  warn: failed {hhmmss(start)}–{hhmmss(end)}: "
              f"{result.stderr.strip().splitlines()[-1] if result.stderr else '?'}")
        return False
    return True


def concat(clips: list[Path], dest: Path, workdir: Path) -> None:
    listing = workdir / "concat.txt"
    listing.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
         "-i", str(listing), "-c", "copy", str(dest)],
        check=True,
    )


def map_timeline(edl: dict) -> list[tuple[float, float, float]]:
    """[(source_start, source_end, output_start)] for translating timestamps."""
    mapping, cursor = [], 0.0
    for decision in edl["decisions"]:
        for span in decision["spans"]:
            mapping.append((span["start"], span["end"], cursor))
            cursor += span["end"] - span["start"]
    return mapping


def to_output_time(mapping, t: float) -> float | None:
    for src_start, src_end, out_start in mapping:
        if src_start <= t < src_end:
            return out_start + (t - src_start)
    return None


def build_captions(edl: dict, analysis: dict, outdir: Path) -> int:
    mapping = map_timeline(edl)
    lines, emphasis, index = [], [], 1

    for utt in analysis["utterances"]:
        start = to_output_time(mapping, utt["start"])
        if start is None:
            continue
        end = to_output_time(mapping, min(utt["end"], utt["start"] + 6))
        if end is None or end <= start:
            end = start + min(utt["end"] - utt["start"], 6)

        text = utt["text"].strip()
        lines.append(f"{index}\n{srt_time(start)} --> {srt_time(end)}\n{text}\n")

        lowered = text.lower()
        words = [w for w in EMPHASIS_HINTS if w in lowered]
        if utt["is_catchphrase"] or utt["score"] > 0.55 or words:
            emphasis.append({
                "index": index,
                "at": round(start, 2),
                "at_tc": hhmmss(start),
                "text": text,
                "accent": words[:2],
                "why": ("catchphrase" if utt["is_catchphrase"]
                        else "high-energy moment" if utt["score"] > 0.55
                        else "key term"),
            })
        index += 1

    (outdir / "captions.srt").write_text("\n".join(lines))
    write_json(outdir / "caption_emphasis.json", {
        "note": "Accent these words; leave the rest of each line neutral. "
                "See references/edit-grammar.md.",
        "entries": emphasis,
    })
    return len(lines)


def write_notes(edl: dict, analysis: dict, outdir: Path, clips: list[dict]) -> None:
    mapping = map_timeline(edl)
    src, run = edl["source_duration"], edl["runtime"]

    out = [
        "# Edit notes",
        "",
        f"- Source: `{edl['source']}`",
        f"- Episode type: **{edl['episode_type']}**",
        f"- {hhmmss(src)} raw -> {hhmmss(run)} cut "
        f"({run / src * 100:.0f}% retained)",
        f"- Play score floor: {edl['play_floor']}",
        "",
        "## Clips",
        "",
        "In order. Import the whole folder into CapCut and they'll lay down",
        "in sequence.",
        "",
        "| # | Segment | Runtime | Source in | Source out |",
        "|---|---|---|---|---|",
    ]
    for c in clips:
        out.append(
            f"| {c['n']:03d} | {c['label']} | {hhmmss(c['end'] - c['start'])} "
            f"| {hhmmss(c['start'])} | {hhmmss(c['end'])} |"
        )

    out += ["", "## What each segment got", "",
            "| Segment | Action | Reason |", "|---|---|---|"]
    for d in edl["decisions"]:
        out.append(f"| {d['label']} | {d['action']} | {d['reason']} |")

    out += ["", "## Highlight moments", "",
            "Ranked by commentary energy. These are your Shorts candidates and",
            "the places worth a zoom or a sound effect.", "",
            "| Cut time | Source time | Score | Line |", "|---|---|---|---|"]
    for h in edl["highlights"]:
        at = to_output_time(mapping, h["start"])
        if at is None:
            continue
        text = h["text"][:90].replace("|", "\\|")
        out.append(f"| {hhmmss(at)} | {h['start_tc']} | {h['score']:.2f} | {text} |")

    comedy = [b for s in analysis["segments"] for b in s["comedy_beats"]]
    if comedy:
        out += ["", "## Comedic insert candidates", "",
                "Flagged by the cue lexicon. Use only a fraction — comedy works",
                "here because it interrupts an information-driven edit.", "",
                "| Cut time | Type | Line |", "|---|---|---|"]
        for beat in comedy:
            at = to_output_time(mapping, beat["time"])
            if at is None:
                continue
            text = beat["text"][:90].replace("|", "\\|")
            out.append(f"| {hhmmss(at)} | {', '.join(beat['kinds'])} | {text} |")

    phrases = [p for s in analysis["segments"] for p in s["catchphrases"]]
    if phrases:
        out += ["", "## Catchphrases preserved", ""]
        out += [f"- {p}" for p in dict.fromkeys(phrases)]

    out += ["", "## To do by hand", "",
            "The pipeline places cuts. These still need you:", "",
            "- Score bugs, stat cards and depth-chart overlays",
            "- Caption accent colours (see `caption_emphasis.json`)",
            "- Zooms on the highlight moments above",
            "- Comedic inserts from the candidate list",
            "- Music bed, ducked under narration",
            "- Screenshots or news visuals where the narration references them",
            ""]

    (outdir / "edit_notes.md").write_text("\n".join(out))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl")
    ap.add_argument("analysis")
    ap.add_argument("-o", "--out", default="out")
    ap.add_argument("--no-concat", action="store_true",
                    help="write clips only, skip the assembled rough cut")
    args = ap.parse_args()

    require("ffmpeg", "ffprobe")
    edl, analysis = read_json(args.edl), read_json(args.analysis)
    source = Path(edl["source"])
    if not source.exists():
        die(f"source footage not found: {source}")

    outdir = Path(args.out)
    clipdir = outdir / "clips"
    clipdir.mkdir(parents=True, exist_ok=True)

    paths, records, n = [], [], 1
    for decision in edl["decisions"]:
        for span in decision["spans"]:
            label = decision["label"].replace("_", "-")
            dest = clipdir / f"{n:03d}_{label}.mp4"
            print(f"  [{n:03d}] {label} "
                  f"{hhmmss(span['start'])}–{hhmmss(span['end'])}")
            if cut_clip(source, span["start"], span["end"], dest):
                paths.append(dest)
                records.append({"n": n, "label": decision["label"],
                                "start": span["start"], "end": span["end"]})
                n += 1

    if not paths:
        die("no clips rendered — check the EDL")

    if not args.no_concat:
        print("assembling rough cut...")
        concat(paths, outdir / "rough_cut.mp4", outdir)

    count = build_captions(edl, analysis, outdir)
    write_notes(edl, analysis, outdir, records)

    print(f"\n{len(paths)} clips, {count} caption lines -> {outdir}/")
    if not args.no_concat:
        print(f"rough cut: {outdir}/rough_cut.mp4  ({hhmmss(edl['runtime'])})")
    print(f"read {outdir}/edit_notes.md before opening CapCut")


if __name__ == "__main__":
    main()
