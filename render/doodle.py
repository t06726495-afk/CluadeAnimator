"""
Core hand-drawn doodle rendering primitives.

Style target (per brief):
  Hand-drawn doodle illustration on off-white paper with faint visible grain.
  Bold black marker linework, slightly uneven and hand-wobbled, no ruler-straight
  edges. Simple stickman-style figures with round heads and no facial detail
  beyond dot eyes and a single line mouth. Flat limited palette: paper cream,
  black ink, one muted olive-drab, one faded brick red -- nothing else.
  Sketchy cross-hatch shading. Wide empty margins, lots of negative space.
  Whiteboard-explainer aesthetic, informative not cartoonish. Landscape 16:9.
"""
import hashlib
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
PAPER = (241, 235, 217)       # cream paper
INK = (32, 29, 26)            # near-black marker
OLIVE = (109, 108, 74)        # muted olive-drab
BRICK = (162, 89, 71)         # faded brick red

PALETTE = {"ink": INK, "olive": OLIVE, "brick": BRICK, "paper": PAPER}

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts")
FONT_MARKER = os.path.join(FONT_DIR, "PermanentMarker-Regular.ttf")
FONT_HAND = os.path.join(FONT_DIR, "PatrickHand-Regular.ttf")
FONT_SCRIPT = os.path.join(FONT_DIR, "Caveat-Bold.ttf")

_font_cache = {}


def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


# ---------------------------------------------------------------------------
# Deterministic per-scene RNG helper
# ---------------------------------------------------------------------------
def seeded_rng(*parts):
    h = hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()
    return random.Random(int(h[:12], 16))


# ---------------------------------------------------------------------------
# Paper texture (generated once, cached to disk, reused for every frame)
# ---------------------------------------------------------------------------
_PAPER_CACHE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "paper_texture.png"
)


