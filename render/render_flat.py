"""Render the flat-cartoon version of the film, driven by the existing manifest.

The manifest in scenes_data carries the parts that are style-agnostic --
section boundaries, per-scene start/duration, figure pose/placement, name
cards. Only its backgrounds are marker-doodle closures, so the setting is
recovered from each closure's __qualname__ and mapped onto a flat environment.
Section durations therefore stay bit-identical to the marker cut.
"""

import argparse
import math
import multiprocessing as mp
import os
import subprocess
import time

from PIL import Image, ImageDraw

from render import flat
from render.flat import ENVS, W, H, draw_person, foot_drop, font
from render.scenes_data import SECTIONS, SECTION_NAMES, SECTION_BOUNDS

FPS = 24
OUT_SCENES = "output/flat_scenes"
OUT_FINAL = "output/flat_final"

# the manifest's scales were tuned for the leggier marker rig; the chibi
# figure is shorter for a given scale, so lift it to keep screen presence
FIG_SCALE = 1.40

SPECIFIC = set(ENVS) - {"env_plain"}

# Environments whose backdrop never varies with t. Their background is drawn
# once per scene and reused for every frame; only the figure and captions are
# redrawn. Roughly 60% of scenes qualify, and the backdrops are by far the
# most expensive part of a frame.
STATIC_ENVS = {
    "env_track", "env_pitch", "env_court", "env_diamond", "env_medal",
    "env_grave", "env_office", "env_prison", "env_forest", "env_plain",
}


def env_of(scene):
    names = []
    for b in list(scene["spec"]["background"]) + list(scene["spec"].get("foreground", [])):
        names.append(getattr(b, "__qualname__", "").split(".")[0])
    for n in names:
        if n in SPECIFIC:
            return n
    return "env_plain"


def namecard(d, text, sub):
    """Top banner, matching the reference frames' cream title bar."""
    bh = 96
    d.rectangle([-2, -2, W + 2, bh], fill=(243, 238, 220))
    d.line([(-2, bh), (W + 2, bh)], fill=flat.OUTLINE, width=5)
    f = font(62)
    tw = d.textlength(text, font=f)
    d.text(((W - tw) / 2, 14), text, font=f, fill=(38, 34, 30))
    if sub:
        f2 = font(34)
        sw = d.textlength(sub, font=f2)
        d.rectangle([(W - sw) / 2 - 20, bh + 14, (W + sw) / 2 + 20, bh + 66],
                    fill=(243, 238, 220), outline=flat.OUTLINE, width=4)
        d.text(((W - sw) / 2, bh + 20), sub, font=f2, fill=(60, 54, 48))


def caption(d, text, pos):
    if not text:
        return
    f = font(38)
    tw = d.textlength(text, font=f)
    x, y = pos
    x = min(max(x - tw / 2, 30), W - tw - 30)
    d.rectangle([x - 22, y - 14, x + tw + 22, y + 54], fill=(243, 238, 220),
                outline=flat.OUTLINE, width=4)
    d.text((x, y - 6), text, font=f, fill=(48, 42, 38))


def render_bg(env_name, t, seed):
    img = Image.new("RGB", (W, H), (250, 248, 244))
    d = ImageDraw.Draw(img)
    res = ENVS[env_name](d, t, seed)
    overlay = None
    if isinstance(res, tuple):
        ground, overlay = res
    else:
        ground = res
    if overlay is not None:
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img, ground


