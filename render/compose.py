"""
Scene composer + animator: turns a scene spec (figures/props/namecard/caption)
into an ordered stroke list, then renders it as:
  1) a short "marker drawing on" reveal (strokes appear in sequence), then
  2) a held frame with a slow Ken Burns drift,
and encodes the whole thing straight to a small per-scene MP4 via an ffmpeg
subprocess fed raw RGB frames over stdin.
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

from render.doodle import make_paper_texture, dot, font, seeded_rng, INK, OLIVE

OUT_W, OUT_H = 1920, 1080
PAD = 1.20
PAD_W, PAD_H = int(OUT_W * PAD), int(OUT_H * PAD)
OFFSET_X = (PAD_W - OUT_W) // 2
OFFSET_Y = (PAD_H - OUT_H) // 2

_PAPER_PADDED = None


def get_paper():
    global _PAPER_PADDED
    if _PAPER_PADDED is None:
        _PAPER_PADDED = make_paper_texture(PAD_W, PAD_H).convert("RGB")
    return _PAPER_PADDED


class Scene:
    def __init__(self, strokes, eye_dots, texts, flash_variants=None):
        self.strokes = strokes          # ordered list[Stroke]
        self.eye_dots = eye_dots        # list of (pos, r, color)
        self.texts = texts              # list of (pos, text, font_path, size, rotate, color, anchor)
        self.n = len(strokes)
        # Alternate overlay stroke-sets (muzzle flashes). Deliberately kept out
        # of `strokes` so they take no part in the marker reveal -- they are
        # punched in and out during the hold instead of being drawn once.
        self.flash_variants = flash_variants or []

    def draw_upto(self, draw: ImageDraw.ImageDraw, global_frac):
        if self.n == 0:
            return
        exact = global_frac * self.n
        full_count = int(exact)
        for i in range(min(full_count, self.n)):
            self.strokes[i].draw(draw, 1.0)
        if full_count < self.n:
            partial = exact - full_count
            if partial > 0:
                self.strokes[full_count].draw(draw, partial)

    def draw_faces_and_text(self, base_img: Image.Image, draw: ImageDraw.ImageDraw, global_frac):
        if global_frac >= 0.82:
            for (pos, r, color) in self.eye_dots:
                dot(draw, pos, r, color=color)
        if global_frac >= 0.90:
            for (pos, text, fpath, size, rot, color, anchor) in self.texts:
                _draw_text(base_img, pos, text, fpath, size, rot, color, anchor)


def _draw_text(base_img, pos, text, fpath, size, rot, color, anchor):
    f = font(fpath, size)
    pad = size * len(text) * 0.7 + 40
    tw, th = int(pad), int(size * 2.6)
    txt_img = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt_img)
    td.text((tw / 2, th / 2), text, font=f, fill=color + (255,), anchor="mm")
    if rot:
        txt_img = txt_img.rotate(rot, resample=Image.BICUBIC, center=(tw / 2, th / 2))
    base_img.alpha_composite(txt_img, (int(pos[0] - tw / 2), int(pos[1] - th / 2)))


def build_scene(spec, seed_base):
    """spec keys: figures (list of dicts for draw_stickman kwargs), background
    (list of part-dicts or callables(figs)->part-dict), foreground (same),
    namecard (dict or None), caption (str or None), namecard_pos, caption_pos.
    """
    from render import library as lib

    strokes = []
    eye_dots = []
    texts = []

    figs = []
    for i, fkw in enumerate(spec.get("figures", [])):
        fkw = dict(fkw)
        fkw.setdefault("seed", seeded_rng(seed_base, "fig", i).randint(0, 999999))
        part = lib.draw_stickman(**fkw)
        figs.append(part)

    def add_part(part):
        strokes.extend(part["strokes"])
        if "eye_dots" in part:
            for e in part["eye_dots"]:
                eye_dots.append((e, part["eye_r"], part["eye_color"]))
        texts.extend(part.get("texts", []))

    for item in spec.get("background", []):
        part = item(figs) if callable(item) else item
        add_part(part)

    for fpart in figs:
        strokes.extend(fpart["strokes"])
        # face dots deferred to the reveal-late pass
        for e in fpart["eye_dots"]:
            eye_dots.append((e, fpart["eye_r"], fpart["eye_color"]))

    for item in spec.get("foreground", []):
        part = item(figs) if callable(item) else item
        add_part(part)

    nc = spec.get("namecard")
    if nc:
        pos = spec.get("namecard_pos", (300, 940))
        part = lib.name_card(pos[0], pos[1], nc["text"], subtext=nc.get("subtext"), seed=seeded_rng(seed_base, "nc").randint(0, 999999), box_color=nc.get("color", INK), scale=nc.get("scale", 1.0))
        add_part(part)

    cap = spec.get("caption")
    if cap:
        pos = spec.get("caption_pos", (1620, 940))
        part = lib.caption_banner(
            pos[0], pos[1], cap,
            seed=seeded_rng(seed_base, "cap").randint(0, 999999),
            color=spec.get("caption_color", OLIVE),
        )
        add_part(part)

    flash_variants = []
    for item in spec.get("flash_variants", []):
        part = item(figs) if callable(item) else item
        flash_variants.append(part["strokes"])

    return Scene(strokes, eye_dots, texts, flash_variants=flash_variants)


# ---------------------------------------------------------------------------
# Frame rendering (reveal + Ken Burns hold) and ffmpeg encode
# ---------------------------------------------------------------------------
def _design_bg():
    paper = get_paper()
    return paper.crop((OFFSET_X, OFFSET_Y, OFFSET_X + OUT_W, OFFSET_Y + OUT_H)).convert("RGBA")


def _ease(t):
    return t * t * (3 - 2 * t)


def _crop_zoom(padded_rgb, zoom, center_frac):
    pw, ph = padded_rgb.size
    cw, ch = OUT_W / zoom, OUT_H / zoom
    cx = pw * center_frac[0]
    cy = ph * center_frac[1]
    x0 = max(0, min(pw - cw, cx - cw / 2))
    y0 = max(0, min(ph - ch, cy - ch / 2))
    crop = padded_rgb.crop((x0, y0, x0 + cw, y0 + ch))
    if crop.size != (OUT_W, OUT_H):
        # BILINEAR: ~2x faster than LANCZOS and visually indistinguishable on
        # a hand-drawn ink+paper-grain doodle (no fine photographic detail to
        # preserve) -- matters a lot multiplied across ~180 scenes.
        crop = crop.resize((OUT_W, OUT_H), Image.BILINEAR)
    return crop


def render_scene_frames(scene: Scene, duration, fps=24, seed_id=0, zoom_end=1.07, n_total=None):
    """Yields RGB numpy frames for the whole scene duration.

    n_total, if given, pins the exact frame count for this scene (used by the
    section-level renderer so cumulative rounding across ~40-56 scenes can't
    drift the section's total duration away from the target cut point --
    each scene rounding its own duration*fps independently accumulates error).
    """
    rng = seeded_rng(seed_id, "kenburns")
    reveal_time = min(1.6, max(0.55, duration * 0.30)) if scene.n > 0 else 0.0
    reveal_time = min(reveal_time, duration * 0.85)

    n_total = n_total if n_total is not None else max(1, round(duration * fps))
    n_reveal = max(1, round(reveal_time * fps)) if reveal_time > 0 else 0
    n_reveal = min(n_reveal, max(0, n_total - 1))
    n_hold = max(1, n_total - n_reveal)

    design_bg = _design_bg()

    # --- reveal frames ---
    for k in range(n_reveal):
        gfrac = (k + 1) / n_reveal
        frame = design_bg.copy()
        draw = ImageDraw.Draw(frame)
        scene.draw_upto(draw, gfrac)
        scene.draw_faces_and_text(frame, draw, gfrac)
        yield np.asarray(frame.convert("RGB"))

    # --- build the fully-inked padded canvas once for the hold/Ken-Burns pass ---
    final_design = design_bg.copy()
    draw = ImageDraw.Draw(final_design)
    scene.draw_upto(draw, 1.0)
    scene.draw_faces_and_text(final_design, draw, 1.0)

    padded = get_paper().copy().convert("RGBA")
    padded.paste(final_design, (OFFSET_X, OFFSET_Y))
    padded_rgb = padded.convert("RGB")

    # One fully-composited canvas per flash state, built once up front: the
    # Ken Burns pass then just picks which canvas to crop from per frame, so a
    # flashing scene costs the same per frame as a still one.
    flash_padded = []
    for variant in scene.flash_variants:
        lit = final_design.copy()
        ld = ImageDraw.Draw(lit)
        for st in variant:
            st.draw(ld, 1.0)
        p = get_paper().copy().convert("RGBA")
        p.paste(lit, (OFFSET_X, OFFSET_Y))
        flash_padded.append(p.convert("RGB"))

    # Staggered firing schedule: short bursts (2-4 frames) separated by gaps,
    # each burst lighting a different subset of the battery.
    flash_at = {}
    if flash_padded:
        f = int(fps * 0.12)
        while f < n_hold:
            v = rng.randrange(len(flash_padded))
            for d in range(rng.randint(2, 4)):
                if f + d < n_hold:
                    flash_at[f + d] = v
            f += rng.randint(int(fps * 0.30), int(fps * 0.85))

    dx = rng.uniform(-0.025, 0.025)
    dy = rng.uniform(-0.018, 0.018)
    start_center = (0.5 - dx * 0.3, 0.5 - dy * 0.3)
    end_center = (0.5 + dx, 0.5 + dy)
    z0 = 1.0 if n_reveal > 0 else 1.0

    for k in range(n_hold):
        t = (k + 1) / n_hold
        e = _ease(t)
        zoom = z0 + (zoom_end - z0) * e
        cx = start_center[0] + (end_center[0] - start_center[0]) * e
        cy = start_center[1] + (end_center[1] - start_center[1]) * e
        v = flash_at.get(k)
        src = padded_rgb if v is None else flash_padded[v]
        frame = _crop_zoom(src, zoom, (cx, cy))
        yield np.asarray(frame)


def render_scene_to_mp4(scene: Scene, duration, out_path, fps=24, seed_id=0, n_frames=None):
    proc = subprocess.Popen(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OUT_W}x{OUT_H}", "-r", str(fps),
            "-i", "-",
            "-an", "-c:v", "libx264", "-crf", "19", "-preset", "veryfast",
            "-pix_fmt", "yuv420p", "-r", str(fps),
            str(out_path),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    count = 0
    try:
        for frame in render_scene_frames(scene, duration, fps=fps, seed_id=seed_id, n_total=n_frames):
            proc.stdin.write(frame.tobytes())
            count += 1
    finally:
        proc.stdin.close()
        err = proc.stderr.read()
        ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"ffmpeg failed for {out_path}: {err.decode(errors='replace')[-2000:]}")
    return count
