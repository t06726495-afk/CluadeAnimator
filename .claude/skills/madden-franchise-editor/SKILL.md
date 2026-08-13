---
name: madden-franchise-editor
description: Edit raw Madden Franchise gameplay footage into a finished episode in this series' style. Use when handed a long Madden/College Football franchise recording (typically 30-60 min of gameplay plus commentary) that needs cutting down — produces a rough cut, numbered clips for CapCut, captions, and edit notes. Triggers on "edit this Madden footage", "cut down my franchise episode", "make an episode from this recording".
---

# Madden Franchise Editor

Turns a raw franchise recording into an edited episode: cut list, rough cut,
numbered clips ready for CapCut, captions, and notes on what still needs doing
by hand.

The style is learned from 8 reference transcripts (Madden 26 Browns EP1–6,
Madden 27 Commanders EP1–2) plus a visual-grammar analysis of the reference
videos. Two files carry it:

- **`references/series-profile.md`** — episode skeletons, timing, voice,
  catchphrases, CTA placement. **Read this first.**
- **`references/edit-grammar.md`** — what appears on screen and when to change
  it. **Read this before making any cut decision.**

`references/cue-lexicon.json` is the machine-readable version the scripts use.

---

## Before you start

Check the tooling:

```bash
ffmpeg -version && ffprobe -version
```

Missing? `apt install ffmpeg` or `brew install ffmpeg`.

Transcription needs one of: `whisper-cli` (whisper.cpp, local and free — the
default), the `whisper` Python package, or `GROQ_API_KEY` / `OPENAI_API_KEY` in
the environment. Prefer local: an hour of footage is a large upload, and the
audio never has to leave the machine.

---

## Pipeline

Six stages. Run them in order from the skill directory, pointing at your footage.

```bash
SKILL=.claude/skills/madden-franchise-editor
RAW=~/recordings/week9.mp4

# 1. Transcript with timestamps
python3 $SKILL/scripts/transcribe.py "$RAW" -o work/transcript.json

# 2. Classify segments, score every moment
python3 $SKILL/scripts/analyze.py "$RAW" work/transcript.json -o work/analysis.json

# 3. Build the edit decision list
python3 $SKILL/scripts/build_edl.py work/analysis.json -o work/edl.json --target 22

# 4. Check it against the style rules
python3 $SKILL/scripts/qa.py work/edl.json work/analysis.json

# 5. Render
python3 $SKILL/scripts/render.py work/edl.json work/analysis.json -o out/

# 6. Read the notes before opening CapCut
cat out/edit_notes.md
```

**Stop and look at stage 2's output before continuing.** It prints the detected
episode type and every segment it found. If the segmentation is wrong, nothing
downstream will be right — see Troubleshooting.

---

## What you get

```
out/
  rough_cut.mp4          assembled edit
  clips/001_cold-open.mp4 ... numbered, in order — drag the folder into CapCut
  captions.srt           timed to the cut timeline, not the source
  caption_emphasis.json  which words to accent
  edit_notes.md          cuts made, highlight moments, comedy candidates, to-do list
```

CapCut doesn't import EDL or FCPXML usefully, which is why the deliverable is
clips plus a rough cut rather than a project file. `work/edl.json` remains the
machine-readable source of truth if you ever want to re-render differently.

---

## Your job vs. the pipeline's

The scripts place cuts. They cannot see the screen — every decision comes from
the narration, audio energy, and silence. So:

**The pipeline handles:** dead air, filler and restarts, pre-snap waiting,
low-value plays, segment structure, caption timing, highlight ranking.

**You handle:** whether the segmentation actually matches the footage, whether a
kept play is visually worth keeping, and everything in the to-do list at the
bottom of `edit_notes.md` — graphics, zooms, comedic inserts, music.

When you review the EDL, read `edit-grammar.md` and check the judgment calls the
scripts can't make. Particularly: **is a menu being explained, or traversed?**
Explained stays, traversed goes. The scripts approximate this from narration
density; you can tell by looking.

---

## Tuning

| Symptom | Fix |
|---|---|
| Too long | `--target 20` on build_edl, or raise `--play-floor` |
| Too choppy | Lower `--play-floor` (try 0.3); raise `--min-silence` to 1.8 |
| Good plays dropped | Lower `--play-floor`; check the highlight list in analysis.json |
| Roster talk feels rushed | Those are information segments — if they're being cut, the segmentation mislabelled them |
| Sponsor read still in | QA warns about it; remove that span from the EDL by hand |

`--target` iteratively raises the play floor until the runtime fits. It never
compresses information segments to hit a number — per the style guide, those
breathe regardless.

---

## Episode types

Stage 2 detects which one it's looking at. From `series-profile.md`:

- **Type A — roster tour.** No gameplay. Position-by-position. Nearly everything
  is an information segment; expect light cutting only.
- **Type B — preseason.** Games are evidence for roster decisions. The 53-man
  cuts section is the payoff, not an afterthought.
- **Type C — regular season.** Game blocks with halftime report, postgame
  analysis, weekly recap. The most aggressive cutting happens here.
- **Type D — prospect profile.** Usually embedded in another episode. Pure
  information; barely cut at all.

If detection is wrong, the segment labels will look obviously off in stage 2's
printout. Fix the cue that misfired rather than overriding the type.

---

## Troubleshooting

**Segmentation looks wrong.** Open `work/analysis.json` and read the `segments`
array against the transcript. The likely cause is a cue pattern in
`cue-lexicon.json` that either didn't fire or fired somewhere unexpected. Cues
are regex, matched case-insensitively per utterance. Add or tighten patterns —
this file is meant to grow as more episodes go through it.

**Everything is one giant segment.** No boundary cues matched. Usually a
transcription quality problem — check `work/transcript.json` reads like English.
A larger Whisper model helps.

**Catchphrases getting cut.** QA reports these as failures. They're protected in
gameplay condensing but not if the whole segment was mislabelled. Check the
segment label around that timestamp.

**Render fails on some spans.** ffmpeg warns per clip and continues. A few
failures are survivable; many means the source has issues — try remuxing:
`ffmpeg -i raw.mp4 -c copy fixed.mp4`.

---

## Extending

The cue lexicon is the part that improves with use. When an episode gets edited
and something lands wrong, the fix is almost always a pattern:

- New catchphrase → `catchphrases`
- A segment boundary missed → `segment_boundaries`, matching label
- A hype moment scored too low → `hype_markers`, appropriate tier
- Filler that survived → `filler`

Adding transcripts from more episodes will sharpen the timing model in
`series-profile.md`. The structure held consistent across two different teams and
two different Madden versions, so it generalises — but more samples make the
duration medians tighter.