def render_frame(scene, env_name, t, seed, bg=None):
    if bg is None:
        img, ground = render_bg(env_name, t, seed)
    else:
        img, ground = bg[0].copy(), bg[1]
    d = ImageDraw.Draw(img)

    spec = scene["spec"]
    for i, fg in enumerate(spec["figures"]):
        sc = fg["scale"] * FIG_SCALE
        cx = fg["cx"]
        drop = foot_drop(sc, fg["pose"], scene["seed_id"])
        draw_person(d, cx, ground - drop, sc, fg.get("facing", 1),
                    fg["pose"], scene["seed_id"], t=t, seed=seed + i)

    nc = spec.get("namecard")
    if nc:
        namecard(d, nc["text"], nc.get("subtext"))
    cap = spec.get("caption")
    if cap:
        caption(d, cap, spec.get("caption_pos", (W // 2, H - 130)))
    return img


# Scenes are rebuilt inside each worker rather than shipped through the pool:
# the manifest's background entries are local closures, which cannot be
# pickled, so passing scene dicts to workers fails outright.
_SCENES = {}


def scenes_for(si):
    if si not in _SCENES:
        _SCENES[si] = SECTIONS[si]()
    return _SCENES[si]


def render_one(task):
    si, idx, out_path = task
    scene = scenes_for(si)[idx]
    env_name = env_of(scene)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 2048:
        return (si, idx, out_path, "cached")
    # Frame count from cumulative timeline position, not from this scene's
    # duration alone. The scenes tile their section exactly, but rounding each
    # duration independently accumulates error (section 3 drifted 0.42s), and
    # the cut has to stay frame-exact for the voiceover to stay in sync.
    # Differencing rounded absolute offsets makes the per-section total exact.
    rel = scene["t_start"] - SECTION_BOUNDS[si][0]
    n = max(1, int(round((rel + scene["duration"]) * FPS)) - int(round(rel * FPS)))
    tmp = f"{out_path}.tmp.{os.getpid()}.mp4"
    seed = (hash(scene["seed_id"]) & 0xFFFF) + idx
    bg = render_bg(env_name, 0.0, seed) if env_name in STATIC_ENVS else None
    p = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
         "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp],
        stdin=subprocess.PIPE)
    for f in range(n):
        img = render_frame(scene, env_name, f / float(FPS), seed, bg=bg)
        p.stdin.write(img.tobytes())
    p.stdin.close()
    p.wait()
    os.replace(tmp, out_path)
    return (si, idx, out_path, "ok")


def build_tasks():
    tasks = []
    for si in range(4):
        scenes = SECTIONS[si]()
        os.makedirs(os.path.join(OUT_SCENES, f"s{si + 1}"), exist_ok=True)
        for idx in range(len(scenes)):
            out = os.path.join(OUT_SCENES, f"s{si + 1}", f"{idx:03d}.mp4")
            tasks.append((si, idx, out))
    return tasks


def duration(path):
    # parsed from ffmpeg's own output: this toolchain ships ffmpeg without
    # a companion ffprobe binary
    out = subprocess.run(["ffmpeg", "-i", path], stderr=subprocess.PIPE, text=True).stderr
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("Duration:"):
            ts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = ts.split(":")
            return round(int(h) * 3600 + int(m) * 60 + float(s), 2)
    return None


def concat(si, n, out_path):
    lst = os.path.join(OUT_SCENES, f"s{si + 1}", "list.txt")
    with open(lst, "w") as fh:
        for i in range(n):
            fh.write(f"file '{os.path.abspath(os.path.join(OUT_SCENES, f's{si + 1}', f'{i:03d}.mp4'))}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                    "-i", lst, "-c", "copy", out_path], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--only", type=int, default=None, help="single section, 1-4")
    a = ap.parse_args()

    tasks = build_tasks()
    if a.only:
        tasks = [t for t in tasks if t[0] == a.only - 1]
    os.makedirs(OUT_FINAL, exist_ok=True)
    print(f"rendering {len(tasks)} scene clips on {a.jobs} cores", flush=True)
    t0 = time.time()
    with mp.Pool(a.jobs) as pool:
        for i, _ in enumerate(pool.imap_unordered(render_one, tasks)):
            if (i + 1) % 15 == 0 or i + 1 == len(tasks):
                print(f"  {i + 1}/{len(tasks)}  {time.time() - t0:.0f}s", flush=True)

    for si in range(4):
        if a.only and si != a.only - 1:
            continue
        scenes = SECTIONS[si]()
        name = SECTION_NAMES[si].replace(" ", "_")
        out = os.path.join(OUT_FINAL, f"section{si + 1}_{name}.mp4")
        concat(si, len(scenes), out)
        dur = duration(out)
        t_0, t_1 = SECTION_BOUNDS[si]
        exp = t_1 - t_0
        ok = dur is not None and abs(dur - exp) < 0.5
        print(f"Section {si + 1}: {dur}s (expected {exp}s) -> {'OK' if ok else 'MISMATCH'}", flush=True)


if __name__ == "__main__":
    main()
