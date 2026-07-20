"""Assemble the final video with ffmpeg.

Each scene card gets Ken Burns motion (alternating zoom-in / zoom-out / pan),
a fade at each edge, and its narration audio. Clips are concatenated, then an
optional final pass burns captions and/or mixes background music.
"""

from __future__ import annotations

import os
import subprocess
from typing import List, Optional

from .models import Storyboard, TimingManifest

FPS = 30
# Oversample the still before zoompan so sub-pixel motion stays smooth.
SRC_W, SRC_H = 3840, 2160


def _run(cmd: List[str], cwd: str) -> None:
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{' '.join(cmd)}\n{result.stderr[-3000:]}")


def _motion(index: int, frames: int) -> str:
    center = "x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'"
    presets = [
        f"z='1+0.10*on/{frames}':{center}",                       # slow zoom in
        f"z='max(1.10-0.10*on/{frames},1.001)':{center}",         # slow zoom out
        f"z='1.08':x='(iw-iw/zoom)*(0.10+0.80*on/{frames})':y='(ih-ih/zoom)/2'",  # pan L->R
        f"z='1.08':x='(iw-iw/zoom)*(0.90-0.80*on/{frames})':y='(ih-ih/zoom)/2'",  # pan R->L
    ]
    return presets[index % len(presets)]


def _scene_clip(
    card: str, audio: Optional[str], duration: float, motion_index: int, out_path: str, cwd: str
) -> None:
    frames = max(int(duration * FPS), FPS)
    fade_out = max(duration - 0.4, 0.1)
    vf = (
        f"[0:v]scale={SRC_W}:{SRC_H},"
        f"zoompan={_motion(motion_index, frames)}:d={frames}:s=1920x1080:fps={FPS},"
        f"fade=t=in:d=0.4,fade=t=out:st={fade_out:.2f}:d=0.4,format=yuv420p[v]"
    )
    cmd = ["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", card]
    if audio:
        cmd += ["-i", audio]
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"]
    cmd += [
        "-filter_complex", f"{vf};[1:a]apad[a]",
        "-map", "[v]", "-map", "[a]",
        "-t", f"{duration:.2f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        out_path,
    ]
    _run(cmd, cwd)


def render_video(
    storyboard: Storyboard,
    manifest: TimingManifest,
    project_dir: str,
    burn_captions: bool = False,
    music: Optional[str] = None,
) -> str:
    """Returns the path of the final mp4. All ffmpeg paths are project-relative."""
    clips_dir = os.path.join(project_dir, "clips")
    os.makedirs(clips_dir, exist_ok=True)
    durations = {t.number: (t.duration, t.audio_file) for t in manifest.scenes}

    clip_files = []
    for i, scene in enumerate(storyboard.scenes):
        duration, audio_file = durations[scene.number]
        card = os.path.join("assets", f"scene_{scene.number:02d}.png")
        audio_rel = None
        if audio_file:
            audio_rel = os.path.relpath(audio_file, project_dir)
        clip = os.path.join("clips", f"scene_{scene.number:02d}.mp4")
        _scene_clip(card, audio_rel, duration, i, clip, project_dir)
        clip_files.append(clip)

    concat_list = os.path.join(project_dir, "clips", "concat.txt")
    with open(concat_list, "w") as f:
        for clip in clip_files:
            f.write(f"file '{os.path.basename(clip)}'\n")
    combined = "combined.mp4"
    _run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "clips/concat.txt", "-c", "copy", combined],
        project_dir,
    )

    final = "final.mp4"
    needs_pass = burn_captions or music
    if not needs_pass:
        os.replace(os.path.join(project_dir, combined), os.path.join(project_dir, final))
        return os.path.join(project_dir, final)

    cmd = ["ffmpeg", "-y", "-i", combined]
    filters_v = []
    if burn_captions:
        style = "FontName=DejaVu Sans,FontSize=17,PrimaryColour=&H00FFFFFF,OutlineColour=&HC8000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=36"
        filters_v.append(f"subtitles=captions.srt:force_style='{style}'")
    if music:
        cmd += ["-stream_loop", "-1", "-i", os.path.relpath(music, project_dir)]
        cmd += [
            "-filter_complex",
            "[1:a]volume=0.12[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=3[aout]",
            "-map", "0:v", "-map", "[aout]",
        ]
    else:
        cmd += ["-map", "0:v", "-map", "0:a"]
    if filters_v:
        cmd += ["-vf", ",".join(filters_v), "-c:v", "libx264", "-preset", "medium", "-crf", "18"]
    else:
        cmd += ["-c:v", "copy"]
    cmd += ["-c:a", "aac", "-b:a", "192k", final]
    _run(cmd, project_dir)
    return os.path.join(project_dir, final)
