"""Voiceover generation with pluggable TTS providers.

Providers:
- ``elevenlabs``: used automatically when ELEVENLABS_API_KEY is set.
- ``none``: no audio; scene durations are estimated from narration length.

Either way this stage produces a ``timing.json`` manifest that drives the
render stage, plus a ``captions.srt`` subtitle file.
"""

from __future__ import annotations

import json
import os
import subprocess
from typing import Optional

import httpx

from .models import Storyboard, SceneTiming, TimingManifest

WORDS_PER_SECOND = 2.4
MIN_SCENE_SECONDS = 4.0
MAX_SCENE_SECONDS = 25.0

ELEVENLABS_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
ELEVENLABS_MODEL = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")


def _estimate_duration(text: str) -> float:
    words = len(text.split())
    return max(MIN_SCENE_SECONDS, min(MAX_SCENE_SECONDS, words / WORDS_PER_SECOND + 1.2))


def _audio_duration(path: str) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path,
        ],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def _elevenlabs_tts(text: str, out_path: str, api_key: str) -> None:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE}"
    response = httpx.post(
        url,
        headers={"xi-api-key": api_key, "accept": "audio/mpeg"},
        json={"text": text, "model_id": ELEVENLABS_MODEL},
        timeout=120,
    )
    response.raise_for_status()
    with open(out_path, "wb") as f:
        f.write(response.content)


def generate_voiceover(storyboard: Storyboard, audio_dir: str) -> TimingManifest:
    os.makedirs(audio_dir, exist_ok=True)
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    timings = []
    for scene in storyboard.scenes:
        audio_file: Optional[str] = None
        if api_key:
            audio_file = os.path.join(audio_dir, f"scene_{scene.number:02d}.mp3")
            if not os.path.exists(audio_file):
                _elevenlabs_tts(scene.narration, audio_file, api_key)
            # Leave a beat of air after the narration ends.
            duration = _audio_duration(audio_file) + 0.8
        else:
            duration = _estimate_duration(scene.narration)
        timings.append(
            SceneTiming(number=scene.number, duration=round(duration, 2), audio_file=audio_file)
        )
    manifest = TimingManifest(
        scenes=timings, total_duration=round(sum(t.duration for t in timings), 2)
    )
    with open(os.path.join(audio_dir, "timing.json"), "w") as f:
        f.write(manifest.model_dump_json(indent=2))
    return manifest


def _srt_timestamp(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, rem = divmod(ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_captions(storyboard: Storyboard, manifest: TimingManifest, srt_path: str) -> None:
    """One caption cue per sentence, spread across each scene's duration."""
    cues = []
    clock = 0.0
    durations = {t.number: t.duration for t in manifest.scenes}
    for scene in storyboard.scenes:
        scene_duration = durations[scene.number]
        sentences = [s.strip() for s in scene.narration.replace("? ", "?|").replace("! ", "!|").replace(". ", ".|").split("|") if s.strip()]
        if not sentences:
            clock += scene_duration
            continue
        total_words = sum(len(s.split()) for s in sentences) or 1
        cursor = clock
        for sentence in sentences:
            share = len(sentence.split()) / total_words
            end = cursor + scene_duration * share
            cues.append((cursor, min(end, clock + scene_duration), sentence))
            cursor = end
        clock += scene_duration
    with open(srt_path, "w") as f:
        for i, (start, end, text) in enumerate(cues, 1):
            f.write(f"{i}\n{_srt_timestamp(start)} --> {_srt_timestamp(end)}\n{text}\n\n")


def load_manifest(audio_dir: str) -> TimingManifest:
    with open(os.path.join(audio_dir, "timing.json")) as f:
        return TimingManifest.model_validate(json.load(f))
