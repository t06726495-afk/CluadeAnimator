# CluadeAnimator — Sports History Video Agent

An AI agent that turns a one-line topic into an **animated sports history YouTube video**:
researched facts, a scene-by-scene script, motion-graphic visuals, captions, voiceover,
and a final 1080p MP4 — plus a ready-to-paste YouTube title/description/tags file.

```
"The 1980 Miracle on Ice"
        │
        ▼
┌────────────┐   ┌─────────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐
│  research  │ → │ storyboard  │ → │  assets  │ → │ voiceover │ → │  render  │
│ Claude +   │   │ Claude      │   │ 1080p    │   │ TTS +     │   │ ffmpeg   │
│ web search │   │ structured  │   │ motion-  │   │ timing +  │   │ KenBurns │
│            │   │ outputs     │   │ graphics │   │ captions  │   │ + audio  │
└────────────┘   └─────────────┘   └──────────┘   └───────────┘   └──────────┘
```

## Quick start

```bash
pip install -r requirements.txt
# ffmpeg must be on PATH (apt install ffmpeg / brew install ffmpeg)

# No API key needed — renders a built-in Miracle on Ice sample:
python -m sports_history_agent demo --burn-captions

# The real thing (needs ANTHROPIC_API_KEY, or `ant auth login`):
export ANTHROPIC_API_KEY=sk-ant-...
python -m sports_history_agent create "The 1980 Miracle on Ice" --burn-captions
```

Output lands in `projects/<topic-slug>/`:

| File | What it is |
|---|---|
| `final.mp4` | The finished 1080p/30fps video |
| `research.json` | Verified research brief (facts + sources, timeline, quotes) |
| `storyboard.json` | Full script: narration, on-screen text, visual specs per scene |
| `assets/scene_NN.png` | The rendered scene cards |
| `captions.srt` | Sidecar subtitles (upload to YouTube, or `--burn-captions`) |
| `youtube.txt` | Title, description, and tags ready to paste |

## How it works

1. **Research** — Claude (Opus 4.8) with the server-side web search tool verifies the
   story: scores, dates, key figures, real quotes, sources. No invented facts.
2. **Storyboard** — Claude writes a hook-first YouTube script as structured output
   (`Storyboard` pydantic schema): 10–16 scenes, each with narration, an on-screen
   visual spec (title / scene / stat / quote / timeline card), and an AI-image prompt.
3. **Assets** — each scene is rendered as a designed 1920×1080 card with Pillow
   (accent color chosen by the model to match the team/era).
4. **Voiceover** — if `ELEVENLABS_API_KEY` is set, narration is synthesized per scene
   and scene durations follow the real audio; otherwise durations are estimated from
   narration length and the video renders with a silent track (record your own VO over
   it, or use the SRT timings). Captions are generated either way.
5. **Render** — ffmpeg gives every card Ken Burns motion (alternating zoom-in /
   zoom-out / pans), edge fades, per-scene audio, then concatenates and optionally
   burns captions and mixes background music.

## CLI options

```
python -m sports_history_agent create TOPIC
    --scenes N          number of scenes (default 12)
    --project DIR       project directory (default projects/<slug>)
    --music FILE        background music, mixed at low volume and looped
    --burn-captions     hard-burn subtitles into the video
    --force             re-run research/storyboard even if artifacts exist

python -m sports_history_agent demo [--burn-captions] [--music FILE]
```

Stages are resumable: artifacts that already exist are reused, so you can edit
`storyboard.json` by hand and re-run `create` to re-render with your edits.

## Using AI-generated imagery

Every scene's `visual.image_prompt` in `storyboard.json` is a ready-made prompt for an
image model. Generate images with any provider and drop them in as
`projects/<slug>/assets/custom/scene_NN.png` — the renderer will use each one as the
card background (darkened, with the typography composited on top), then re-run the
pipeline to rebuild the video.

## Environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API access for research + storyboard (or use `ant auth login`) |
| `ELEVENLABS_API_KEY` | Optional: real TTS narration |
| `ELEVENLABS_VOICE_ID` | Optional: override the default voice |

## Repo layout

```
sports_history_agent/
  __main__.py       CLI (create / demo)
  pipeline.py       stage orchestration + artifact caching
  claude_stages.py  Claude API calls (research w/ web search, storyboard)
  models.py         pydantic schemas (double as structured-output formats)
  prompts.py        system/user prompts for both Claude stages
  assets.py         Pillow renderer for the five card types
  voiceover.py      TTS providers, scene timing, SRT generation
  render.py         ffmpeg: Ken Burns clips, concat, captions, music
  demo.py           built-in sample storyboard (no API key needed)
```
