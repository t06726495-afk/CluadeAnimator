"""Flat-cartoon drawing kit: crisp black outlines, flat fills, layered depth.

The look the runner-loop demo established, generalised so every scene in the
manifest can be drawn in it. Three layers to this module:

  * primitives  -- outlined tubes / polygons / circles
  * character   -- chibi figure driven by the SAME joint-angle table the
                   marker-doodle rig used (render.library.POSES), so poses
                   keep the shapes already signed off; only proportions and
                   the render style change
  * environments-- full-frame layered backdrops, one per scene setting

Nothing here writes video; render_flat.py drives it off the manifest.
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFont

from render.library import POSES

W, H = 1920, 1080

OUTLINE = (24, 22, 20)
SKIN = (246, 240, 231)
SKIN_SHADE = (219, 211, 200)
DARK_SKIN = (150, 106, 74)
DARK_SKIN_SHADE = (126, 88, 61)
WHITE = (250, 248, 244)
WHITE_SHADE = (223, 219, 212)
DUST = (214, 196, 178)

# muted period palette
KHAKI = (150, 141, 106)
KHAKI_D = (121, 113, 84)
HORIZON = (124, 139, 150)      # French horizon-blue
HORIZON_D = (99, 112, 122)
USARMY = (128, 126, 96)
USARMY_D = (103, 101, 76)
JAPAN = (134, 124, 92)
JAPAN_D = (108, 99, 73)
LEATHER = (124, 88, 58)
LEATHER_D = (99, 69, 45)
NAVY = (72, 84, 102)
NAVY_D = (56, 66, 81)
CRIMSON = (152, 74, 62)
BRICK = (168, 96, 82)

SKY_DAY = (183, 198, 206)
SKY_WARM = (206, 199, 176)
SKY_OVERCAST = (176, 178, 176)
SKY_DUSK = (168, 152, 141)
SKY_NIGHT = (44, 50, 66)
SKY_ASH = (96, 92, 90)
CLOUD = (201, 212, 217)
CLOUD_WARM = (219, 212, 194)

GRASS = (140, 154, 106)
GRASS_D = (116, 130, 88)
GRASS_PITCH = (124, 146, 98)
TRACK_RED = (176, 106, 92)
TRACK_L = (188, 122, 107)
LANE = (203, 147, 133)
DIRT = (146, 118, 92)
DIRT_D = (118, 94, 72)
DIRT_L = (167, 139, 110)
SAND = (178, 160, 126)
STONE = (140, 138, 134)
STONE_D = (112, 110, 107)
SNOW = (233, 234, 234)
SNOW_D = (205, 209, 213)
WOOD = (198, 178, 138)
WOOD_D = (160, 138, 99)
WOOD_S = (136, 116, 78)
SHADE_IN = (116, 102, 84)
CROWD = (92, 82, 74)
SEA = (108, 130, 140)
SEA_D = (86, 106, 117)
SEA_L = (132, 152, 160)
ROCK_BLACK = (66, 62, 62)
ROCK_BLACK_D = (48, 45, 46)
FLAME = (240, 168, 62)
FLAME_HOT = (250, 216, 130)
SMOKE = (150, 145, 140)

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts")
_fc = {}


def font(size, name="PatrickHand-Regular.ttf"):
    k = (name, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    return _fc[k]


def rng_for(*parts):
    return random.Random(hash(parts) & 0xFFFFFFFF)


# ----------------------------------------------------------------- primitives


def tube(d, pts, w, fill, ow=5):
    """Outlined limb/segment: fat dark stroke, thinner fill on top."""
    pts = [(float(x), float(y)) for x, y in pts]
    d.line(pts, fill=OUTLINE, width=int(w + 2 * ow), joint="curve")
    d.line(pts, fill=fill, width=int(w), joint="curve")
    for p in (pts[0], pts[-1]):
        r = (w + 2 * ow) / 2.0
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=OUTLINE)
        r2 = w / 2.0
        d.ellipse([p[0] - r2, p[1] - r2, p[0] + r2, p[1] + r2], fill=fill)


def poly(d, pts, fill, ow=4):
    d.polygon([(float(x), float(y)) for x, y in pts], fill=fill,
              outline=OUTLINE, width=int(ow))


def circ(d, c, r, fill, ow=5):
    d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=fill,
              outline=OUTLINE, width=int(ow))


def band(d, y0, y1, col):
    d.rectangle([-2, y0, W + 2, y1], fill=col)


def rule(d, y, col=OUTLINE, w=4, x0=-2, x1=W + 2):
    d.line([(x0, y), (x1, y)], fill=col, width=int(w))


def clouds(d, seed, n=11, y0=40, y1=200, col=CLOUD, drift=0.0):
    r = rng_for("cloud", seed)
    for _ in range(n):
        cx = (r.randint(-120, W + 120) + drift) % (W + 260) - 130
        cy = r.randint(y0, y1)
        sc = r.uniform(0.6, 1.6)
        for ox, oy, ww, hh in ((0, 0, 148, 50), (76, -16, 130, 56), (-62, 12, 114, 42)):
            d.ellipse([cx + ox * sc, cy + oy * sc,
                       cx + (ox + ww) * sc, cy + (oy + hh) * sc], fill=col)


def smoke_column(d, x, y_base, h, seed, col=SMOKE, t=0.0, w=26):
    """Drifting vertical smoke plume, used for shelled horizons."""
    r = rng_for("smoke", seed)
    # segments must overlap generously -- spaced sparsely they read as a
    # string of separate circles instead of one continuous plume
    n = max(6, int(h / 20))
    phases = [r.random() * 6 for _ in range(n)]
    for i in range(n):
        f = i / float(n)
        yy = y_base - f * h
        sway = math.sin(t * 1.1 + i * 0.42 + phases[i]) * (8 + 30 * f)
        rr = w * (0.60 + 1.30 * f)
        d.ellipse([x + sway - rr, yy - rr * 0.80, x + sway + rr, yy + rr * 0.80], fill=col)


def pine(d, x, y_base, hgt, col=(78, 96, 78), trunk=(96, 76, 56)):
    d.rectangle([x - hgt * 0.045, y_base - hgt * 0.22, x + hgt * 0.045, y_base], fill=trunk)
    for i in range(3):
        f = i / 3.0
        wy = y_base - hgt * (0.18 + 0.30 * i)
        ww = hgt * (0.30 - 0.075 * i)
        poly(d, [(x - ww, wy), (x + ww, wy), (x, wy - hgt * 0.30)], col, ow=3)


def spectators(d, x0, x1, y_rows, seed, col=CROWD, step=42):
    r = rng_for("crowd", seed)
    x = x0
    i = 0
    while x < x1:
        y = y_rows[(i * 3) % len(y_rows)]
        d.ellipse([x - 5, y - 12, x + 5, y - 2], fill=col)
        d.line([(x, y - 2), (x, y + 10)], fill=col, width=3)
        d.line([(x - 7, y + 14), (x, y + 10), (x + 7, y + 14)], fill=col, width=3)
        x += step + r.randint(-6, 8)
        i += 1


# ----------------------------------------------------------------- character

# Each man gets two outfits. These were athletes who became soldiers, so a
# single fixed costume put Wilding in tennis whites inside a trench and Bouin
# in a running singlet at the front. Sport settings draw the sport kit;
# everything else draws the uniform he actually served in.
LOOKS = {
    "bouin": dict(hair=(58, 44, 34), mous=True,
                  sport=dict(kit="singlet", col=WHITE, col2=WHITE_SHADE),
                  war=dict(kit="tunic", col=HORIZON, col2=HORIZON_D, hat="kepi")),
    "halswelle": dict(hair=(96, 74, 48), mous=True,
                      sport=dict(kit="singlet", col=WHITE, col2=WHITE_SHADE),
                      war=dict(kit="tunic", col=KHAKI, col2=KHAKI_D, hat="peaked")),
    "wilding": dict(hair=(64, 50, 38), mous=False,
                    sport=dict(kit="tennis", col=WHITE, col2=WHITE_SHADE),
                    war=dict(kit="tunic", col=KHAKI, col2=KHAKI_D, hat="peaked")),
    "bell": dict(hair=(72, 54, 38), mous=False,
                 sport=dict(kit="football", col=(206, 202, 196), col2=(170, 166, 160)),
                 war=dict(kit="tunic", col=KHAKI, col2=KHAKI_D, hat="helmet")),
    "tull": dict(hair=(44, 34, 28), mous=False, skin=DARK_SKIN, skin2=DARK_SKIN_SHADE,
                 sport=dict(kit="football", col=(214, 210, 204), col2=(120, 116, 112)),
                 war=dict(kit="tunic", col=KHAKI, col2=KHAKI_D, hat="peaked")),
    "grant": dict(hair=(70, 54, 40), mous=False,
                  sport=dict(kit="baseball", col=(232, 228, 219), col2=(196, 192, 184)),
                  war=dict(kit="tunic", col=USARMY, col2=USARMY_D, hat="helmet")),
    "baker": dict(hair=(128, 100, 62), mous=False,
                  sport=dict(kit="football", col=(86, 78, 74), col2=(178, 118, 62)),
                  war=dict(kit="flight", col=LEATHER, col2=LEATHER_D, hat="flight")),
    "kusocinski": dict(hair=(72, 56, 40), mous=False,
                       sport=dict(kit="singlet", col=WHITE, col2=WHITE_SHADE),
                       war=dict(kit="tunic", col=(96, 88, 80), col2=(74, 68, 62))),
    "kinnick": dict(hair=(96, 74, 50), mous=False,
                    sport=dict(kit="football", col=(170, 134, 76), col2=(62, 56, 50)),
                    war=dict(kit="flight", col=NAVY, col2=NAVY_D, hat="flight")),
    "paddock": dict(hair=(64, 50, 36), mous=False,
                    sport=dict(kit="singlet", col=WHITE, col2=WHITE_SHADE),
                    war=dict(kit="tunic", col=USARMY, col2=USARMY_D, hat="peaked")),
    "blozis": dict(hair=(70, 54, 38), mous=False, bulk=1.22,
                   sport=dict(kit="football", col=(110, 118, 142), col2=(78, 84, 104)),
                   war=dict(kit="tunic", col=USARMY, col2=USARMY_D, hat="helmet")),
    "nishi": dict(hair=(36, 30, 28), mous=True,
                  sport=dict(kit="riding", col=(172, 156, 118), col2=(132, 118, 88)),
                  war=dict(kit="tunic", col=JAPAN, col2=JAPAN_D, hat="peaked")),
    "lummus": dict(hair=(78, 60, 42), mous=False,
                   sport=dict(kit="football", col=(110, 118, 142), col2=(78, 84, 104)),
                   war=dict(kit="tunic", col=USARMY, col2=USARMY_D, hat="helmet")),
    "_default": dict(hair=(66, 52, 40), mous=False,
                     sport=dict(kit="singlet", col=WHITE, col2=WHITE_SHADE),
                     war=dict(kit="tunic", col=HORIZON, col2=HORIZON_D, hat="kepi")),
}

CYCLE_POSES = {"run": 2.6, "sprint_lean": 3.0, "march": 1.5}


def look_for(seed_id, ctx="war"):
    base = LOOKS.get(str(seed_id).rsplit("_", 1)[0], LOOKS["_default"])
    merged = {k: v for k, v in base.items() if k not in ("sport", "war")}
    merged.update(base.get(ctx, base["war"]))
    merged.setdefault("hat", None)
    return merged


def _skel(cx, cy, s, facing, p, extra=None):
    """Joint positions. Same math/sign conventions as library.draw_stickman:
    limb angle 0 hangs straight down, + rotates toward the facing direction,
    and facing -1 mirrors about cx. Only the proportions differ -- head much
    larger, torso shorter, for the chibi silhouette.
    """
    a = dict(arms=list(p["arms"]), legs=list(p["legs"]),
             lean=p["lean"], head_tilt=p["head_tilt"], crouch=p["crouch"])
    if extra:
        for k, v in extra.items():
            if k in ("arms", "legs"):
                a[k] = [a[k][i] + v[i] for i in range(4)]
            else:
                a[k] = a[k] + v

    # chibi proportions: big head, compact torso, short thick limbs. Legs
    # deliberately no longer than a head-diameter -- longer reads as a stick
    # figure wearing clothes rather than the reference's chunky cartoon.
    head_r = 40 * s
    neck = 4 * s
    torso_len = 46 * s * (1 - 0.30 * a["crouch"])
    au, al = 27 * s, 24 * s
    lu = 35 * s * (1 - 0.25 * a["crouch"])
    ll = 34 * s * (1 - 0.25 * a["crouch"])
    hw = 27 * s

    lean = math.radians(a["lean"])
    hip = (cx, cy)
    sh = (hip[0] + torso_len * math.sin(lean), hip[1] - torso_len * math.cos(lean))
    head = (sh[0] + (head_r + neck) * math.sin(lean)
            + math.sin(math.radians(a["head_tilt"])) * head_r * 0.6,
            sh[1] - (head_r + neck) * math.cos(lean) - head_r * 0.15)

    def chain(o, u, ua, lo, ba, lf):
        a1 = math.radians(ua) + lean * lf
        mid = (o[0] + u * math.sin(a1), o[1] + u * math.cos(a1))
        a2 = a1 + math.radians(ba)
        return [o, mid, (mid[0] + lo * math.sin(a2), mid[1] + lo * math.cos(a2))]

    # each limb gets its own origin, offset fore/aft. Sharing one centre point
    # makes near-vertical poses (stand, at_attention) collapse the two thick
    # tubes into a single indistinguishable column.
    arm_b = chain((sh[0] - hw * 0.66, sh[1]), au, a["arms"][0], al, a["arms"][1], 0.55)
    arm_f = chain((sh[0] + hw * 0.66, sh[1]), au, a["arms"][2], al, a["arms"][3], 0.55)
    leg_b = chain((hip[0] - 6 * s, hip[1]), lu, a["legs"][0], ll, a["legs"][1], 1.0)
    leg_f = chain((hip[0] + 6 * s, hip[1]), lu, a["legs"][2], ll, a["legs"][3], 1.0)

    out = dict(hip=hip, sh=sh, head=head, head_r=head_r, hw=hw,
               arm_b=arm_b, arm_f=arm_f, leg_b=leg_b, leg_f=leg_f, s=s)
    if facing == -1:
        def mx(p_):
            return (2 * cx - p_[0], p_[1])
        out = dict(hip=mx(hip), sh=mx(sh), head=mx(head), head_r=head_r, hw=hw,
                   arm_b=[mx(p_) for p_ in arm_b], arm_f=[mx(p_) for p_ in arm_f],
                   leg_b=[mx(p_) for p_ in leg_b], leg_f=[mx(p_) for p_ in leg_f], s=s)
    return out


def foot_drop(scale, pose, seed_id):
    """Distance from hip down to the pose's lowest drawn point.

    Measures every extremity, not just the feet: the lying poses (collapse,
    lie_fallen) put the torso or head lower than either foot, and measuring
    feet alone sinks them through the ground plane.
    """
    lk = LOOKS.get(str(seed_id).rsplit("_", 1)[0], LOOKS["_default"])
    s = scale * lk.get("bulk", 1.0)
    sk = _skel(0.0, 0.0, s, 1, POSES.get(pose, POSES["stand"]), None)
    lowest = max(sk["leg_b"][2][1], sk["leg_f"][2][1],
                 sk["arm_b"][2][1], sk["arm_f"][2][1],
                 sk["head"][1] + sk["head_r"], sk["hip"][1] + 20 * s)
    return lowest + 3 * s


def draw_person(d, cx, cy, scale, facing, pose, seed_id, t=0.0, seed=0, ctx="war"):
    lk = look_for(seed_id, ctx)
    s = scale * lk.get("bulk", 1.0)
    p = POSES.get(pose, POSES["stand"])
    skin = lk.get("skin", SKIN)
    skin2 = lk.get("skin2", SKIN_SHADE)
    col, col2 = lk["col"], lk["col2"]
    kit = lk["kit"]

    # motion: cycle poses get a real gait, everything else breathes
    extra = None
    if pose in CYCLE_POSES:
        f = CYCLE_POSES[pose]
        th = 2 * math.pi * f * t
        sw = math.sin(th)
        extra = dict(legs=(28 * sw, -18 * abs(sw), -28 * sw, 18 * abs(sw)),
                     arms=(-26 * sw, 12 * abs(sw), 26 * sw, -12 * abs(sw)),
                     lean=1.5 * math.cos(th))
    else:
        br = math.sin(2 * math.pi * 0.28 * t + (seed % 7))
        extra = dict(lean=0.7 * br, head_tilt=0.8 * br,
                     arms=(1.4 * br, 0.6 * br, -1.4 * br, -0.6 * br), legs=(0, 0, 0, 0))

    sk = _skel(cx, cy, s, facing, p, extra)

    # keep the feet from sliding while a gait cycles: hold the lowest foot at
    # the height the static pose would have put it
    if pose in CYCLE_POSES:
        base = _skel(cx, cy, s, facing, p, None)
        want = max(base["leg_b"][2][1], base["leg_f"][2][1])
        got = max(sk["leg_b"][2][1], sk["leg_f"][2][1])
        if abs(got - want) > 0.5:
            sk = _skel(cx, cy - (got - want), s, facing, p, extra)

    lw = max(6, 12 * s)
    hip, sh, head, hr = sk["hip"], sk["sh"], sk["head"], sk["head_r"]
    hw = sk["hw"]

    # far limbs
    tube(d, sk["leg_b"], lw, skin2, ow=max(3, int(1.6 * s)))
    tube(d, [sk["leg_b"][2], (sk["leg_b"][2][0] + facing * 13 * s, sk["leg_b"][2][1] + 3 * s)],
         lw * 0.82, (58, 46, 36), ow=max(3, int(1.4 * s)))
    if kit in ("singlet", "tennis"):
        poly(d, [(sh[0] - hw * 0.78, sh[1] - 6 * s), (sh[0] + hw * 0.78, sh[1] - 6 * s),
                 (sh[0] + hw, sh[1] + 18 * s), (hip[0] + hw * 0.86, hip[1] + 2 * s),
                 (hip[0] - hw * 0.86, hip[1] + 2 * s), (sh[0] - hw, sh[1] + 18 * s)],
             col, ow=max(3, int(1.7 * s)))
        # straight-sided and short -- flaring the hem wider than the waist
        # reads as a skirt rather than athletics shorts
        poly(d, [(hip[0] - hw * 0.92, hip[1] - 9 * s), (hip[0] + hw * 0.92, hip[1] - 9 * s),
                 (hip[0] + hw * 0.86, hip[1] + 15 * s), (hip[0] + 4 * s, hip[1] + 11 * s),
                 (hip[0] - 4 * s, hip[1] + 11 * s), (hip[0] - hw * 0.86, hip[1] + 15 * s)],
             WHITE if kit == "tennis" else col, ow=max(3, int(1.7 * s)))
    else:
        poly(d, [(sh[0] - hw, sh[1] - 7 * s), (sh[0] + hw, sh[1] - 7 * s),
                 (hip[0] + hw * 1.06, hip[1] + 20 * s), (hip[0] - hw * 1.06, hip[1] + 20 * s)],
             col, ow=max(3, int(1.7 * s)))
        if kit in ("tunic", "riding", "greatcoat"):
            d.line([(hip[0] - hw * 1.02, hip[1] + 2 * s), (hip[0] + hw * 1.02, hip[1] + 2 * s)],
                   fill=OUTLINE, width=max(3, int(2.2 * s)))
            d.line([(sh[0] - hw * 0.5, sh[1] - 4 * s), (hip[0] + hw * 0.5, hip[1] + 3 * s)],
                   fill=col2, width=max(3, int(2.4 * s)))
        if kit == "football":
            for i in range(3):
                yy = sh[1] + (4 + i * 9) * s
                d.line([(sh[0] - hw * 0.9, yy), (sh[0] + hw * 0.9, yy)], fill=col2,
                       width=max(2, int(2.0 * s)))

    # near limbs. Both arms draw over the torso: antiphase swing puts them
    # both near vertical at the passing frame, and behind the torso that
    # reads as the figure losing its arms. Shading carries the depth.
    tube(d, sk["leg_f"], lw, skin, ow=max(3, int(1.6 * s)))
    tube(d, [sk["leg_f"][2], (sk["leg_f"][2][0] + facing * 13 * s, sk["leg_f"][2][1] + 3 * s)],
         lw * 0.82, (68, 54, 42), ow=max(3, int(1.4 * s)))
    tube(d, sk["arm_b"], lw * 0.85, skin2, ow=max(3, int(1.5 * s)))
    tube(d, sk["arm_f"], lw * 0.85, skin, ow=max(3, int(1.5 * s)))

    # head
    circ(d, head, hr, skin, ow=max(3, int(1.8 * s)))
    box = [head[0] - hr, head[1] - hr, head[0] + hr, head[1] + hr]
    d.chord(box, 196, 344, fill=lk["hair"])
    d.arc(box, 196, 344, fill=OUTLINE, width=max(3, int(1.8 * s)))
    d.line([(head[0] + hr * math.cos(math.radians(196)), head[1] + hr * math.sin(math.radians(196))),
            (head[0] + hr * math.cos(math.radians(344)), head[1] + hr * math.sin(math.radians(344)))],
           fill=OUTLINE, width=max(2, int(1.4 * s)))
    blink = (math.sin(2 * math.pi * 0.21 * t + seed) > 0.985)
    for ex in (-0.30, 0.26):
        ecx = head[0] + facing * ex * hr
        if blink:
            d.line([(ecx - 0.11 * hr, head[1] + 0.02 * hr), (ecx + 0.11 * hr, head[1] + 0.02 * hr)],
                   fill=OUTLINE, width=max(2, int(1.6 * s)))
        else:
            d.ellipse([ecx - 0.105 * hr, head[1] - 0.20 * hr,
                       ecx + 0.105 * hr, head[1] + 0.06 * hr], fill=OUTLINE)
    if lk["mous"]:
        poly(d, [(head[0] - 0.33 * hr, head[1] + 0.44 * hr), (head[0], head[1] + 0.33 * hr),
                 (head[0] + 0.33 * hr, head[1] + 0.44 * hr), (head[0] + 0.19 * hr, head[1] + 0.58 * hr),
                 (head[0], head[1] + 0.50 * hr), (head[0] - 0.19 * hr, head[1] + 0.58 * hr)],
             lk["hair"], ow=0)
    else:
        m = p.get("mouth", 0.2)
        d.arc([head[0] - 0.24 * hr, head[1] + 0.20 * hr, head[0] + 0.24 * hr, head[1] + 0.20 * hr + 0.34 * hr],
              start=(0 if m >= 0 else 180), end=(180 if m >= 0 else 360),
              fill=OUTLINE, width=max(2, int(1.7 * s)))

    hat = lk.get("hat")
    if hat == "kepi":
        poly(d, [(head[0] - hr * 0.92, head[1] - hr * 0.52), (head[0] + hr * 0.92, head[1] - hr * 0.52),
                 (head[0] + hr * 0.80, head[1] - hr * 1.08), (head[0] - hr * 0.80, head[1] - hr * 1.08)],
             col2, ow=max(3, int(1.7 * s)))
        d.line([(head[0] - hr * 1.05, head[1] - hr * 0.50), (head[0] + hr * 1.05, head[1] - hr * 0.50)],
               fill=OUTLINE, width=max(3, int(2.4 * s)))
    elif hat == "peaked":
        poly(d, [(head[0] - hr * 0.95, head[1] - hr * 0.56), (head[0] + hr * 0.95, head[1] - hr * 0.56),
                 (head[0] + hr * 0.86, head[1] - hr * 1.12), (head[0] - hr * 0.86, head[1] - hr * 1.12)],
             col2, ow=max(3, int(1.7 * s)))
        poly(d, [(head[0] + facing * hr * 0.10, head[1] - hr * 0.60),
                 (head[0] + facing * hr * 1.26, head[1] - hr * 0.52),
                 (head[0] + facing * hr * 1.24, head[1] - hr * 0.36),
                 (head[0] + facing * hr * 0.08, head[1] - hr * 0.42)], (52, 46, 40), ow=max(2, int(1.4 * s)))
    elif hat == "helmet":
        hb = [head[0] - hr * 1.06, head[1] - hr * 1.16, head[0] + hr * 1.06, head[1] + hr * 0.16]
        d.chord(hb, 184, 356, fill=USARMY_D)
        d.arc(hb, 184, 356, fill=OUTLINE, width=max(3, int(1.9 * s)))
        d.line([(head[0] - hr * 1.06, head[1] - hr * 0.50), (head[0] + hr * 1.06, head[1] - hr * 0.50)],
               fill=OUTLINE, width=max(3, int(2.0 * s)))
    elif hat == "flight":
        d.chord(box, 176, 364, fill=LEATHER_D)
        d.arc(box, 176, 364, fill=OUTLINE, width=max(3, int(1.8 * s)))
        d.line([(head[0] - hr * 0.98, head[1] - hr * 0.10), (head[0] + hr * 0.98, head[1] - hr * 0.10)],
               fill=(78, 68, 58), width=max(4, int(3.4 * s)))
        for gx in (-0.42, 0.38):
            circ(d, (head[0] + gx * hr, head[1] - hr * 0.12), hr * 0.27, (150, 170, 176),
                 ow=max(2, int(1.6 * s)))
    return sk


def dust_puff(d, x, y, age, life=16, px_per=14):
    if not (0 <= age < life):
        return
    f = age / float(life)
    r = 18 + 62 * f
    xx = x - age * px_per
    yy = y - 32 * f
    al = int(200 * (1 - f) ** 1.3)
    ov = Image.new("RGBA", (1, 1))
    for ox, oy, sc in ((0, 0, 1.0), (-r * 0.62, 8, 0.72), (r * 0.58, 11, 0.62)):
        rr = r * sc
        d.ellipse([xx + ox - rr, yy + oy - rr, xx + ox + rr, yy + oy + rr],
                  outline=DUST + (al,), width=5)
    del ov


# --------------------------------------------------------------- environments
# Each env draws a full frame, back to front, and returns the y of the ground
# plane the figure should stand on. t is scene-local seconds, for drift/flicker.


def env_track(d, t, seed):
    band(d, 0, 660, SKY_DAY)
    clouds(d, seed, 12, 40, 190)
    # covered stand: shaded interior behind the tiers, so the roof is not a
    # slab floating over open sky
    band(d, 250, 470, SHADE_IN)
    for i in range(9):
        rule(d, 262 + i * 26, (104, 92, 76), 2)
    d.rectangle([-6, 222, W + 6, 252], fill=WOOD_D, outline=OUTLINE, width=3)
    for x in range(20, W, 118):
        d.rectangle([x, 252, x + 13, 470], fill=WOOD_S, outline=OUTLINE, width=2)
    band(d, 470, 600, WOOD)
    for i in range(5):
        rule(d, 486 + i * 24, WOOD_S, 3)
    for sxb in range(140, W, 430):
        d.rectangle([sxb, 470, sxb + 34, 600], fill=WOOD_D)
    spectators(d, 30, W - 20, (482, 506, 530, 554, 578), seed)
    rule(d, 600, OUTLINE, 4)
    band(d, 600, 726, GRASS)
    rule(d, 724, OUTLINE, 3)
    band(d, 726, H, TRACK_RED)
    band(d, 726, 748, TRACK_L)
    for y in (800, 890, 995):
        rule(d, y, LANE, 4)
    return 880


def env_pitch(d, t, seed):
    band(d, 0, 470, SKY_OVERCAST)
    clouds(d, seed, 9, 40, 180, (196, 197, 195))
    band(d, 300, 470, SHADE_IN)
    d.rectangle([-6, 276, W + 6, 302], fill=WOOD_D, outline=OUTLINE, width=3)
    band(d, 470, 566, WOOD)
    for i in range(4):
        rule(d, 484 + i * 22, WOOD_S, 3)
    spectators(d, 24, W - 20, (480, 502, 524, 546), seed, step=38)
    rule(d, 566, OUTLINE, 4)
    band(d, 566, H, GRASS_PITCH)
    # goal, stage left
    gx, gy = 250, 690
    d.rectangle([gx, gy - 150, gx + 12, gy], fill=WHITE, outline=OUTLINE, width=3)
    d.rectangle([gx + 250, gy - 150, gx + 262, gy], fill=WHITE, outline=OUTLINE, width=3)
    d.rectangle([gx, gy - 162, gx + 262, gy - 150], fill=WHITE, outline=OUTLINE, width=3)
    for i in range(9):
        xx = gx + 12 + i * 27
        d.line([(xx, gy - 150), (xx, gy)], fill=(226, 224, 219), width=2)
    for i in range(5):
        yy = gy - 140 + i * 28
        d.line([(gx + 12, yy), (gx + 250, yy)], fill=(226, 224, 219), width=2)
    rule(d, 806, (206, 214, 198), 5)
    d.arc([760, 700, 1560, 940], 200, 340, fill=(206, 214, 198), width=5)
    return 900


def env_court(d, t, seed):
    band(d, 0, 430, (198, 210, 214))
    clouds(d, seed, 8, 30, 150, (216, 224, 226))
    band(d, 380, 470, (120, 136, 104))
    for x in range(0, W, 90):
        pine(d, x + 26, 470, 120, (96, 112, 86))
    band(d, 470, 540, WOOD)
    spectators(d, 40, W - 30, (486, 508), seed, step=54)
    rule(d, 540, OUTLINE, 4)
    band(d, 540, H, (128, 152, 106))
    for y, wd in ((640, 4), (760, 5), (940, 6)):
        rule(d, y, (232, 230, 222), wd)
    # net: mesh between two posts, not a slab across the whole frame
    ny, nx0, nx1 = 726, 120, 1800
    for x in range(nx0, nx1, 26):
        d.line([(x, ny - 62), (x, ny)], fill=(178, 176, 170), width=2)
    for k in range(4):
        d.line([(nx0, ny - 62 + k * 20), (nx1, ny - 62 + k * 20)], fill=(178, 176, 170), width=2)
    d.line([(nx0, ny - 70), (nx1, ny - 70)], fill=WHITE, width=9)
    d.line([(nx0, ny - 70), (nx1, ny - 70)], fill=OUTLINE, width=3)
    for px in (nx0, nx1):
        d.rectangle([px - 7, ny - 86, px + 7, ny + 16], fill=(206, 204, 198),
                    outline=OUTLINE, width=3)
    return 930


def env_diamond(d, t, seed):
    band(d, 0, 440, SKY_DAY)
    clouds(d, seed, 9, 30, 170)
    band(d, 356, 452, SHADE_IN)
    d.rectangle([-6, 336, W + 6, 360], fill=WOOD_D, outline=OUTLINE, width=3)
    band(d, 452, 540, WOOD)
    spectators(d, 30, W - 20, (468, 492, 516), seed, step=40)
    rule(d, 540, OUTLINE, 4)
    band(d, 540, H, GRASS)
    poly(d, [(-40, 980), (620, 700), (1300, 700), (1960, 980), (1960, H + 10), (-40, H + 10)],
         DIRT_L, ow=0)
    rule(d, 700, DIRT_D, 4, 620, 1300)
    for bx, by in ((620, 700), (1300, 700), (960, 980)):
        poly(d, [(bx - 22, by - 12), (bx + 22, by - 12), (bx + 22, by + 12), (bx - 22, by + 12)],
             WHITE, ow=3)
    return 960


def env_medal(d, t, seed):
    band(d, 0, H, SKY_WARM)
    clouds(d, seed, 7, 40, 170, CLOUD_WARM)
    band(d, 470, 640, (176, 166, 140))
    rule(d, 470, OUTLINE, 4)
    # olympic rings
    rx, ry, rr = 960, 286, 60
    # proper Olympic layout: three up, two staggered below, spaced 2.2r apart
    for ox, oy in ((-2.2, 0.0), (0.0, 0.0), (2.2, 0.0), (-1.1, 0.55), (1.1, 0.55)):
        cxx, cyy = rx + ox * rr, ry + oy * rr
        d.ellipse([cxx - rr, cyy - rr, cxx + rr, cyy + rr], outline=OUTLINE, width=11)
    band(d, 640, H, (150, 142, 122))
    # podium
    for i, (px, ph) in enumerate(((700, 150), (960, 210), (1220, 118))):
        poly(d, [(px - 118, 900 - ph), (px + 118, 900 - ph), (px + 118, 900), (px - 118, 900)],
             (196, 186, 160) if i != 1 else (212, 200, 170), ow=4)
    rule(d, 900, OUTLINE, 5)
    band(d, 900, H, (138, 130, 112))
    return 900


def env_trench(d, t, seed):
    band(d, 0, 470, SKY_OVERCAST)
    clouds(d, seed, 8, 30, 170, (192, 192, 188))
    r = rng_for("tr", seed)
    for i in range(5):
        x = 160 + i * 400 + r.randint(-60, 60)
        smoke_column(d, x, 470, 250 + r.randint(-60, 110), seed * 7 + i, t=t, w=24)
    # far ridge, then churned no-man's-land
    poly(d, [(-40, 470), (300, 440), (760, 452), (1240, 432), (1700, 456), (1960, 442),
             (1960, 540), (-40, 540)], DIRT_D, ow=0)
    rule(d, 470, OUTLINE, 4)
    band(d, 540, 640, DIRT_L)
    r2 = rng_for("nml", seed)
    for _ in range(26):
        cx2 = r2.randint(-20, W); cy2 = r2.randint(556, 626)
        rr2 = r2.randint(18, 46)
        d.ellipse([cx2 - rr2, cy2 - rr2 * 0.34, cx2 + rr2, cy2 + rr2 * 0.34], fill=DIRT)

    # parapet: a bank with real mass, sandbags stacked in two staggered
    # overlapping rows. A single row of spaced ellipses reads as a decorative
    # chain sitting on a stripe rather than piled bags.
    band(d, 640, 760, DIRT)
    rule(d, 640, OUTLINE, 4)
    for row, (yy, bw, bh) in enumerate(((672, 92, 46), (716, 100, 50))):
        off = 0 if row % 2 == 0 else bw // 2
        for x in range(-60 + off, W + 80, int(bw * 0.86)):
            d.ellipse([x, yy - bh / 2, x + bw, yy + bh / 2], fill=SAND,
                      outline=OUTLINE, width=3)

    # trench recess: darker, with timber revetment on the back wall
    band(d, 760, H, (92, 74, 58))
    rule(d, 760, OUTLINE, 5)
    for x in range(-20, W + 40, 96):
        d.rectangle([x, 768, x + 12, 892], fill=WOOD_S, outline=(64, 52, 40), width=2)
    for yy in (800, 852):
        rule(d, yy, (110, 90, 68), 4)

    # duckboards: one continuous run with plank seams. Drawing separate
    # tapered boards leaves wedge gaps between them that read as saw teeth.
    band(d, 892, H, (78, 62, 48))
    rule(d, 892, OUTLINE, 4)
    d.polygon([(-40, 906), (W + 40, 906), (W + 60, 1000), (-60, 1000)], fill=WOOD_S)
    for x in range(-30, W + 60, 64):
        d.line([(x, 906), (x - 14, 1000)], fill=(58, 46, 36), width=3)
    rule(d, 906, (58, 46, 36), 3)
    rule(d, 1000, (58, 46, 36), 3)
    return 906


def env_grave(d, t, seed):
    band(d, 0, 520, (188, 190, 186))
    clouds(d, seed, 10, 40, 220, (204, 206, 202))
    band(d, 470, 560, (150, 156, 144))
    band(d, 560, H, GRASS_D)
    rule(d, 560, OUTLINE, 3)
    r = rng_for("gr", seed)
    for row, (yy, sc) in enumerate(((640, 0.62), (740, 0.82), (880, 1.06))):
        for i in range(16):
            x = -60 + i * (140 * sc) + r.randint(-8, 8)
            hgt = 86 * sc
            d.rectangle([x, yy - hgt, x + 30 * sc, yy], fill=(226, 224, 216),
                        outline=OUTLINE, width=max(2, int(3 * sc)))
            d.rectangle([x - 16 * sc, yy - hgt * 0.74, x + 46 * sc, yy - hgt * 0.56],
                        fill=(226, 224, 216), outline=OUTLINE, width=max(2, int(3 * sc)))
    return 940


def env_snow(d, t, seed):
    band(d, 0, 430, (206, 212, 218))
    clouds(d, seed, 8, 30, 160, (222, 226, 230))
    # peaks
    poly(d, [(-40, 470), (260, 250), (520, 430), (820, 200), (1180, 420), (1500, 260),
             (1820, 430), (1960, 380), (1960, 560), (-40, 560)], (166, 176, 188), ow=4)
    for px, py in ((260, 250), (820, 200), (1500, 260)):
        poly(d, [(px - 58, py + 74), (px, py), (px + 58, py + 74)], SNOW, ow=3)
    band(d, 560, H, SNOW)
    rule(d, 560, (188, 194, 200), 4)
    for x in range(90, W, 300):
        pine(d, x, 690, 190, (74, 92, 78))
    r = rng_for("sn", seed)
    for _ in range(150):
        sx = r.randint(0, W)
        sy = (r.randint(0, H) + t * 34) % H
        d.ellipse([sx, sy, sx + 5, sy + 5], fill=(246, 248, 250))
    return 950


def env_volcanic(d, t, seed):
    band(d, 0, 520, SKY_ASH)
    clouds(d, seed, 9, 20, 200, (118, 112, 110))
    smoke_column(d, 1420, 470, 340, seed + 3, col=(112, 106, 104), t=t, w=40)
    poly(d, [(-40, 520), (240, 452), (700, 386), (1120, 300), (1500, 372), (1780, 448),
             (1960, 486), (1960, 620), (-40, 620)], ROCK_BLACK, ow=4)
    # ash ground kept lighter than the island mass, or a dark figure standing
    # on it reads as a silhouette with no separation
    band(d, 620, H, (104, 98, 96))
    rule(d, 620, OUTLINE, 4)
    r = rng_for("vo", seed)
    for _ in range(46):
        x = r.randint(-20, W); y = r.randint(660, H)
        rr = r.randint(10, 34)
        d.ellipse([x, y, x + rr * 2, y + rr], fill=(84, 79, 78), outline=(62, 58, 58), width=2)
    return 900


def env_sea(d, t, seed):
    band(d, 0, 430, (176, 186, 192))
    clouds(d, seed, 8, 30, 170, (198, 206, 210))
    band(d, 430, H, SEA)
    rule(d, 430, OUTLINE, 4)
    for i, (yy, col, amp, spd) in enumerate(((520, SEA_D, 16, 0.6), (660, SEA_L, 22, 0.9),
                                            (820, SEA_D, 28, 1.3), (980, SEA_L, 34, 1.7))):
        pts = []
        for x in range(-40, W + 60, 40):
            pts.append((x, yy + math.sin(x / 150.0 + t * spd + i) * amp))
        d.line(pts, fill=col, width=7, joint="curve")
    return 900


def env_carrier(d, t, seed):
    band(d, 0, 420, (182, 192, 198))
    clouds(d, seed, 7, 30, 160, (202, 210, 214))
    band(d, 420, 560, SEA)
    rule(d, 420, OUTLINE, 3)
    for i in range(3):
        pts = [(x, 470 + i * 34 + math.sin(x / 130.0 + t * 1.1 + i) * 10) for x in range(-40, W + 60, 40)]
        d.line(pts, fill=SEA_D, width=5, joint="curve")
    band(d, 560, H, (122, 124, 126))
    rule(d, 560, OUTLINE, 4)
    # island superstructure
    poly(d, [(1420, 560), (1720, 560), (1720, 330), (1600, 330), (1600, 440), (1420, 440)],
         (106, 108, 110), ow=4)
    d.rectangle([1636, 246, 1652, 334], fill=(92, 94, 96), outline=OUTLINE, width=3)
    for x in range(-20, W, 130):
        d.line([(x, 700), (x + 90, 700)], fill=(150, 150, 150), width=4)
    for x in range(-60, W, 130):
        d.line([(x, 880), (x + 90, 880)], fill=(150, 150, 150), width=4)
    return 940


def env_sky(d, t, seed):
    band(d, 0, H, (186, 202, 212))
    clouds(d, seed, 6, 60, 260, (214, 222, 226), drift=t * 14)
    clouds(d, seed + 91, 7, 520, 900, (206, 214, 220), drift=t * 30)
    return 980


def env_office(d, t, seed):
    band(d, 0, 700, (176, 166, 148))
    rule(d, 700, OUTLINE, 4)
    band(d, 700, H, (140, 116, 88))
    for x in range(-10, W + 20, 150):
        d.line([(x, 700), (x - 60, H)], fill=(124, 102, 78), width=3)
    # window with light
    poly(d, [(190, 150), (640, 150), (640, 520), (190, 520)], (206, 214, 216), ow=6)
    d.line([(415, 150), (415, 520)], fill=OUTLINE, width=5)
    d.line([(190, 335), (640, 335)], fill=OUTLINE, width=5)
    # bookshelf
    poly(d, [(1240, 180), (1720, 180), (1720, 700), (1240, 700)], (128, 100, 74), ow=5)
    r = rng_for("of", seed)
    for i in range(4):
        yy = 250 + i * 112
        rule(d, yy, (100, 78, 58), 5, 1240, 1720)
        bx = 1256
        while bx < 1700:
            bw = r.randint(16, 30)
            d.rectangle([bx, yy - r.randint(58, 82), bx + bw, yy], fill=r.choice(
                [(150, 82, 70), (110, 116, 88), (96, 100, 120), (162, 140, 96)]),
                outline=OUTLINE, width=2)
            bx += bw + 5
    # desk
    poly(d, [(700, 780), (1300, 780), (1330, 830), (670, 830)], (132, 104, 76), ow=5)
    d.rectangle([720, 830, 760, H], fill=(112, 88, 66), outline=OUTLINE, width=3)
    d.rectangle([1240, 830, 1280, H], fill=(112, 88, 66), outline=OUTLINE, width=3)
    return 786


def env_prison(d, t, seed):
    band(d, 0, 760, STONE_D)
    for row in range(9):
        yy = 60 + row * 78
        rule(d, yy, (96, 94, 92), 3)
        off = 0 if row % 2 == 0 else 84
        for x in range(-90 + off, W + 90, 168):
            d.line([(x, yy), (x, yy + 78)], fill=(96, 94, 92), width=3)
    band(d, 760, H, (104, 102, 100))
    rule(d, 760, OUTLINE, 4)
    # barred window and its light shaft
    wx, wy, ww, wh = 1280, 130, 260, 210
    poly(d, [(wx, wy), (wx + ww, wy), (wx + ww, wy + wh), (wx, wy + wh)], (198, 200, 196), ow=6)
    for i in range(5):
        bx = wx + 26 + i * 47
        d.line([(bx, wy), (bx, wy + wh)], fill=OUTLINE, width=8)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.polygon([(wx, wy + wh), (wx + ww, wy + wh), (wx + ww - 330, 760), (wx - 500, 760)],
               fill=(236, 232, 214, 40))
    return 900, ov


def env_forest(d, t, seed):
    band(d, 0, 300, (150, 152, 146))
    band(d, 300, H, (92, 84, 68))
    r = rng_for("fo", seed)
    for depth, (col, hgt, step) in enumerate((((58, 70, 58), 520, 150),
                                              ((48, 60, 50), 700, 210),
                                              ((38, 48, 40), 900, 300))):
        for x in range(-80, W + 120, step):
            xx = x + r.randint(-30, 30)
            tw = 16 + depth * 12
            d.rectangle([xx, H - hgt * 0.55, xx + tw, H], fill=col)
            cxx = xx + tw / 2
            for k in range(3):
                yy = H - hgt * (0.50 + 0.20 * k)
                ww = tw * (3.2 - k * 0.7)
                poly(d, [(cxx - ww, yy), (cxx + ww, yy), (cxx, yy - hgt * 0.26)], col, ow=0)
    band(d, 980, H, (74, 68, 54))
    rule(d, 980, (58, 52, 42), 4)
    return 992


def env_plain(d, t, seed):
    band(d, 0, 560, SKY_DAY)
    clouds(d, seed, 10, 40, 210)
    band(d, 500, 600, (128, 142, 104))
    for x in range(0, W, 116):
        pine(d, x + 30, 600, 104, (104, 118, 90))
    band(d, 600, H, GRASS)
    rule(d, 600, OUTLINE, 3)
    r = rng_for("pl", seed)
    for _ in range(70):
        x = r.randint(0, W); y = r.randint(660, H)
        d.line([(x, y), (x + 5, y - 14)], fill=GRASS_D, width=3)
    return 920


def barrage_scene(d, t, seed):
    """Artillery battery firing across no-man's-land -- the ~30s beat."""
    band(d, 0, 520, SKY_NIGHT)
    r = rng_for("bar", seed)
    for _ in range(120):
        x = r.randint(0, W); y = r.randint(10, 460)
        d.ellipse([x, y, x + 3, y + 3], fill=(150, 158, 180))
    poly(d, [(-40, 500), (320, 452), (760, 470), (1200, 442), (1660, 474), (1960, 456),
             (1960, 700), (-40, 700)], (58, 54, 58), ow=0)
    rule(d, 500, (40, 38, 42), 4)
    guns = [(150, 496), (460, 470), (770, 484), (1080, 458), (1390, 480), (1700, 462)]
    BL = 150.0
    for i, (gx, gy) in enumerate(guns):
        # each gun fires on its own staggered beat, so the line flickers
        # rather than strobing on and off in unison
        ph = (t * 1.5 + i * 0.31) % 1.0
        lit = ph < 0.30
        # barrel direction, so the muzzle flash follows the barrel instead of
        # blasting out horizontally regardless of elevation
        ux, uy = 0.87, -0.49
        mx, my = gx + BL * ux, gy + BL * uy
        nx, ny = -uy, ux
        d.line([(gx, gy), (mx, my)], fill=(30, 28, 30), width=20)
        poly(d, [(gx - 26, gy - 16), (gx + 40, gy - 22), (gx + 34, gy + 20), (gx - 30, gy + 22)],
             (52, 50, 52), ow=3)
        circ(d, (gx - 4, gy + 20), 27, (46, 44, 46), ow=4)
        circ(d, (gx - 4, gy + 20), 8, (70, 68, 70), ow=3)
        if lit:
            f = ph / 0.30
            L = 250 * (1 - f * 0.62)
            wdt = 44 * (1 - f * 0.35)
            def P(a, b):
                return (mx + ux * a + nx * b, my + uy * a + ny * b)
            poly(d, [P(0, -wdt), P(L * 0.42, -wdt * 0.72), P(L, -wdt * 0.20),
                     P(L * 0.78, 0), P(L, wdt * 0.20), P(L * 0.42, wdt * 0.72), P(0, wdt)],
                 FLAME, ow=0)
            poly(d, [P(0, -wdt * 0.48), P(L * 0.55, -wdt * 0.14), P(L * 0.62, 0),
                     P(L * 0.55, wdt * 0.14), P(0, wdt * 0.48)], FLAME_HOT, ow=0)
            smoke_column(d, mx + 30, my - 30, 190, seed * 3 + i, col=(96, 92, 96), t=t, w=30)
    band(d, 660, 820, (44, 42, 46))
    rule(d, 660, (34, 32, 36), 3)
    # near trench with troops watching
    band(d, 820, H, (36, 40, 38))
    rule(d, 820, (28, 30, 28), 4)
    for x in range(-20, W + 40, 76):
        d.ellipse([x, 796, x + 80, 838], fill=(62, 58, 52), outline=(40, 38, 34), width=3)
    for i, tx in enumerate((300, 470, 640, 810, 980)):
        d.ellipse([tx - 13, 866, tx + 13, 892], fill=(24, 24, 26))
        d.line([(tx, 892), (tx, 942)], fill=(24, 24, 26), width=9)
        d.line([(tx - 16, 962), (tx, 942), (tx + 15, 966)], fill=(24, 24, 26), width=8)
    return 900


