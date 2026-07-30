"""
Orchestrator: renders all ~180 scene clips in parallel (one ffmpeg subprocess
per scene, worker pool sized to CPU count), then losslessly concatenates each
section's scene clips in order via ffmpeg's concat demuxer.

Each worker re-imports scenes_data and rebuilds the requested section's scene
list itself (cheap, deterministic, pure-Python) rather than pickling scene
specs across the process boundary -- the specs hold closures (lambdas) for
figure-dependent props, which aren't picklable.
"""
import multiprocessing as mp
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES_DIR = os.path.join(ROOT, "output", "scenes")
FINAL_DIR = os.path.join(ROOT, "output", "final")


FPS = 24


def _frame_counts(scenes, fps=FPS):
    """Cumulative (Bresenham-style) rounding: each scene's frame count is the
    difference of *cumulative* rounded frame boundaries, not an independent
    round(duration*fps) per scene. Independent rounding accumulates drift
    (~0.25s over 40 scenes in testing); this keeps the section's total frame
    count exactly round(total_duration*fps) regardless of scene count.
    """
    t = 0.0
    prev_frame = 0
    counts = []
    for sc in scenes:
        t += sc["duration"]
        frame_end = round(t * fps)
        counts.append(max(1, frame_end - prev_frame))
        prev_frame = frame_end
    return counts


def render_one(args):
    section_idx, scene_idx, out_path, n_frames = args
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return (section_idx, scene_idx, out_path, "cached")
    from render.compose import build_scene, render_scene_to_mp4
    from render.scenes_data import SECTIONS

    scenes = SECTIONS[section_idx]()
    sc = scenes[scene_idx]
    scene = build_scene(sc["spec"], seed_base=sc["seed_id"])
    tmp_path = out_path + ".tmp.mp4"
    render_scene_to_mp4(scene, sc["duration"], tmp_path, fps=FPS, seed_id=hash(sc["seed_id"]) % 1000000, n_frames=n_frames)
    os.replace(tmp_path, out_path)
    return (section_idx, scene_idx, out_path, "rendered")


def build_tasks():
    from render.scenes_data import SECTIONS

    tasks = []
    for section_idx in range(4):
        scenes = SECTIONS[section_idx]()
        counts = _frame_counts(scenes)
        section_dir = os.path.join(SCENES_DIR, f"s{section_idx+1}")
        os.makedirs(section_dir, exist_ok=True)
        for scene_idx in range(len(scenes)):
            out_path = os.path.join(section_dir, f"{scene_idx:03d}.mp4")
            tasks.append((section_idx, scene_idx, out_path, counts[scene_idx]))
    return tasks


def concat_section(section_idx, n_scenes, out_path):
    section_dir = os.path.join(SCENES_DIR, f"s{section_idx+1}")
    list_path = os.path.join(section_dir, "concat_list.txt")
    with open(list_path, "w") as f:
        for scene_idx in range(n_scenes):
            p = os.path.join(section_dir, f"{scene_idx:03d}.mp4")
            f.write(f"file '{os.path.abspath(p)}'\n")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list_path, "-c", "copy", out_path],
        check=True,
    )


def get_duration(path):
    out = subprocess.run(["ffmpeg", "-i", path], stderr=subprocess.PIPE, text=True).stderr
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("Duration:"):
            ts = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = ts.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return None


def main():
    from render.scenes_data import SECTIONS, SECTION_NAMES, SECTION_BOUNDS

    os.makedirs(FINAL_DIR, exist_ok=True)
    tasks = build_tasks()
    print(f"Rendering {len(tasks)} scene clips across {mp.cpu_count()} cores...", flush=True)

    t0 = time.time()
    n_done = 0
    with mp.Pool(processes=min(4, mp.cpu_count())) as pool:
        for (section_idx, scene_idx, out_path, status) in pool.imap_unordered(render_one, tasks):
            n_done += 1
            if n_done % 10 == 0 or n_done == len(tasks):
                elapsed = time.time() - t0
                print(f"  {n_done}/{len(tasks)} clips done ({elapsed:.0f}s elapsed)", flush=True)

    print(f"All scene clips rendered in {time.time()-t0:.0f}s. Concatenating sections...", flush=True)

    section_files = []
    for section_idx in range(4):
        scenes = SECTIONS[section_idx]()
        n = len(scenes)
        name = SECTION_NAMES[section_idx].replace(" ", "_")
        out_path = os.path.join(FINAL_DIR, f"section{section_idx+1}_{name}.mp4")
        concat_section(section_idx, n, out_path)
        dur = get_duration(out_path)
        t0b, t1b = SECTION_BOUNDS[section_idx]
        expected = t1b - t0b
        ok = dur is not None and abs(dur - expected) < 0.5
        print(f"Section {section_idx+1} '{SECTION_NAMES[section_idx]}': {out_path} duration={dur:.2f}s (expected {expected}s) -> {'OK' if ok else 'MISMATCH'}")
        section_files.append(out_path)

    return section_files


if __name__ == "__main__":
    main()
