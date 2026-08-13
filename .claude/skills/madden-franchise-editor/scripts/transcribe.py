#!/usr/bin/env python3
"""Produce a timestamped transcript from raw footage.

Backends, in order of preference:
  whisper.cpp  -- local, free, no upload   (--backend cpp,   needs `whisper-cli`)
  faster-whisper / openai-whisper (local)  (--backend local, needs `whisper`)
  Groq API     -- fast + cheap             (--backend groq,  needs GROQ_API_KEY)
  OpenAI API                               (--backend openai, needs OPENAI_API_KEY)

Local backends are the default because a 60-minute recording is a large upload
and the audio never needs to leave the machine.

    python3 transcribe.py raw.mp4 -o work/transcript.json
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

from common import die, normalize_transcript, require, write_json

CHUNK_SECONDS = 900  # 15 min — keeps API uploads under the 25 MB cap


def extract_audio(video: Path, out: Path, start: float | None = None,
                  duration: float | None = None) -> Path:
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if start is not None:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(video)]
    if duration is not None:
        cmd += ["-t", str(duration)]
    cmd += ["-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", str(out)]
    subprocess.run(cmd, check=True)
    return out


# ------------------------------------------------------------------- local paths

def run_whisper_cpp(audio: Path, model: str) -> dict:
    binary = shutil.which("whisper-cli") or shutil.which("main")
    if not binary:
        die("whisper.cpp not found — install it or use --backend groq")
    out_prefix = audio.with_suffix("")
    subprocess.run(
        [binary, "-m", model, "-f", str(audio), "-oj", "-of", str(out_prefix)],
        check=True,
    )
    with open(f"{out_prefix}.json") as f:
        return json.load(f)


def run_whisper_local(audio: Path, model: str) -> dict:
    if not shutil.which("whisper"):
        die("`whisper` not on PATH — pip install openai-whisper, or use --backend groq")
    outdir = audio.parent
    subprocess.run(
        ["whisper", str(audio), "--model", model, "--output_format", "json",
         "--output_dir", str(outdir), "--language", "en"],
        check=True,
    )
    with open(outdir / f"{audio.stem}.json") as f:
        return json.load(f)


# --------------------------------------------------------------------- API paths

def post_audio(url: str, key: str, model: str, audio: Path) -> dict:
    boundary = "----maddenedit"
    body = bytearray()
    for field, value in (("model", model), ("response_format", "verbose_json")):
        body += (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\""
            f"\r\n\r\n{value}\r\n"
        ).encode()
    body += (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
        f"filename=\"{audio.name}\"\r\nContent-Type: audio/mpeg\r\n\r\n"
    ).encode()
    body += audio.read_bytes() + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        url, data=bytes(body),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with urllib.request.urlopen(req, timeout=900) as resp:
        return json.loads(resp.read())


def run_api(video: Path, workdir: Path, backend: str) -> dict:
    if backend == "groq":
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        key, model = os.environ.get("GROQ_API_KEY"), "whisper-large-v3"
    else:
        url = "https://api.openai.com/v1/audio/transcriptions"
        key, model = os.environ.get("OPENAI_API_KEY"), "whisper-1"
    if not key:
        die(f"{backend.upper()}_API_KEY not set")

    from common import probe_duration

    total = probe_duration(video)
    segments: list[dict] = []
    offset = 0.0
    idx = 0
    while offset < total:
        span = min(CHUNK_SECONDS, total - offset)
        chunk = extract_audio(video, workdir / f"chunk{idx}.mp3", offset, span)
        print(f"  transcribing {offset:.0f}s–{offset + span:.0f}s", file=sys.stderr)
        try:
            result = post_audio(url, key, model, chunk)
        except Exception as exc:  # noqa: BLE001 - partial transcripts are useful
            print(f"  chunk at {offset:.0f}s failed: {exc}", file=sys.stderr)
            offset += span
            idx += 1
            continue
        for seg in normalize_transcript(result):
            seg["start"] += offset
            seg["end"] += offset
            segments.append(seg)
        chunk.unlink(missing_ok=True)
        offset += span
        idx += 1
    return {"segments": segments}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("-o", "--out", default="work/transcript.json")
    ap.add_argument("--backend", default="cpp",
                    choices=["cpp", "local", "groq", "openai"])
    ap.add_argument("--model", default="models/ggml-base.en.bin",
                    help="whisper.cpp model path, or model name for --backend local")
    args = ap.parse_args()

    require("ffmpeg", "ffprobe")
    video = Path(args.video)
    if not video.exists():
        die(f"no such file: {video}")

    workdir = Path(args.out).parent / "audio"
    workdir.mkdir(parents=True, exist_ok=True)

    if args.backend in ("groq", "openai"):
        raw = run_api(video, workdir, args.backend)
        segments = raw["segments"]
    else:
        audio = extract_audio(video, workdir / "full.wav")
        raw = (run_whisper_cpp(audio, args.model) if args.backend == "cpp"
               else run_whisper_local(audio, args.model))
        segments = normalize_transcript(raw)

    if not segments:
        die("transcription produced no segments")

    write_json(args.out, {"source": str(video), "segments": segments})
    print(f"{len(segments)} utterances -> {args.out}")


if __name__ == "__main__":
    main()
