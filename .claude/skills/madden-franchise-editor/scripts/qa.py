#!/usr/bin/env python3
"""Check an EDL against the style rules before rendering.

Catches the failure modes listed in references/edit-grammar.md — metronomic
pacing, over-cutting, dropped brand beats, information segments compressed too
hard, sponsor material left in.

    python3 qa.py work/edl.json work/analysis.json
"""

from __future__ import annotations

import argparse
import statistics
import sys

from common import hhmmss, read_json

SPONSOR_HINTS = (
    "sponsor", "promo code", "use my code", "check out", "link in the description",
    "today's video is brought to you", "download the app",
)


def spans_of(edl: dict) -> list[dict]:
    return [s for d in edl["decisions"] for s in d["spans"]]


def check_pacing(edl: dict) -> list[tuple[str, str]]:
    lengths = [s["end"] - s["start"] for s in spans_of(edl)]
    if len(lengths) < 4:
        return []
    issues = []
    short = [x for x in lengths if x < 1.5]
    if len(short) / len(lengths) > 0.35:
        issues.append(("FAIL", (
            f"{len(short)}/{len(lengths)} spans are under 1.5s — this is the "
            "'cut every 1-2 seconds' failure. Raise --play-floor or check the "
            "play-boundary cues.")))
    if len(lengths) > 8:
        spread = statistics.pstdev(lengths) / max(statistics.mean(lengths), 1e-6)
        if spread < 0.35:
            issues.append(("WARN", (
                f"shot lengths are unusually uniform (spread {spread:.2f}) — "
                "pacing should vary with narration density, not tick along.")))
    return issues


def check_information_segments(edl: dict) -> list[tuple[str, str]]:
    issues = []
    for d in edl["decisions"]:
        if d["action"] not in ("tighten", "keep"):
            continue
        if "information segment" not in d["reason"]:
            continue
        kept = sum(s["end"] - s["start"] for s in d["spans"])
        if not d["spans"]:
            issues.append(("FAIL", f"information segment '{d['label']}' was emptied"))
            continue
        shortest = min(s["end"] - s["start"] for s in d["spans"])
        if shortest < 2.5:
            issues.append(("WARN", (
                f"'{d['label']}' has a {shortest:.1f}s fragment — stat and roster "
                "screens need time to be read.")))
        if kept < 4:
            issues.append(("WARN",
                           f"'{d['label']}' reduced to {kept:.0f}s — likely over-cut"))
    return issues


def check_brand_beats(edl: dict, analysis: dict) -> list[tuple[str, str]]:
    issues = []
    labels = {d["label"] for d in edl["decisions"] if d["spans"]}
    for required, msg in (
        ("cta_open", "no opening CTA found — the series always has one by ~0:35"),
        ("cta_close", "no closing CTA found"),
    ):
        if required not in labels:
            issues.append(("WARN", msg))

    kept = [(s["start"], s["end"]) for s in spans_of(edl)]

    def is_kept(t: float) -> bool:
        return any(a <= t < b for a, b in kept)

    lost = [
        u["text"] for u in analysis["utterances"]
        if u["is_catchphrase"] and not is_kept(u["start"])
    ]
    for phrase in lost[:6]:
        issues.append(("FAIL", f"catchphrase cut: \"{phrase[:70]}\""))
    return issues


def check_sponsor(edl: dict, analysis: dict) -> list[tuple[str, str]]:
    kept = [(s["start"], s["end"]) for s in spans_of(edl)]
    issues = []
    for utt in analysis["utterances"]:
        lowered = utt["text"].lower()
        if not any(h in lowered for h in SPONSOR_HINTS):
            continue
        if any(a <= utt["start"] < b for a, b in kept):
            issues.append(("WARN", (
                f"possible sponsor read kept at {hhmmss(utt['start'])}: "
                f"\"{utt['text'][:70]}\" — confirm this is intentional")))
    return issues[:5]


def check_runtime(edl: dict) -> list[tuple[str, str]]:
    src, run = edl["source_duration"], edl["runtime"]
    ratio = run / src
    if ratio > 0.85:
        return [("WARN", f"only {(1 - ratio) * 100:.0f}% removed — barely an edit")]
    if ratio < 0.15:
        return [("FAIL", f"{(1 - ratio) * 100:.0f}% removed — almost certainly over-cut")]
    return []


def check_coverage(edl: dict) -> list[tuple[str, str]]:
    """Kept spans must be ordered and non-overlapping or the concat will scramble."""
    spans = spans_of(edl)
    issues = []
    for a, b in zip(spans, spans[1:]):
        if b["start"] < a["end"]:
            issues.append(("FAIL", (
                f"overlapping spans: {hhmmss(a['start'])}–{hhmmss(a['end'])} and "
                f"{hhmmss(b['start'])}–{hhmmss(b['end'])}")))
    for s in spans:
        if s["end"] <= s["start"]:
            issues.append(("FAIL", f"zero-length span at {hhmmss(s['start'])}"))
    return issues[:5]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl")
    ap.add_argument("analysis")
    ap.add_argument("--strict", action="store_true",
                    help="exit non-zero on warnings too")
    args = ap.parse_args()

    edl, analysis = read_json(args.edl), read_json(args.analysis)

    issues: list[tuple[str, str]] = []
    issues += check_coverage(edl)
    issues += check_runtime(edl)
    issues += check_pacing(edl)
    issues += check_information_segments(edl)
    issues += check_brand_beats(edl, analysis)
    issues += check_sponsor(edl, analysis)

    fails = [i for i in issues if i[0] == "FAIL"]
    warns = [i for i in issues if i[0] == "WARN"]

    src, run = edl["source_duration"], edl["runtime"]
    print(f"source {hhmmss(src)} -> edit {hhmmss(run)} "
          f"({run / src * 100:.0f}% retained), {len(spans_of(edl))} spans\n")

    if not issues:
        print("PASS — no issues found")
        return

    for level, msg in fails + warns:
        print(f"{level}: {msg}")

    print(f"\n{len(fails)} failures, {len(warns)} warnings")
    if fails or (args.strict and warns):
        sys.exit(1)


if __name__ == "__main__":
    main()