def cta_scene(d, t, seed):
    band(d, 0, 620, SKY_DUSK)
    clouds(d, seed, 8, 40, 200, (196, 184, 174))
    band(d, 560, 640, (128, 118, 96))
    band(d, 640, H, (112, 104, 84))
    rule(d, 640, OUTLINE, 4)
    px, py = 1420, 560
    pulse = 1.0 + 0.035 * math.sin(2 * math.pi * 0.7 * t)
    rr = 92 * pulse
    circ(d, (px, py), rr, (196, 186, 168), ow=7)
    poly(d, [(px - rr * 0.30, py - rr * 0.42), (px + rr * 0.46, py),
             (px - rr * 0.30, py + rr * 0.42)], CRIMSON, ow=5)
    return 900


ENVS = {
    "env_track": env_track, "env_pitch": env_pitch, "env_court": env_court,
    "env_diamond": env_diamond, "env_medal": env_medal, "env_trench": env_trench,
    "env_grave": env_grave, "env_snow": env_snow, "env_volcanic": env_volcanic,
    "env_sea": env_sea, "env_carrier": env_carrier, "env_sky": env_sky,
    "env_office": env_office, "env_prison": env_prison, "env_forest": env_forest,
    "env_plain": env_plain, "barrage_scene": barrage_scene, "cta_scene": cta_scene,
}