def make_paper_texture(w, h, seed=7):
    if os.path.exists(_PAPER_CACHE_PATH):
        img = Image.open(_PAPER_CACHE_PATH).convert("RGB")
        if img.size == (w, h):
            return img
    rng = np.random.default_rng(seed)
    base = np.ones((h, w, 3), dtype=np.float64) * np.array(PAPER, dtype=np.float64)

    # low frequency mottling
    low = rng.normal(0, 1, (h // 24 + 2, w // 24 + 2))
    low_img = Image.fromarray(((low - low.min()) / (np.ptp(low) + 1e-6) * 255).astype(np.uint8))
    low_img = low_img.resize((w, h), Image.BICUBIC)
    low_arr = np.asarray(low_img, dtype=np.float64) / 255.0
    mottle = (low_arr - 0.5) * 10.0  # +/-5 tone shift

    # fine grain
    fine = rng.normal(0, 6.0, (h, w))
    fine_img = Image.fromarray(np.clip(fine + 128, 0, 255).astype(np.uint8))
    fine_img = fine_img.filter(ImageFilter.GaussianBlur(0.6))
    fine_arr = (np.asarray(fine_img, dtype=np.float64) - 128.0)

    tone = mottle + fine_arr
    out = base + tone[:, :, None]
    out = np.clip(out, 0, 255).astype(np.uint8)
    img = Image.fromarray(out, mode="RGB")

    # faint vignette toward edges (paper feels bounded)
    vign = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vign)
    vd.rectangle([0, 0, w, h], fill=0)
    vign_arr = np.zeros((h, w), dtype=np.float64)
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = w / 2, h / 2
    dist = np.sqrt(((xx - cx) / (w / 2)) ** 2 + ((yy - cy) / (h / 2)) ** 2)
    vign_arr = np.clip((dist - 0.78) / 0.4, 0, 1) * 14
    out2 = np.asarray(img, dtype=np.float64) - vign_arr[:, :, None]
    img = Image.fromarray(np.clip(out2, 0, 255).astype(np.uint8), mode="RGB")

    try:
        img.save(_PAPER_CACHE_PATH)
    except Exception:
        pass
    return img


# ---------------------------------------------------------------------------
# Wobbly stroke geometry
# ---------------------------------------------------------------------------
def _catmull_rom(points, samples_per_seg=12):
    """Smooth interpolation through anchor points (list of (x,y))."""
    if len(points) < 2:
        return list(points)
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for s in range(samples_per_seg):
            t = s / samples_per_seg
            t2 = t * t
            t3 = t2 * t
            x = 0.5 * (
                2 * p1[0]
                + (-p0[0] + p2[0]) * t
                + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
            )
            y = 0.5 * (
                2 * p1[1]
                + (-p0[1] + p2[1]) * t
                + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
            )
            out.append((x, y))
    out.append(points[-1])
    return out


def _linear_subdivide(points, seg_px=8):
    """Subdivide consecutive straight segments, preserving corners (no spline
    smoothing) -- for boxy/geometric shapes like banners, rectangles, panels.
    """
    out = [points[0]]
    for i in range(1, len(points)):
        x0, y0 = points[i - 1]
        x1, y1 = points[i]
        dist = math.hypot(x1 - x0, y1 - y0)
        n = max(1, int(dist / seg_px))
        for s in range(1, n + 1):
            t = s / n
            out.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    return out


def wobble_points(points, amplitude=2.6, seed=0, wobble_freq=0.55, overshoot=2.0, smooth=True):
    """Given coarse anchor points, return a finely-sampled hand-wobbled path.

    Adds smooth perpendicular jitter (sum of a couple of low-frequency sine
    waves with random phase, plus a touch of per-point noise) so the line
    looks hand-drawn rather than ruler-straight, but stays a coherent stroke
    rather than scribble noise. A small overshoot is appended past each end
    to mimic a marker that doesn't lift cleanly.

    smooth=True runs a Catmull-Rom spline through anchors (organic curves:
    bodies, circles). smooth=False keeps straight segments with preserved
    corners (geometric shapes: banners, boxes, panels).
    """
    if len(points) < 2:
        return list(points)
    rng = random.Random(seed)
    smooth_pts = _catmull_rom(points, samples_per_seg=14) if smooth else _linear_subdivide(points, seg_px=7)
    n = len(smooth_pts)
    # cumulative arc length parametrization for consistent wobble frequency
    phase1 = rng.uniform(0, math.tau)
    phase2 = rng.uniform(0, math.tau)
    freq1 = wobble_freq * rng.uniform(0.8, 1.2)
    freq2 = wobble_freq * rng.uniform(2.0, 2.6)
    amp1 = amplitude * rng.uniform(0.7, 1.0)
    amp2 = amplitude * rng.uniform(0.25, 0.4)
    jitter_seed_offsets = [rng.uniform(-1, 1) for _ in range(n)]

    out = []
    for i, (x, y) in enumerate(smooth_pts):
        # local tangent direction for perpendicular offset
        i0 = max(0, i - 1)
        i1 = min(n - 1, i + 1)
        dx = smooth_pts[i1][0] - smooth_pts[i0][0]
        dy = smooth_pts[i1][1] - smooth_pts[i0][1]
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        t = i / max(1, n - 1)
        wob = amp1 * math.sin(freq1 * t * math.tau + phase1) + amp2 * math.sin(freq2 * t * math.tau + phase2)
        wob += jitter_seed_offsets[i] * amplitude * 0.12
        out.append((x + nx * wob, y + ny * wob))

    # overshoot extension at both ends
    if overshoot > 0 and n >= 2:
        dx0 = out[0][0] - out[1][0]
        dy0 = out[0][1] - out[1][1]
        l0 = math.hypot(dx0, dy0) or 1.0
        start_ext = (out[0][0] + dx0 / l0 * overshoot, out[0][1] + dy0 / l0 * overshoot)
        dx1 = out[-1][0] - out[-2][0]
        dy1 = out[-1][1] - out[-2][1]
        l1 = math.hypot(dx1, dy1) or 1.0
        end_ext = (out[-1][0] + dx1 / l1 * overshoot, out[-1][1] + dy1 / l1 * overshoot)
        out = [start_ext] + out + [end_ext]
    return out


class Stroke:
    """A single hand-wobbled ink stroke, precomputed once and reused across frames."""

    __slots__ = ("points", "color", "width", "alpha", "closed", "length_cum", "total_len")

    def __init__(self, anchors, color=INK, width=5, seed=0, amplitude=2.6, closed=False, alpha=255, smooth=True):
        anchors = list(anchors)
        if closed and anchors[0] != anchors[-1]:
            anchors = anchors + [anchors[0]]
        overshoot = 0.6 if closed else 2.0
        self.points = wobble_points(anchors, amplitude=amplitude, seed=seed, smooth=smooth, overshoot=overshoot)
        self.color = color
        self.width = width
        self.alpha = alpha
        self.closed = closed
        # precompute cumulative length for partial-reveal drawing
        cum = [0.0]
        for i in range(1, len(self.points)):
            x0, y0 = self.points[i - 1]
            x1, y1 = self.points[i]
            cum.append(cum[-1] + math.hypot(x1 - x0, y1 - y0))
        self.length_cum = cum
        self.total_len = cum[-1] if cum else 0.0

    def draw(self, draw: ImageDraw.ImageDraw, frac=1.0):
        if frac <= 0 or self.total_len <= 0 or len(self.points) < 2:
            return
        if frac >= 1.0:
            pts = self.points
        else:
            target = frac * self.total_len
            # binary-search-free linear scan (stroke point counts are small)
            idx = 1
            while idx < len(self.length_cum) and self.length_cum[idx] < target:
                idx += 1
            idx = min(idx, len(self.points) - 1)
            pts = self.points[: idx + 1]
            if len(pts) < 2:
                return
        col = self.color + (self.alpha,) if len(self.color) == 3 else self.color
        draw.line(pts, fill=col, width=self.width, joint="curve")
        # round caps so joints/ends look like marker strokes, not hard corners
        r = self.width / 2.0
        for (px, py) in (pts[0], pts[-1]):
            draw.ellipse([px - r, py - r, px + r, py + r], fill=col)


def cross_hatch(draw, bbox, color=INK, spacing=9, angle=45, width=2, alpha=110, seed=0, coverage=1.0):
    """Sketchy diagonal hatch lines filling an axis-aligned bbox (x0,y0,x1,y1).
    Lines are given slight random length/position jitter to avoid a ruled look.
    """
    x0, y0, x1, y1 = bbox
    if x1 <= x0 or y1 <= y0:
        return
    rng = random.Random(seed)
    w = x1 - x0
    h = y1 - y0
    diag = math.hypot(w, h)
    rad = math.radians(angle)
    dx, dy = math.cos(rad), math.sin(rad)
    n = int(diag / spacing * coverage) + 1
    col = color + (alpha,) if len(color) == 3 else color
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for i in range(-n, n):
        offset = i * spacing + rng.uniform(-1.2, 1.2)
        # line through point offset along the normal of (dx,dy)
        nxp, nyp = -dy, dx
        px, py = cx + nxp * offset, cy + nyp * offset
        x_a = px - dx * diag
        y_a = py - dy * diag
        x_b = px + dx * diag
        y_b = py + dy * diag
        # clip roughly by intersecting with bbox via simple param clamp
        pts = _clip_segment_to_bbox((x_a, y_a), (x_b, y_b), bbox)
        if pts:
            jit = rng.uniform(-1, 1)
            (ax, ay), (bx, by) = pts
            draw.line([(ax + jit, ay), (bx - jit, by)], fill=col, width=width)


def _clip_segment_to_bbox(p0, p1, bbox):
    x0, y0, x1, y1 = bbox
    xa, ya = p0
    xb, yb = p1
    dx, dy = xb - xa, yb - ya
    tmin, tmax = 0.0, 1.0
    for p, q in ((-dx, xa - x0), (dx, x1 - xa), (-dy, ya - y0), (dy, y1 - ya)):
        if p == 0:
            if q < 0:
                return None
        else:
            t = q / p
            if p < 0:
                tmin = max(tmin, t)
            else:
                tmax = min(tmax, t)
    if tmin > tmax:
        return None
    return (xa + dx * tmin, ya + dy * tmin), (xa + dx * tmax, ya + dy * tmax)


def dot(draw, center, r, color=INK, alpha=255):
    x, y = center
    col = color + (alpha,) if len(color) == 3 else color
    draw.ellipse([x - r, y - r, x + r, y + r], fill=col)


class FilledShape:
    """A hand-wobbled closed shape drawn as a solid fill (optionally outlined).

    Stroke-compatible (same .draw(draw, frac) interface) so it can sit in the
    same ordered stroke lists. Used for things that must read as a bright mass
    rather than a contour -- muzzle flashes above all: an outline-only flame
    barely shifts the frame's brightness, so it doesn't register as a flash.
    """

    __slots__ = ("points", "color", "alpha", "outline", "outline_width", "total_len", "length_cum")

    def __init__(self, anchors, color=BRICK, seed=0, amplitude=2.4, alpha=255, outline=None, outline_width=3):
        anchors = list(anchors)
        if anchors[0] != anchors[-1]:
            anchors = anchors + [anchors[0]]
        self.points = wobble_points(anchors, amplitude=amplitude, seed=seed, smooth=True, overshoot=0.0)
        self.color = color
        self.alpha = alpha
        self.outline = outline
        self.outline_width = outline_width
        self.total_len = 1.0
        self.length_cum = [0.0, 1.0]

    def draw(self, draw: ImageDraw.ImageDraw, frac=1.0):
        if frac <= 0 or len(self.points) < 3:
            return
        col = self.color + (self.alpha,) if len(self.color) == 3 else self.color
        draw.polygon(self.points, fill=col)
        if self.outline:
            oc = self.outline + (255,) if len(self.outline) == 3 else self.outline
            draw.line(list(self.points) + [self.points[0]], fill=oc, width=self.outline_width, joint="curve")
