# Olympians & War — hand-drawn doodle animation pipeline

Generates the 4-part "Olympic Runners of WWI/WWII" explainer video as a
whiteboard-style hand-drawn doodle animation, entirely in code (no AI image
generation credits used). Cut to the exact section timestamps supplied for
the narration, rendered silent so a voiceover can be dropped on top and stay
in sync.

## Sections

| # | Title | Timestamps | Duration | Images | People |
|---|-------|-----------|----------|--------|--------|
| 1 | The First Weeks | 0:00-3:23 | 203s | 40 | Bouin, Halswelle, Wilding |
| 2 | The Long Middle | 3:23-8:03 | 280s | 56 | Bell, Tull, Grant, Hobey Baker |
| 3 | The Next One | 8:03-11:36 | 213s | 43 | Kusocinski, Nile Kinnick, Paddock |
| 4 | The Last Months | 11:36-15:06 | 210s | 41 | Blozis, Takeichi Nishi, Lummus (+ outro CTA) |

Output: `output/final/section{1-4}_*.mp4`, 1920x1080, 24fps, silent, H.264.

## Pipeline

- `render/doodle.py` — core primitives: hand-wobbled ink strokes (Catmull-Rom
  smoothed or straight-edged, with perpendicular sine-wave jitter + overshoot
  to fake a marker that doesn't lift cleanly), sketchy cross-hatch fill, and
  a cached cream paper-grain texture. Palette: paper cream / near-black ink /
  muted olive-drab / faded brick red.
- `render/library.py` — parametric stick figures (two-segment limbs driven by
  named pose presets) plus a ~25-piece prop kit (rifle, biplane, trench,
  barbed wire, medal, Olympic rings, tank, mountains, gravestone, ship,
  trophy, name-card banner, etc). Extreme-lean poses (collapsed, prone,
  mourning) are hand-authored silhouettes rather than the generic rig pushed
  to angles it can't render legibly.
- `render/compose.py` — turns a scene spec into an ordered stroke list, plays
  it back as a short "marker drawing on" reveal followed by a held frame with
  a slow Ken Burns drift, and encodes straight to a per-scene MP4 via an
  ffmpeg subprocess fed raw RGB frames over stdin.
- `render/scenes_data.py` — the 180-scene manifest: per-person storyboards
  (6-8 beats each) compiled into exact-timed scene dicts against the given
  section boundaries. `python3 -m render.scenes_data` validates counts/timing.
- `render/render_video.py` — parallel scene rendering (multiprocessing pool)
  + lossless `ffmpeg concat` per section, with cumulative frame-boundary
  rounding so a section's total duration can't drift from independent
  per-scene rounding.

## Corrected on-screen spellings

Halswelle, Hobey Baker, Kusocinski, Nile Kinnick, Blozis, Takeichi Nishi,
Lummus, Neuve-Chapelle, Aubers Ridge, Contalmaison.

## Re-rendering

```
python3 -m render.scenes_data      # validate manifest
python3 -m render.render_video     # render everything to output/final/
```

Requires `ffmpeg` (via `imageio_ffmpeg`'s bundled static binary) and
Pillow/numpy. Fonts (Permanent Marker, Patrick Hand, Caveat) live in
`assets/fonts/`.
