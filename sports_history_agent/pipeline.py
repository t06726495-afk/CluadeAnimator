"""Pipeline orchestration: run stages, persist artifacts, resume cheaply.

Project layout:
    projects/<slug>/
        research.json      verified research brief
        storyboard.json    script + scene visuals + YouTube metadata
        assets/            scene_NN.png cards (drop AI art in assets/custom/)
        audio/             narration mp3s + timing.json
        captions.srt
        final.mp4
"""

from __future__ import annotations

import json
import os
import re

from . import assets, render, voiceover
from .models import ResearchBrief, Storyboard


def slugify(topic: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")
    return slug[:60] or "video"


def _load(path: str, model):
    with open(path) as f:
        return model.model_validate(json.load(f))


def _save(path: str, obj) -> None:
    with open(path, "w") as f:
        f.write(obj.model_dump_json(indent=2))


def run(
    topic: str,
    project_dir: str,
    scene_count: int = 12,
    burn_captions: bool = False,
    music: str | None = None,
    force: bool = False,
    storyboard_override: Storyboard | None = None,
) -> str:
    """Run every stage, skipping ones whose artifacts already exist (unless force)."""
    os.makedirs(project_dir, exist_ok=True)
    research_path = os.path.join(project_dir, "research.json")
    storyboard_path = os.path.join(project_dir, "storyboard.json")
    assets_dir = os.path.join(project_dir, "assets")
    audio_dir = os.path.join(project_dir, "audio")
    srt_path = os.path.join(project_dir, "captions.srt")

    if storyboard_override is not None:
        storyboard = storyboard_override
        _save(storyboard_path, storyboard)
    elif not force and os.path.exists(storyboard_path):
        print("[storyboard] using existing storyboard.json")
        storyboard = _load(storyboard_path, Storyboard)
    else:
        from . import claude_stages  # deferred: requires API credentials

        if not force and os.path.exists(research_path):
            print("[research] using existing research.json")
            brief = _load(research_path, ResearchBrief)
        else:
            print(f"[research] researching: {topic} (web search, this can take a few minutes)")
            brief = claude_stages.run_research(topic)
            _save(research_path, brief)
            print(f"[research] saved {research_path}")

        print(f"[storyboard] writing a {scene_count}-scene script")
        storyboard = claude_stages.run_storyboard(brief, scene_count)
        _save(storyboard_path, storyboard)
        print(f"[storyboard] saved {storyboard_path} — \"{storyboard.video_title}\"")

    print(f"[assets] rendering {len(storyboard.scenes)} scene cards")
    assets.render_all(storyboard, assets_dir)

    print("[voiceover] generating narration + timings")
    manifest = voiceover.generate_voiceover(storyboard, audio_dir)
    voiceover.write_captions(storyboard, manifest, srt_path)
    print(f"[voiceover] total runtime ~{manifest.total_duration:.0f}s")

    print("[render] assembling video (ffmpeg)")
    final = render.render_video(storyboard, manifest, project_dir, burn_captions, music)
    print(f"[render] done: {final}")

    meta_path = os.path.join(project_dir, "youtube.txt")
    with open(meta_path, "w") as f:
        f.write(f"TITLE:\n{storyboard.video_title}\n\nDESCRIPTION:\n{storyboard.youtube_description}\n\nTAGS:\n{', '.join(storyboard.tags)}\n")
    return final
