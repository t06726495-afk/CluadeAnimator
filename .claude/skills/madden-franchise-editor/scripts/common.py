"""Shared helpers for the Madden franchise editor pipeline."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from array import array
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
LEXICON_PATH = SKILL_DIR / "references" / "cue-lexicon.json"


# --------------------------------------------------------------------------- io

def load_lexicon(path: Path | None = None) -> dict:
    with open(path or LEXICON_PATH) as f:
        return json.load(f)


def read_json(path: str | Path) -> dict:
    with open(path) as f:
        return json.load(f)


def write_json(path: str | Path, data: dict) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def require(*binaries: str) -> None:
    missing = [b for b in binaries if not shutil.which(b)]
    if missing:
        die(
            f"missing required binaries: {', '.join(missing)}\n"
            "install with: apt install ffmpeg   (or: brew install ffmpeg)"
        )


# ---------------------------------------------------------------------- ffprobe

def probe_duration(video: str | Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


# ------------------------------------------------------------------ time format

def hhmmss(seconds: float) -> str:
    seconds = max(0.0, seconds)
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def srt_time(seconds: float) -> str:
    return hhmmss(seconds).replace(".", ",")


def parse_time(value: str) -> float:
    """Accept SS, MM:SS or HH:MM:SS."""
    parts = [float(p) for p in str(value).split(":")]
    total = 0.0
    for p in parts:
        total = total * 60 + p
    return total


# --------------------------------------------------------------- pattern engine

def compile_patterns(patterns: list[str]) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


def any_match(compiled: list[re.Pattern], text: str) -> bool:
    return any(p.search(text) for p in compiled)


def match_names(compiled: list[re.Pattern], text: str) -> list[str]:
    return [p.pattern for p in compiled if p.search(text)]


# ------------------------------------------------------------- audio energy/RMS

def audio_rms_envelope(video: str | Path, window: float = 0.5) -> list[tuple[float, float]]:
    """RMS energy per window. Returns [(t_seconds, rms_0_to_1), ...].

    Decodes to 8 kHz mono s16le — plenty for an energy envelope and cheap to hold
    in memory for a 60-minute source. No third-party dependencies.
    """
    rate = 8000
    proc = subprocess.run(
        [
            "ffmpeg", "-v", "error", "-i", str(video),
            "-vn", "-ac", "1", "-ar", str(rate), "-f", "s16le", "-",
        ],
        capture_output=True, check=True,
    )
    samples = array("h")
    samples.frombytes(proc.stdout[: len(proc.stdout) // 2 * 2])

    per_window = max(1, int(rate * window))
    envelope: list[tuple[float, float]] = []
    for i in range(0, len(samples), per_window):
        chunk = samples[i : i + per_window]
        if not chunk:
            continue
        total = sum(float(s) * float(s) for s in chunk)
        rms = (total / len(chunk)) ** 0.5 / 32768.0
        envelope.append((i / rate, rms))
    return envelope


def detect_silence(
    video: str | Path, threshold_db: int = -35, min_duration: float = 1.2
) -> list[tuple[float, float]]:
    """Silent spans via ffmpeg silencedetect. Returns [(start, end), ...]."""
    proc = subprocess.run(
        [
            "ffmpeg", "-v", "info", "-i", str(video),
            "-af", f"silencedetect=noise={threshold_db}dB:d={min_duration}",
            "-f", "null", "-",
        ],
        capture_output=True, text=True,
    )
    spans, start = [], None
    for line in proc.stderr.splitlines():
        if "silence_start:" in line:
            start = float(line.split("silence_start:")[1].split()[0])
        elif "silence_end:" in line and start is not None:
            spans.append((start, float(line.split("silence_end:")[1].split()[0])))
            start = None
    return spans


# ------------------------------------------------------------------- transcript

def normalize_transcript(raw: dict) -> list[dict]:
    """Accept whisper.cpp / openai-whisper / groq shapes -> [{start, end, text}]."""
    segments = raw.get("segments") or raw.get("transcription") or []
    out = []
    for seg in segments:
        if "offsets" in seg:  # whisper.cpp
            start = seg["offsets"]["from"] / 1000.0
            end = seg["offsets"]["to"] / 1000.0
            text = seg.get("text", "")
        else:
            start = float(seg.get("start", 0.0))
            end = float(seg.get("end", start))
            text = seg.get("text", "")
        text = text.strip()
        if text:
            out.append({"start": start, "end": end, "text": text})
    return out
