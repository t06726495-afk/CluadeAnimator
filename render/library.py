"""
Reusable hand-drawn doodle library: parametric stick figures + a prop kit.

Everything here returns a dict:
    {
        "strokes": [Stroke, ...],       # in draw order (background->foreground)
        "texts":   [(pos, text, font_path, size, rotate, color, anchor), ...],
        anchors used for prop attachment / camera framing, e.g. "hand_front"
    }
so the scene composer can concatenate multiple such dicts, reveal the vector
strokes progressively, and pop in the text labels near the end of the reveal.
"""
import math

from render.doodle import Stroke, FilledShape, cross_hatch, dot, seeded_rng, INK, OLIVE, BRICK, FONT_MARKER, FONT_HAND, FONT_SCRIPT


def _mirror(points, cx):
    return [(2 * cx - x, y) for (x, y) in points]


def _rot(pt, origin, deg):
    a = math.radians(deg)
    x, y = pt[0] - origin[0], pt[1] - origin[1]
    xr = x * math.cos(a) - y * math.sin(a)
    yr = x * math.sin(a) + y * math.cos(a)
    return (xr + origin[0], yr + origin[1])


# ---------------------------------------------------------------------------
# Stick figure
# ---------------------------------------------------------------------------
# Pose parameters (facing right / +1 by convention; mirrored for facing=-1):
#   lean: torso angle from vertical, degrees, + = leans forward (facing dir)
#   head_tilt: extra head offset, degrees
#   arms: (back_shoulder_deg, back_elbow_deg, front_shoulder_deg, front_elbow_deg)
#     angle 0 = hanging straight down, + rotates forward/up toward facing dir
#     elbow angle is relative bend from the upper-arm direction
#   legs: (back_hip_deg, back_knee_deg, front_hip_deg, front_knee_deg)
#   crouch: 0..1, squashes torso/leg height for a low stance
#   mouth: -1 (grim) .. 0 (neutral) .. 1 (slight smile)
POSES = {
    "stand": dict(lean=0, head_tilt=0, arms=(6, 4, -6, -4), legs=(4, 0, -4, 0), crouch=0, mouth=0.3),
    "at_attention": dict(lean=0, head_tilt=0, arms=(2, 0, -2, 0), legs=(0, 0, 0, 0), crouch=0, mouth=0),
    "walk": dict(lean=6, head_tilt=0, arms=(-24, 10, 28, -8), legs=(22, -14, -20, 18), crouch=0, mouth=0.2),
    "march": dict(lean=4, head_tilt=0, arms=(-18, 30, 20, 8), legs=(30, -20, -26, 22), crouch=0, mouth=-0.2),
    "run": dict(lean=18, head_tilt=-4, arms=(-45, 60, 55, -50), legs=(45, -55, -40, 60), crouch=0.05, mouth=0.4),
    "sprint_lean": dict(lean=26, head_tilt=-6, arms=(-55, 70, 62, -55), legs=(50, -60, -46, 65), crouch=0.08, mouth=0.3),
    "leap_tape": dict(lean=22, head_tilt=-4, arms=(70, -10, 75, -10), legs=(35, -20, -55, 30), crouch=0, mouth=0.6),
    "salute": dict(lean=0, head_tilt=0, arms=(4, 0, 95, 75), legs=(3, 0, -3, 0), crouch=0, mouth=-0.1),
    "point_forward": dict(lean=4, head_tilt=0, arms=(6, 4, 85, 5), legs=(4, 0, -6, 0), crouch=0, mouth=0.1),
    "wave": dict(lean=0, head_tilt=2, arms=(6, 4, -120, -40), legs=(2, 0, -2, 0), crouch=0, mouth=0.5),
    "kneel": dict(lean=10, head_tilt=0, arms=(20, 10, -20, 30), legs=(85, -110, 10, -90), crouch=0.32, mouth=-0.2),
    "sit": dict(lean=4, head_tilt=0, arms=(30, 20, -10, 15), legs=(80, -90, 75, -85), crouch=0.30, mouth=0),
    "aim_rifle": dict(lean=8, head_tilt=-2, arms=(-70, 60, -95, 15), legs=(18, -8, -16, 8), crouch=0.10, mouth=-0.3),
    "prone_fire": dict(lean=78, head_tilt=-4, arms=(40, 20, 55, 10), legs=(8, 4, -6, -4), crouch=0.55, mouth=-0.3),
    "dig_foxhole": dict(lean=28, head_tilt=-6, arms=(-70, 55, 60, -45), legs=(18, -10, -14, 12), crouch=0.12, mouth=-0.2),
    "throw_grenade": dict(lean=-10, head_tilt=6, arms=(-140, -20, 40, -60), legs=(30, -14, -20, 16), crouch=0, mouth=-0.1),
    "serve_tennis": dict(lean=-14, head_tilt=6, arms=(-150, -10, 20, 10), legs=(14, -6, -10, 10), crouch=0, mouth=0.4),
    "pitch_throw": dict(lean=10, head_tilt=-4, arms=(-120, 40, 70, -30), legs=(40, -30, -18, 14), crouch=0.06, mouth=0.3),
    "swing_bat": dict(lean=-8, head_tilt=2, arms=(-40, -60, -60, -70), legs=(20, -10, -14, 12), crouch=0, mouth=0.4),
    "catch_glove": dict(lean=6, head_tilt=0, arms=(-90, 20, 40, -10), legs=(10, -6, -8, 8), crouch=0.05, mouth=0.2),
    "raise_trophy": dict(lean=-4, head_tilt=0, arms=(-150, -20, 150, 20), legs=(6, 0, -6, 0), crouch=0, mouth=0.7),
    "hold_medal": dict(lean=2, head_tilt=0, arms=(30, 40, -30, 45), legs=(4, 0, -4, 0), crouch=0, mouth=0.2),
    "fly_cockpit": dict(lean=4, head_tilt=0, arms=(20, 40, -20, 45), legs=(0, 0, 0, 0), crouch=0.45, mouth=0.1),
    "look_up_sky": dict(lean=-14, head_tilt=-22, arms=(10, 6, -10, 6), legs=(4, 0, -4, 0), crouch=0, mouth=0),
    "lie_fallen": dict(lean=88, head_tilt=6, arms=(35, 15, 55, -10), legs=(6, 2, -10, -4), crouch=0.6, mouth=-0.4),
    "collapse": dict(lean=82, head_tilt=-8, arms=(-20, -10, 60, 25), legs=(20, 10, -6, -6), crouch=0.6, mouth=-0.4),
    "stumble": dict(lean=34, head_tilt=10, arms=(-40, 30, 60, -20), legs=(40, -30, -30, 40), crouch=0.1, mouth=-0.3),
    "embrace_ground": dict(lean=70, head_tilt=14, arms=(55, 25, 80, -10), legs=(15, -90, 10, -80), crouch=0.5, mouth=-0.3),
    "shovel_dig": dict(lean=24, head_tilt=-4, arms=(-60, 40, 50, -30), legs=(20, -10, -14, 12), crouch=0.08, mouth=-0.1),
    "carry_pack": dict(lean=14, head_tilt=0, arms=(10, 20, -70, 60), legs=(20, -12, -16, 14), crouch=0.04, mouth=0),
}


def _bespoke_part(strokes, eye_positions, eye_r, color, head_center, head_r, hand_front, hand_back, foot_front, foot_back, hip, shoulder, scale):
    return {
        "strokes": strokes, "eye_dots": eye_positions, "eye_r": eye_r, "eye_color": color, "texts": [],
        "head_center": head_center, "head_r": head_r, "hand_front": hand_front, "hand_back": hand_back,
        "foot_front": foot_front, "foot_back": foot_back, "hip": hip, "shoulder": shoulder, "scale": scale,
        "facing": 1,
    }


def draw_fallen(cx, cy, scale=1.0, seed=0, color=INK, facing=1):
    """A person collapsed/still on the ground -- hand-authored silhouette
    (deliberately NOT derived from the standing rig's angle math, which
    self-intersects into an illegible tangle at extreme lean angles). Used
    for the death beats -- the most important frames in the piece, so they
    get a dedicated, legible shape rather than a generic pose pushed too far.
    """
    s = scale
    head_c = (cx - 55 * s, cy - 12 * s)
    head_r = 20 * s
    shoulder = (cx - 34 * s, cy - 2 * s)
    hip = (cx + 22 * s, cy + 9 * s)
    foot_a = (cx + 72 * s, cy - 5 * s)
    foot_b = (cx + 64 * s, cy + 28 * s)
    hand_a = (cx - 20 * s, cy + 33 * s)
    hand_b = (cx - 44 * s, cy + 18 * s)
    head_anchors = [(head_c[0] + head_r * math.cos(a), head_c[1] + head_r * math.sin(a)) for a in [i / 18 * math.tau for i in range(19)]]
    parts = {
        "head": head_anchors,
        "torso": [shoulder, hip],
        "leg1": [hip, (hip[0] + 26 * s, hip[1] - 12 * s), foot_a],
        "leg2": [hip, (hip[0] + 22 * s, hip[1] + 16 * s), foot_b],
        "arm1": [(shoulder[0] + 14 * s, shoulder[1] + 6 * s), (shoulder[0] + 2 * s, shoulder[1] + 20 * s), hand_a],
        "arm2": [shoulder, (shoulder[0] - 16 * s, shoulder[1] + 8 * s), hand_b],
    }
    if facing == -1:
        parts = {k: _mirror(v, cx) for k, v in parts.items()}
        head_c = (2 * cx - head_c[0], head_c[1])
        shoulder = (2 * cx - shoulder[0], shoulder[1])
        hip = (2 * cx - hip[0], hip[1])
        foot_a = (2 * cx - foot_a[0], foot_a[1])
        hand_a = (2 * cx - hand_a[0], hand_a[1])

    sd = lambda name: seeded_rng(seed, name).randint(0, 999999)
    strokes = [
        Stroke(parts["leg2"], color=color, width=max(3, int(5 * s)), seed=sd("l2"), amplitude=1.6 * s),
        Stroke(parts["leg1"], color=color, width=max(3, int(5 * s)), seed=sd("l1"), amplitude=1.6 * s),
        Stroke(parts["arm2"], color=color, width=max(3, int(4.5 * s)), seed=sd("a2"), amplitude=1.6 * s),
        Stroke(parts["torso"], color=color, width=max(3, int(5.5 * s)), seed=sd("t"), amplitude=1.4 * s),
        Stroke(parts["arm1"], color=color, width=max(3, int(4.5 * s)), seed=sd("a1"), amplitude=1.6 * s),
        Stroke(parts["head"], color=color, width=max(3, int(5.5 * s)), seed=sd("h"), amplitude=1.4 * s, closed=True),
    ]
    mouth_y = head_r * 0.4
    strokes.append(Stroke([(head_c[0] - head_r * 0.3, head_c[1] + mouth_y - head_r * 0.18), (head_c[0] + head_r * 0.3, head_c[1] + mouth_y)], color=color, width=max(2, int(3 * s)), seed=sd("m"), amplitude=0.8 * s))
    eyes = [(head_c[0] - head_r * 0.2, head_c[1] - head_r * 0.25), (head_c[0] + head_r * 0.28, head_c[1] - head_r * 0.15)]
    return _bespoke_part(strokes, eyes, max(2, head_r * 0.09), color, head_c, head_r, hand_a, hand_b, foot_a, foot_b, hip, shoulder, s)


def draw_prone(cx, cy, scale=1.0, seed=0, color=INK, facing=1):
    """Lying flat, head up, arms extended forward -- an active prone-firing
    silhouette (alive/alert), distinct from draw_fallen (collapsed/still)."""
    s = scale
    head_c = (cx + 62 * s, cy - 20 * s)
    head_r = 19 * s
    shoulder = (cx + 40 * s, cy - 8 * s)
    hip = (cx - 30 * s, cy + 4 * s)
    hand = (cx + 108 * s, cy - 22 * s)
    foot_a = (cx - 78 * s, cy - 2 * s)
    foot_b = (cx - 72 * s, cy + 18 * s)
    parts = {
        "head": [(head_c[0] + head_r * math.cos(a), head_c[1] + head_r * math.sin(a)) for a in [i / 18 * math.tau for i in range(19)]],
        "torso": [shoulder, hip],
        "leg1": [hip, (hip[0] - 30 * s, hip[1] - 6 * s), foot_a],
        "leg2": [hip, (hip[0] - 28 * s, hip[1] + 14 * s), foot_b],
        "arms": [shoulder, (shoulder[0] + 34 * s, shoulder[1] - 10 * s), hand],
    }
    if facing == -1:
        parts = {k: _mirror(v, cx) for k, v in parts.items()}
        head_c = (2 * cx - head_c[0], head_c[1])
        shoulder = (2 * cx - shoulder[0], shoulder[1])
        hip = (2 * cx - hip[0], hip[1])
        hand = (2 * cx - hand[0], hand[1])
        foot_a = (2 * cx - foot_a[0], foot_a[1])
    sd = lambda name: seeded_rng(seed, name).randint(0, 999999)
    strokes = [
        Stroke(parts["leg2"], color=color, width=max(3, int(5 * s)), seed=sd("l2"), amplitude=1.6 * s),
        Stroke(parts["leg1"], color=color, width=max(3, int(5 * s)), seed=sd("l1"), amplitude=1.6 * s),
        Stroke(parts["torso"], color=color, width=max(3, int(5.5 * s)), seed=sd("t"), amplitude=1.4 * s),
        Stroke(parts["arms"], color=color, width=max(3, int(4.5 * s)), seed=sd("a"), amplitude=1.6 * s),
        Stroke(parts["head"], color=color, width=max(3, int(5.5 * s)), seed=sd("h"), amplitude=1.4 * s, closed=True),
    ]
    strokes.append(Stroke([(head_c[0] - head_r * 0.25, head_c[1] + head_r * 0.35), (head_c[0] + head_r * 0.25, head_c[1] + head_r * 0.3)], color=color, width=max(2, int(3 * s)), seed=sd("m"), amplitude=0.8 * s))
    eyes = [(head_c[0] - head_r * 0.3, head_c[1] - head_r * 0.1), (head_c[0] + head_r * 0.1, head_c[1] - head_r * 0.15)]
    return _bespoke_part(strokes, eyes, max(2, head_r * 0.09), color, head_c, head_r, hand, shoulder, foot_a, foot_b, hip, shoulder, s)


def draw_mourning(cx, cy, scale=1.0, seed=0, color=INK, facing=1):
    """Kneeling with head bowed, one hand reaching down -- for grieving /
    graveside beats (distinct from the collapsed-death silhouette)."""
    s = scale
    hip = (cx, cy)
    shoulder = (cx - 6 * s, cy - 48 * s)
    head_c = (cx - 26 * s, cy - 58 * s)
    head_r = 20 * s
    hand = (cx - 44 * s, cy - 10 * s)
    knee = (cx + 20 * s, cy + 30 * s)
    foot = (cx - 10 * s, cy + 34 * s)
    parts = {
        "head": [(head_c[0] + head_r * math.cos(a), head_c[1] + head_r * math.sin(a)) for a in [i / 18 * math.tau for i in range(19)]],
        "torso": [shoulder, hip],
        "arm": [shoulder, (shoulder[0] - 30 * s, shoulder[1] + 24 * s), hand],
        "leg1": [hip, (hip[0] + 16 * s, hip[1] + 12 * s), knee],
        "leg2": [hip, (hip[0] - 4 * s, hip[1] + 18 * s), foot],
        "arm_back": [shoulder, (shoulder[0] + 16 * s, shoulder[1] + 20 * s), (shoulder[0] + 8 * s, shoulder[1] + 38 * s)],
    }
    if facing == -1:
        parts = {k: _mirror(v, cx) for k, v in parts.items()}
        head_c = (2 * cx - head_c[0], head_c[1])
        shoulder = (2 * cx - shoulder[0], shoulder[1])
        hand = (2 * cx - hand[0], hand[1])
        knee = (2 * cx - knee[0], knee[1])
        foot = (2 * cx - foot[0], foot[1])
        hip = (2 * cx - hip[0], hip[1])
    sd = lambda name: seeded_rng(seed, name).randint(0, 999999)
    strokes = [
        Stroke(parts["leg1"], color=color, width=max(3, int(5 * s)), seed=sd("l1"), amplitude=1.6 * s),
        Stroke(parts["leg2"], color=color, width=max(3, int(5 * s)), seed=sd("l2"), amplitude=1.6 * s),
        Stroke(parts["arm_back"], color=color, width=max(3, int(4.5 * s)), seed=sd("ab"), amplitude=1.6 * s),
        Stroke(parts["torso"], color=color, width=max(3, int(5.5 * s)), seed=sd("t"), amplitude=1.4 * s),
        Stroke(parts["arm"], color=color, width=max(3, int(4.5 * s)), seed=sd("a"), amplitude=1.6 * s),
        Stroke(parts["head"], color=color, width=max(3, int(5.5 * s)), seed=sd("h"), amplitude=1.4 * s, closed=True),
    ]
    strokes.append(Stroke([(head_c[0] - head_r * 0.25, head_c[1] + head_r * 0.55), (head_c[0] + head_r * 0.2, head_c[1] + head_r * 0.5)], color=color, width=max(2, int(3 * s)), seed=sd("m"), amplitude=0.8 * s))
    eyes = [(head_c[0] - head_r * 0.2, head_c[1] + head_r * 0.15), (head_c[0] + head_r * 0.25, head_c[1] + head_r * 0.18)]
    return _bespoke_part(strokes, eyes, max(2, head_r * 0.09), color, head_c, head_r, hand, hand, foot, knee, hip, shoulder, s)


BESPOKE_POSES = {"collapse": draw_fallen, "lie_fallen": draw_fallen, "prone_fire": draw_prone, "embrace_ground": draw_mourning}


def draw_stickman(cx, cy, scale=1.0, pose="stand", seed=0, color=INK, facing=1, mouth_override=None):
    if pose in BESPOKE_POSES:
        return BESPOKE_POSES[pose](cx, cy, scale=scale, seed=seed, color=color, facing=facing)
    p = POSES.get(pose, POSES["stand"])
    rng = seeded_rng(seed, "figure")
    head_r = 22 * scale
    neck_len = 6 * scale
    torso_len = 78 * scale * (1 - 0.35 * p["crouch"])
    arm_up = 40 * scale
    arm_lo = 38 * scale
    leg_up = 46 * scale * (1 - 0.25 * p["crouch"])
    leg_lo = 46 * scale * (1 - 0.25 * p["crouch"])

    lean = math.radians(p["lean"])
    # torso: from hip (origin) upward, leaning
    hip = (cx, cy)
    shoulder = (hip[0] + torso_len * math.sin(lean), hip[1] - torso_len * math.cos(lean))
    head_center = (
        shoulder[0] + (head_r + neck_len) * math.sin(lean) + math.sin(math.radians(p["head_tilt"])) * head_r * 0.6,
        shoulder[1] - (head_r + neck_len) * math.cos(lean) - head_r * 0.15,
    )

    def limb(origin, up_len, up_ang, lo_len, bend_ang, lean_factor=0.35):
        # angle 0 = hangs straight DOWN from origin (shoulder/hip), + rotates
        # toward the facing direction -- opposite sign convention from the
        # torso (which grows UP from hip to shoulder). lean_factor controls
        # how much the limb's baseline follows the torso's lean -- legs need
        # a high factor so a horizontal (lying) torso carries the legs along
        # with it instead of leaving them dangling "down" into a tangle.
        a1 = math.radians(up_ang) + lean * lean_factor
        mid = (origin[0] + up_len * math.sin(a1), origin[1] + up_len * math.cos(a1))
        a2 = a1 + math.radians(bend_ang)
        end = (mid[0] + lo_len * math.sin(a2), mid[1] + lo_len * math.cos(a2))
        return [origin, mid, end], end

    back_arm_pts, hand_back = limb(shoulder, arm_up, p["arms"][0], arm_lo, p["arms"][1], lean_factor=0.55)
    front_arm_pts, hand_front = limb(shoulder, arm_up, p["arms"][2], arm_lo, p["arms"][3], lean_factor=0.55)
    back_leg_pts, foot_back = limb(hip, leg_up, p["legs"][0], leg_lo, p["legs"][1], lean_factor=1.0)
    front_leg_pts, foot_front = limb(hip, leg_up, p["legs"][2], leg_lo, p["legs"][3], lean_factor=1.0)

    parts = {
        "torso": [hip, shoulder],
        "back_arm": back_arm_pts,
        "front_arm": front_arm_pts,
        "back_leg": back_leg_pts,
        "front_leg": front_leg_pts,
    }
    head_anchors = [
        (head_center[0] + head_r * math.cos(a), head_center[1] + head_r * math.sin(a))
        for a in [i / 20 * math.tau for i in range(21)]
    ]

    if facing == -1:
        parts = {k: _mirror(v, cx) for k, v in parts.items()}
        head_anchors = _mirror(head_anchors, cx)
        head_center = (2 * cx - head_center[0], head_center[1])
        hand_front = (2 * cx - hand_front[0], hand_front[1])
        hand_back = (2 * cx - hand_back[0], hand_back[1])
        foot_front = (2 * cx - foot_front[0], foot_front[1])
        foot_back = (2 * cx - foot_back[0], foot_back[1])

    s = lambda seedname: seeded_rng(seed, seedname).randint(0, 999999)
    strokes = [
        Stroke(parts["back_leg"], color=color, width=max(3, int(5 * scale)), seed=s("bl"), amplitude=1.8 * scale),
        Stroke(parts["back_arm"], color=color, width=max(3, int(4.5 * scale)), seed=s("ba"), amplitude=1.8 * scale),
        Stroke(parts["torso"], color=color, width=max(3, int(5.5 * scale)), seed=s("t"), amplitude=1.6 * scale),
        Stroke(parts["front_leg"], color=color, width=max(3, int(5 * scale)), seed=s("fl"), amplitude=1.8 * scale),
        Stroke(parts["front_arm"], color=color, width=max(3, int(4.5 * scale)), seed=s("fa"), amplitude=1.8 * scale),
        Stroke(head_anchors, color=color, width=max(3, int(5.5 * scale)), seed=s("h"), amplitude=1.6 * scale, closed=True),
    ]

    # face (only if head is reasonably sized -- skip tiny background extras)
    eye_dx = head_r * 0.34
    eye_dy = -head_r * 0.12
    mc = p["mouth"] if mouth_override is None else mouth_override
    mouth_w = head_r * 0.34
    mouth_y = head_r * 0.42
    strokes.append(
        Stroke(
            [
                (head_center[0] - mouth_w, head_center[1] + mouth_y - mc * head_r * 0.22),
                (head_center[0], head_center[1] + mouth_y + mc * head_r * 0.16),
                (head_center[0] + mouth_w, head_center[1] + mouth_y - mc * head_r * 0.22),
            ],
            color=color,
            width=max(2, int(3 * scale)),
            seed=s("mouth"),
            amplitude=1.0 * scale,
        )
    )
    eye_positions = [
        (head_center[0] - eye_dx, head_center[1] + eye_dy),
        (head_center[0] + eye_dx, head_center[1] + eye_dy),
    ]

    return {
        "strokes": strokes,
        "eye_dots": eye_positions,
        "eye_r": max(2, head_r * 0.09),
        "eye_color": color,
        "texts": [],
        "head_center": head_center,
        "head_r": head_r,
        "hand_front": hand_front,
        "hand_back": hand_back,
        "foot_front": foot_front,
        "foot_back": foot_back,
        "hip": hip,
        "shoulder": shoulder,
        "scale": scale,
    }


# ---------------------------------------------------------------------------
# Ground / environment
# ---------------------------------------------------------------------------
def ground_line(x0, x1, y, seed=0, color=INK, width=4, wobble=1):
    return {"strokes": [Stroke([(x0, y), (x1, y)], color=color, width=width, seed=seed, amplitude=1.2 * wobble)], "texts": []}


def trench(cx, cy, width, seed=0, color=INK, scale=1.0):
    rng = seeded_rng(seed, "trench")
    n = 6
    top = []
    bot = []
    step = width / n
    x0 = cx - width / 2
    for i in range(n + 1):
        x = x0 + i * step
        depth = 26 * scale if i % 2 == 0 else 6 * scale
        top.append((x, cy + depth * 0.15))
        bot.append((x, cy + 34 * scale + depth))
    strokes = [
        Stroke(top, color=color, width=4, seed=seed + 1, amplitude=2.0, smooth=False),
        Stroke(bot, color=color, width=3, seed=seed + 2, amplitude=1.6, smooth=False),
    ]
    # sandbag ticks
    for i in range(n):
        x = x0 + (i + 0.5) * step
        strokes.append(Stroke([(x - 8 * scale, cy + 4), (x + 8 * scale, cy + 4)], color=color, width=2, seed=seed + 10 + i, amplitude=1.0))
    return {"strokes": strokes, "texts": []}


def barbed_wire(x0, y0, x1, y1, seed=0, color=INK, n=6, scale=1.0):
    rng = seeded_rng(seed, "wire")
    main = Stroke([(x0, y0), (x1, y1)], color=color, width=2, seed=seed, amplitude=1.6)
    strokes = [main]
    for i in range(n):
        t = (i + 0.5) / n
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        strokes.append(Stroke([(x - 6 * scale, y - 7 * scale), (x + 6 * scale, y + 7 * scale)], color=color, width=2, seed=seed + i + 1, amplitude=0.8))
        strokes.append(Stroke([(x - 6 * scale, y + 7 * scale), (x + 6 * scale, y - 7 * scale)], color=color, width=2, seed=seed + i + 50, amplitude=0.8))
    return {"strokes": strokes, "texts": []}


def gravestone_cross(cx, cy, scale=1.0, seed=0, color=INK):
    h = 70 * scale
    w = 42 * scale
    strokes = [
        Stroke([(cx, cy), (cx, cy - h)], color=color, width=5, seed=seed + 1, amplitude=1.4),
        Stroke([(cx - w / 2, cy - h * 0.62), (cx + w / 2, cy - h * 0.62)], color=color, width=5, seed=seed + 2, amplitude=1.4),
        Stroke([(cx - h * 0.42, cy + 4), (cx + h * 0.42, cy + 4)], color=color, width=3, seed=seed + 3, amplitude=1.2),
    ]
    return {"strokes": strokes, "texts": []}


def laurel_wreath(cx, cy, scale=1.0, seed=0, color=OLIVE):
    strokes = []
    for side in (-1, 1):
        base = [(cx, cy + 30 * scale)]
        n = 5
        for i in range(1, n + 1):
            t = i / n
            x = cx + side * (28 * scale) * math.sin(t * 1.5)
            y = cy + 30 * scale - t * 60 * scale
            base.append((x, y))
        strokes.append(Stroke(base, color=color, width=3, seed=seed + side, amplitude=1.4))
        for i in range(1, n):
            t = i / n
            bx = cx + side * (28 * scale) * math.sin(t * 1.5)
            by = cy + 30 * scale - t * 60 * scale
            leaf_ang = 40 * side
            lx = bx + 10 * scale * math.cos(math.radians(leaf_ang + (90 if side > 0 else 90)))
            ly = by - 6 * scale
            strokes.append(Stroke([(bx, by), (lx, ly)], color=color, width=2, seed=seed + side * 10 + i, amplitude=0.8))
    return {"strokes": strokes, "texts": []}


def medal(cx, cy, scale=1.0, seed=0, color=BRICK):
    r = 22 * scale
    circle = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i / 14 * math.tau for i in range(15)]]
    strokes = [
        Stroke([(cx - 12 * scale, cy - r - 26 * scale), (cx, cy - r - 4 * scale), (cx + 12 * scale, cy - r - 26 * scale)], color=color, width=4, seed=seed + 1, amplitude=1.2),
        Stroke(circle, color=INK, width=4, seed=seed + 2, amplitude=1.4, closed=True),
        Stroke([(cx, cy - r * 0.5), (cx, cy + r * 0.5)], color=INK, width=2, seed=seed + 3, amplitude=0.8),
    ]
    return {"strokes": strokes, "texts": []}


def olympic_rings(cx, cy, scale=1.0, seed=0, color=INK):
    r = 20 * scale
    offs = [(-1.1, 0), (0, 0), (1.1, 0), (-0.55, 0.75), (0.55, 0.75)]
    strokes = []
    for i, (ox, oy) in enumerate(offs):
        c = (cx + ox * r * 2.1, cy + oy * r * 2.1)
        circ = [(c[0] + r * math.cos(a), c[1] + r * math.sin(a)) for a in [j / 16 * math.tau for j in range(17)]]
        strokes.append(Stroke(circ, color=color, width=4, seed=seed + i, amplitude=1.2, closed=True))
    return {"strokes": strokes, "texts": []}


def trophy_cup(cx, cy, scale=1.0, seed=0, color=BRICK):
    top_w = 34 * scale
    cup = [
        (cx - top_w, cy - 46 * scale),
        (cx - top_w * 0.7, cy - 6 * scale),
        (cx, cy + 4 * scale),
        (cx + top_w * 0.7, cy - 6 * scale),
        (cx + top_w, cy - 46 * scale),
    ]
    strokes = [
        Stroke(cup, color=color, width=4, seed=seed + 1, amplitude=1.4),
        Stroke([(cx - top_w, cy - 40 * scale), (cx - top_w - 16 * scale, cy - 30 * scale), (cx - top_w * 0.65, cy - 16 * scale)], color=color, width=3, seed=seed + 2, amplitude=1.2),
        Stroke([(cx + top_w, cy - 40 * scale), (cx + top_w + 16 * scale, cy - 30 * scale), (cx + top_w * 0.65, cy - 16 * scale)], color=color, width=3, seed=seed + 3, amplitude=1.2),
        Stroke([(cx, cy + 4 * scale), (cx, cy + 22 * scale)], color=color, width=4, seed=seed + 4, amplitude=1.0),
        Stroke([(cx - 22 * scale, cy + 30 * scale), (cx + 22 * scale, cy + 30 * scale)], color=color, width=4, seed=seed + 5, amplitude=1.0, smooth=False),
    ]
    return {"strokes": strokes, "texts": []}


def stadium_arch(cx, cy, scale=1.0, seed=0, color=INK, width=220):
    w = width * scale
    h = 90 * scale
    arch = [(cx - w / 2, cy + h), (cx - w / 2, cy), (cx - w * 0.3, cy - h * 0.4), (cx, cy - h * 0.55), (cx + w * 0.3, cy - h * 0.4), (cx + w / 2, cy), (cx + w / 2, cy + h)]
    strokes = [Stroke(arch, color=color, width=4, seed=seed + 1, amplitude=1.8)]
    for i in range(5):
        x = cx - w / 2 + (i + 0.5) * w / 5
        strokes.append(Stroke([(x, cy + h), (x, cy + h * 0.3)], color=color, width=2, seed=seed + 10 + i, amplitude=1.0))
    return {"strokes": strokes, "texts": []}


def mountain_range(cx, cy, width, seed=0, color=INK, scale=1.0, snowy=True):
    rng = seeded_rng(seed, "mtn")
    n = 5
    step = width / n
    x0 = cx - width / 2
    pts = [(x0, cy)]
    peaks = []
    for i in range(n):
        peak_h = rng.uniform(75, 145) * scale
        px = x0 + (i + 0.5) * step
        py = cy - peak_h
        pts.append((px, py))
        peaks.append((px, py, peak_h))
        pts.append((x0 + (i + 1) * step, cy - rng.uniform(6, 20) * scale))
    pts.append((x0 + width, cy))
    strokes = [Stroke(pts, color=color, width=4, seed=seed + 1, amplitude=2.2, smooth=False)]
    if snowy:
        for (px, py, ph) in peaks:
            capw = 20 * scale
            strokes.append(
                Stroke(
                    [(px - capw, py + ph * 0.32), (px - capw * 0.3, py + ph * 0.08), (px, py), (px + capw * 0.3, py + ph * 0.08), (px + capw, py + ph * 0.32)],
                    color=color,
                    width=2,
                    seed=seed + 20 + int(px),
                    amplitude=1.2,
                )
            )
    return {"strokes": strokes, "texts": []}


def volcanic_island(cx, cy, width, seed=0, color=INK, scale=1.0):
    rng = seeded_rng(seed, "isle")
    n = 7
    x0 = cx - width / 2
    step = width / n
    pts = [(x0, cy)]
    for i in range(n):
        h = rng.uniform(55, 135) * scale
        pts.append((x0 + (i + 0.5) * step, cy - h))
    pts.append((x0 + width, cy))
    strokes = [Stroke(pts, color=color, width=5, seed=seed + 1, amplitude=2.2, smooth=False)]
    # smoke wisp
    smoke = [(x0 + width * 0.5, cy - 120 * scale)]
    for i in range(1, 5):
        smoke.append((x0 + width * 0.5 + 10 * scale * math.sin(i), cy - 120 * scale - i * 14 * scale))
    strokes.append(Stroke(smoke, color=color, width=2, seed=seed + 2, amplitude=2.0))
    return {"strokes": strokes, "texts": []}


def ship_hull(cx, cy, scale=1.0, seed=0, color=INK):
    w = 140 * scale
    hull = [(cx - w / 2, cy), (cx - w / 2 - 10 * scale, cy + 16 * scale), (cx + w / 2 + 10 * scale, cy + 16 * scale), (cx + w / 2, cy)]
    strokes = [
        Stroke(hull, color=color, width=4, seed=seed + 1, amplitude=1.6, smooth=False),
        Stroke([(cx - w / 2, cy), (cx + w / 2, cy)], color=color, width=3, seed=seed + 2, amplitude=1.2),
        Stroke([(cx - w * 0.15, cy), (cx - w * 0.15, cy - 40 * scale), (cx - w * 0.02, cy - 40 * scale), (cx - w * 0.02, cy)], color=color, width=3, seed=seed + 3, amplitude=1.4, smooth=False),
    ]
    return {"strokes": strokes, "texts": []}


def waves(cx, cy, width, seed=0, color=INK, n=6, scale=1.0):
    rng = seeded_rng(seed, "waves")
    step = width / n
    x0 = cx - width / 2
    strokes = []
    for i in range(n):
        x = x0 + i * step
        strokes.append(
            Stroke(
                [(x, cy), (x + step * 0.25, cy - 8 * scale), (x + step * 0.5, cy), (x + step * 0.75, cy + 6 * scale), (x + step, cy)],
                color=color,
                width=3,
                seed=seed + i,
                amplitude=1.0,
            )
        )
    return {"strokes": strokes, "texts": []}


def life_ring(cx, cy, scale=1.0, seed=0, color=BRICK):
    r = 24 * scale
    circ_out = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i / 16 * math.tau for i in range(17)]]
    circ_in = [(cx + r * 0.55 * math.cos(a), cy + r * 0.55 * math.sin(a)) for a in [i / 16 * math.tau for i in range(17)]]
    strokes = [
        Stroke(circ_out, color=color, width=5, seed=seed + 1, amplitude=1.4, closed=True),
        Stroke(circ_in, color=color, width=3, seed=seed + 2, amplitude=1.2, closed=True),
    ]
    for i in range(4):
        a = i / 4 * math.tau
        strokes.append(
            Stroke(
                [(cx + r * 0.55 * math.cos(a), cy + r * 0.55 * math.sin(a)), (cx + r * math.cos(a), cy + r * math.sin(a))],
                color=INK,
                width=4,
                seed=seed + 3 + i,
                amplitude=0.8,
            )
        )
    return {"strokes": strokes, "texts": []}


def biplane(cx, cy, scale=1.0, seed=0, color=INK, facing=1):
    L = 90 * scale
    fuselage = [(cx - L / 2, cy), (cx + L * 0.1, cy - 4 * scale), (cx + L / 2, cy - 6 * scale)]
    wing_top = [(cx - L * 0.15, cy - 30 * scale), (cx + L * 0.2, cy - 30 * scale)]
    wing_bot = [(cx - L * 0.1, cy + 6 * scale), (cx + L * 0.22, cy + 6 * scale)]
    strut1 = [(cx - L * 0.1, cy + 4 * scale), (cx - L * 0.12, cy - 28 * scale)]
    strut2 = [(cx + L * 0.16, cy + 4 * scale), (cx + L * 0.18, cy - 28 * scale)]
    tail = [(cx - L / 2, cy), (cx - L / 2 - 10 * scale, cy - 16 * scale)]
    prop = [(cx + L / 2, cy - 14 * scale), (cx + L / 2, cy + 4 * scale)]
    parts = [fuselage, wing_top, wing_bot, strut1, strut2, tail]
    if facing == -1:
        parts = [_mirror(p, cx) for p in parts]
        prop = _mirror(prop, cx)
    strokes = [Stroke(p, color=color, width=3, seed=seed + i, amplitude=1.4) for i, p in enumerate(parts)]
    strokes.append(Stroke(prop, color=color, width=2, seed=seed + 20, amplitude=1.0))
    return {"strokes": strokes, "texts": []}


def fighter_plane(cx, cy, scale=1.0, seed=0, color=INK, facing=1):
    L = 100 * scale
    fuselage = [(cx - L / 2, cy + 4 * scale), (cx, cy - 2 * scale), (cx + L / 2, cy)]
    wing = [(cx - L * 0.05, cy + 2 * scale), (cx + L * 0.05, cy + 34 * scale)]
    tail = [(cx - L / 2, cy + 4 * scale), (cx - L / 2 - 6 * scale, cy - 16 * scale)]
    parts = [fuselage, wing, tail]
    if facing == -1:
        parts = [_mirror(p, cx) for p in parts]
    strokes = [Stroke(p, color=color, width=3, seed=seed + i, amplitude=1.2) for i, p in enumerate(parts)]
    roundel = [(cx + math.cos(a) * 10 * scale, cy - 6 * scale + math.sin(a) * 10 * scale) for a in [i / 12 * math.tau for i in range(13)]]
    strokes.append(Stroke(roundel, color=color, width=2, seed=seed + 30, amplitude=1.0, closed=True))
    return {"strokes": strokes, "texts": []}


def tank(cx, cy, scale=1.0, seed=0, color=OLIVE, facing=1):
    w = 110 * scale
    h = 34 * scale
    hull = [(cx - w / 2, cy), (cx - w / 2, cy - h), (cx + w / 2, cy - h), (cx + w / 2, cy)]
    turret = [(cx - w * 0.12, cy - h), (cx - w * 0.12, cy - h - 20 * scale), (cx + w * 0.2, cy - h - 20 * scale), (cx + w * 0.2, cy - h)]
    barrel_x1 = cx + w * 0.2 + (40 * scale if facing == 1 else -40 * scale)
    barrel = [(cx + w * 0.15, cy - h - 12 * scale), (barrel_x1, cy - h - 14 * scale)]
    strokes = [
        Stroke(hull, color=color, width=4, seed=seed + 1, amplitude=1.6, smooth=False),
        Stroke(turret, color=color, width=4, seed=seed + 2, amplitude=1.4, smooth=False),
        Stroke(barrel, color=color, width=4, seed=seed + 3, amplitude=1.0),
        Stroke([(cx - w / 2, cy), (cx + w / 2, cy)], color=INK, width=3, seed=seed + 4, amplitude=1.2),
    ]
    for i in range(5):
        x = cx - w / 2 + (i + 0.5) * w / 5
        strokes.append(Stroke([(x - 4 * scale, cy + 2), (x + 4 * scale, cy + 2)], color=INK, width=2, seed=seed + 10 + i, amplitude=0.6))
    return {"strokes": strokes, "texts": []}


def rifle(hand, angle_deg=40, scale=1.0, seed=0, color=INK):
    L = 70 * scale
    a = math.radians(angle_deg)
    tip = (hand[0] + L * math.cos(a), hand[1] - L * math.sin(a))
    butt = (hand[0] - L * 0.28 * math.cos(a), hand[1] + L * 0.28 * math.sin(a))
    strokes = [
        Stroke([butt, hand, tip], color=color, width=3, seed=seed + 1, amplitude=1.0),
    ]
    return {"strokes": strokes, "texts": []}


def tennis_racket(hand, angle_deg=60, scale=1.0, seed=0, color=INK):
    a = math.radians(angle_deg)
    handle_len = 22 * scale
    head_c = (hand[0] + handle_len * math.cos(a), hand[1] - handle_len * math.sin(a))
    r = 16 * scale
    head = [(head_c[0] + r * math.cos(t) * 0.7, head_c[1] + r * math.sin(t)) for t in [i / 14 * math.tau for i in range(15)]]
    strokes = [
        Stroke([hand, head_c], color=color, width=3, seed=seed + 1, amplitude=0.8),
        Stroke(head, color=color, width=3, seed=seed + 2, amplitude=1.0, closed=True),
    ]
    return {"strokes": strokes, "texts": []}


def baseball_bat(hand, angle_deg=70, scale=1.0, seed=0, color=INK):
    a = math.radians(angle_deg)
    L = 46 * scale
    tip = (hand[0] + L * math.cos(a), hand[1] - L * math.sin(a))
    strokes = [Stroke([hand, tip], color=color, width=5, seed=seed + 1, amplitude=1.0)]
    return {"strokes": strokes, "texts": []}


def ball(cx, cy, r=8, seed=0, color=INK):
    circ = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i / 10 * math.tau for i in range(11)]]
    return {"strokes": [Stroke(circ, color=color, width=2, seed=seed, amplitude=0.8, closed=True)], "texts": []}


def horse(cx, cy, scale=1.0, seed=0, color=INK, facing=1):
    body = [(cx - 40 * scale, cy), (cx, cy - 6 * scale), (cx + 40 * scale, cy - 2 * scale)]
    neck = [(cx + 34 * scale, cy - 4 * scale), (cx + 50 * scale, cy - 34 * scale)]
    head = [(cx + 50 * scale, cy - 34 * scale), (cx + 68 * scale, cy - 30 * scale)]
    legs = [
        [(cx - 30 * scale, cy), (cx - 30 * scale, cy + 30 * scale)],
        [(cx + 26 * scale, cy), (cx + 26 * scale, cy + 30 * scale)],
    ]
    tail = [(cx - 40 * scale, cy), (cx - 54 * scale, cy + 14 * scale)]
    parts = [body, neck, head, tail] + legs
    if facing == -1:
        parts = [_mirror(p, cx) for p in parts]
    strokes = [Stroke(p, color=color, width=3, seed=seed + i, amplitude=1.4) for i, p in enumerate(parts)]
    return {"strokes": strokes, "texts": []}


def clock_face(cx, cy, scale=1.0, seed=0, color=INK, hour_ang=45, minute_ang=200):
    r = 26 * scale
    circ = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i / 16 * math.tau for i in range(17)]]
    ha = math.radians(hour_ang)
    ma = math.radians(minute_ang)
    strokes = [
        Stroke(circ, color=color, width=4, seed=seed + 1, amplitude=1.2, closed=True),
        Stroke([(cx, cy), (cx + r * 0.5 * math.cos(ha), cy + r * 0.5 * math.sin(ha))], color=color, width=3, seed=seed + 2, amplitude=0.8),
        Stroke([(cx, cy), (cx + r * 0.75 * math.cos(ma), cy + r * 0.75 * math.sin(ma))], color=color, width=2, seed=seed + 3, amplitude=0.8),
    ]
    return {"strokes": strokes, "texts": []}


def newspaper(cx, cy, scale=1.0, seed=0, color=INK):
    w, h = 70 * scale, 90 * scale
    rect = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    strokes = [Stroke(rect, color=color, width=3, seed=seed + 1, amplitude=1.2, closed=True, smooth=False)]
    strokes.append(Stroke([(cx - w * 0.35, cy - h * 0.3), (cx + w * 0.35, cy - h * 0.3)], color=color, width=4, seed=seed + 2, amplitude=1.0))
    for i in range(4):
        y = cy - h * 0.1 + i * h * 0.15
        strokes.append(Stroke([(cx - w * 0.35, y), (cx + w * 0.35, y)], color=color, width=2, seed=seed + 3 + i, amplitude=0.8))
    return {"strokes": strokes, "texts": []}


def arrow(x0, y0, x1, y1, seed=0, color=BRICK, width=4, head=12):
    ang = math.atan2(y1 - y0, x1 - x0)
    h1 = (x1 - head * math.cos(ang - math.radians(28)), y1 - head * math.sin(ang - math.radians(28)))
    h2 = (x1 - head * math.cos(ang + math.radians(28)), y1 - head * math.sin(ang + math.radians(28)))
    strokes = [
        Stroke([(x0, y0), (x1, y1)], color=color, width=width, seed=seed + 1, amplitude=1.4),
        Stroke([h1, (x1, y1), h2], color=color, width=width, seed=seed + 2, amplitude=0.8),
    ]
    return {"strokes": strokes, "texts": []}


def explosion_burst(cx, cy, scale=1.0, seed=0, color=BRICK):
    rng = seeded_rng(seed, "boom")
    n = 10
    pts = []
    for i in range(n * 2):
        a = i / (n * 2) * math.tau
        r = (30 if i % 2 == 0 else 14) * scale * rng.uniform(0.85, 1.15)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    strokes = [Stroke(pts, color=color, width=3, seed=seed + 1, amplitude=1.6, closed=True, smooth=False)]
    return {"strokes": strokes, "texts": []}


def footprints(x0, y0, x1, y1, n=5, seed=0, color=INK, scale=1.0):
    strokes = []
    for i in range(n):
        t = i / max(1, n - 1)
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        off = 8 * scale if i % 2 == 0 else -8 * scale
        oval = [(x + off + 5 * scale * math.cos(a), y + 9 * scale * math.sin(a)) for a in [j / 10 * math.tau for j in range(11)]]
        strokes.append(Stroke(oval, color=color, width=2, seed=seed + i, amplitude=0.6, closed=True))
    return {"strokes": strokes, "texts": []}


def finish_tape(cx, cy, width, seed=0, color=BRICK, scale=1.0):
    hw = width / 2
    strokes = [
        Stroke([(cx - hw, cy + 60 * scale), (cx - hw, cy - 40 * scale)], color=INK, width=4, seed=seed + 1, amplitude=1.2),
        Stroke([(cx + hw, cy + 60 * scale), (cx + hw, cy - 40 * scale)], color=INK, width=4, seed=seed + 2, amplitude=1.2),
        Stroke([(cx - hw, cy - 20 * scale), (cx + hw, cy - 20 * scale)], color=color, width=4, seed=seed + 3, amplitude=1.6),
    ]
    return {"strokes": strokes, "texts": []}


def name_card(cx, cy, text, subtext=None, scale=1.0, seed=0, box_color=INK, w=None, h=None):
    w = w or (46 * len(text) * 0.62 + 40) * scale
    h = h or 74 * scale
    rect = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    strokes = [
        Stroke(rect, color=box_color, width=4, seed=seed + 1, amplitude=1.6, closed=True, smooth=False),
        Stroke([(cx - w / 2 + 5, cy - h / 2 + 5), (cx + w / 2 + 5, cy - h / 2 + 5), (cx + w / 2 + 5, cy + h / 2 + 5), (cx - w / 2 + 5, cy + h / 2 + 5)], color=box_color, width=2, seed=seed + 2, amplitude=1.2, closed=True, smooth=False, alpha=90),
    ]
    texts = [(( cx, cy - (8 if subtext else 0)), text, FONT_MARKER, int(30 * scale), -1.2, box_color, "mm")]
    if subtext:
        texts.append(((cx, cy + h * 0.28), subtext, FONT_HAND, int(20 * scale), 0.6, box_color, "mm"))
    return {"strokes": strokes, "texts": texts, "w": w, "h": h}


def caption_banner(cx, cy, text, scale=1.0, seed=0, color=OLIVE, font=FONT_HAND, size=26):
    w = (17 * len(text) + 44) * scale
    h = 46 * scale
    rect = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    strokes = [Stroke(rect, color=color, width=3, seed=seed + 1, amplitude=1.3, closed=True, smooth=False)]
    texts = [((cx, cy), text, font, int(size * scale), 0.8, color, "mm")]
    return {"strokes": strokes, "texts": texts, "w": w, "h": h}


# ---------------------------------------------------------------------------
# Artillery barrage (the recurring "cannon flash" interstitial)
# ---------------------------------------------------------------------------
def _crest_y_at(crest, x):
    for i in range(1, len(crest)):
        x0, y0 = crest[i - 1]
        x1, y1 = crest[i]
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0 or 1.0)
            return y0 + (y1 - y0) * t
    return crest[-1][1]


def artillery_battery(seed=0, scale=1.0, n_guns=6, crest_y=545, x0=70, x1=1860):
    """A ridge line of field guns seen in silhouette from the opposing trench.

    Returns the usual part dict plus `muzzles`: the barrel-tip position and
    angle for each gun, so muzzle_flash() can be pinned to them later.
    """
    rng = seeded_rng(seed, "battery")
    strokes = []
    crest = []
    steps = 10
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = crest_y + math.sin(t * 3.4 + 0.7) * 26 - t * 34 + rng.uniform(-5, 5)
        crest.append((x, y))
    strokes.append(Stroke(crest, color=INK, width=5, seed=seed + 1, amplitude=2.4))

    # hatch the ridge face so it reads as a solid landform, not a bare line
    for i in range(58):
        hx = x0 + (i + 0.5) * (x1 - x0) / 58 + rng.uniform(-5, 5)
        hy = _crest_y_at(crest, hx)
        hl = rng.uniform(34, 78) * scale
        strokes.append(Stroke([(hx, hy + 3), (hx - hl * 0.30, hy + hl)], color=INK, width=2, seed=seed + 300 + i, amplitude=0.9, alpha=120))

    # sandbag parapet bumps riding the crest
    for i in range(16):
        bx = x0 + (i + 0.5) * (x1 - x0) / 16 + rng.uniform(-8, 8)
        by = _crest_y_at(crest, bx)
        bw = rng.uniform(20, 30) * scale
        bh = rng.uniform(8, 13) * scale
        arc = [(bx - bw / 2, by), (bx - bw * 0.25, by - bh), (bx + bw * 0.25, by - bh), (bx + bw / 2, by)]
        strokes.append(Stroke(arc, color=INK, width=2, seed=seed + 40 + i, amplitude=1.0))

    muzzles = []
    span = (x1 - x0) * 0.74
    gx0 = x0 + (x1 - x0) * 0.16
    for g in range(n_guns):
        gx = gx0 + span * (g / max(1, n_guns - 1)) + rng.uniform(-14, 14)
        gy = _crest_y_at(crest, gx) - 4
        s = scale * rng.uniform(0.9, 1.12)
        wr = 17 * s
        wheel = [(gx + wr * math.cos(a), gy - wr + wr * math.sin(a)) for a in [i / 14 * math.tau for i in range(15)]]
        strokes.append(Stroke(wheel, color=INK, width=4, seed=seed + 100 + g, amplitude=1.3, closed=True))
        strokes.append(Stroke([(gx + 12 * s, gy - wr * 0.6), (gx + 44 * s, gy + 2)], color=INK, width=4, seed=seed + 130 + g, amplitude=1.2))
        ang = 143 + rng.uniform(-6, 6)
        a = math.radians(ang)
        blen = 96 * s
        bx0, by0 = gx - 2 * s, gy - wr * 1.15
        tipx, tipy = bx0 + math.cos(a) * blen, by0 - math.sin(a) * blen
        strokes.append(Stroke([(bx0, by0), (tipx, tipy)], color=INK, width=7, seed=seed + 160 + g, amplitude=1.1))
        strokes.append(Stroke([(bx0 - 6 * s, by0 + 6 * s), (bx0 + 10 * s, by0 - 4 * s)], color=INK, width=6, seed=seed + 190 + g, amplitude=0.9))
        muzzles.append((tipx, tipy, ang))

    # shell craters + debris across no-man's-land (otherwise a dead empty band)
    for i in range(7):
        cx_ = x0 + (x1 - x0) * (0.07 + 0.13 * i) + rng.uniform(-40, 40)
        cy_ = rng.uniform(636, 726)
        cw = rng.uniform(60, 130) * scale
        ch = cw * rng.uniform(0.16, 0.26)
        lip = [(cx_ - cw / 2, cy_), (cx_ - cw * 0.22, cy_ - ch), (cx_ + cw * 0.24, cy_ - ch * 0.85), (cx_ + cw / 2, cy_)]
        strokes.append(Stroke(lip, color=INK, width=3, seed=seed + 400 + i, amplitude=1.6))
        strokes.append(Stroke([(cx_ - cw * 0.32, cy_ + ch * 0.5), (cx_ + cw * 0.30, cy_ + ch * 0.45)], color=INK, width=2, seed=seed + 430 + i, amplitude=1.2, alpha=140))
    for i in range(14):
        dx_ = rng.uniform(x0 + 40, x1 - 40)
        dy_ = rng.uniform(628, 740)
        dl = rng.uniform(9, 20)
        strokes.append(Stroke([(dx_, dy_), (dx_ + dl, dy_ - dl * rng.uniform(-0.5, 0.5))], color=INK, width=2, seed=seed + 500 + i, amplitude=0.8, alpha=130))

    return {"strokes": strokes, "texts": [], "muzzles": muzzles, "crest": crest}


def muzzle_flash(pos, angle_deg=148, scale=1.0, seed=0, color=BRICK):
    """A filled flame burst pinned to a gun's barrel tip.

    Solid-filled (not outlined) so the frame visibly brightens when it fires --
    that jump is the whole point of the beat.
    """
    rng = seeded_rng(seed, "flash")
    a = math.radians(angle_deg)
    ux, uy = math.cos(a), -math.sin(a)
    px, py = -uy, ux
    x, y = pos
    L = 132 * scale * rng.uniform(0.88, 1.18)
    W = 30 * scale

    def lobe(length, width, jag):
        pts = []
        steps = 7
        for i in range(steps + 1):
            t = i / steps
            w = width * math.sin(math.pi * t * 0.94) * rng.uniform(1 - jag, 1 + jag)
            d = length * t
            pts.append((x + ux * d + px * w, y + uy * d + py * w))
        for i in range(steps, -1, -1):
            t = i / steps
            w = width * math.sin(math.pi * t * 0.94) * rng.uniform(1 - jag, 1 + jag)
            d = length * t
            pts.append((x + ux * d - px * w, y + uy * d - py * w))
        return pts

    strokes = [
        FilledShape(lobe(L, W, 0.22), color=color, seed=seed + 1, amplitude=2.6, outline=color, outline_width=3),
    ]
    # darker inner core reads as the hotter centre of the burst
    strokes.append(FilledShape(lobe(L * 0.5, W * 0.42, 0.16), color=INK, seed=seed + 2, amplitude=1.5, alpha=150))
    # radiating spikes
    for i in range(4):
        ang = a + rng.uniform(-0.6, 0.6)
        d0, d1 = L * 0.78, L * rng.uniform(1.08, 1.45)
        strokes.append(
            Stroke(
                [(x + math.cos(ang) * d0, y - math.sin(ang) * d0), (x + math.cos(ang) * d1, y - math.sin(ang) * d1)],
                color=color, width=3, seed=seed + 10 + i, amplitude=1.5,
            )
        )
    return {"strokes": strokes, "texts": []}


def smoke_puff(cx, cy, scale=1.0, seed=0, color=OLIVE, n=3):
    rng = seeded_rng(seed, "smoke")
    strokes = []
    for k in range(n):
        r = (24 + k * 15) * scale
        ox = cx + rng.uniform(-10, 10) - k * 13 * scale
        oy = cy - k * 24 * scale + rng.uniform(-7, 7)
        pts = []
        m = 11
        for i in range(m):
            t = i / m * math.tau
            rr = r * rng.uniform(0.76, 1.2)
            pts.append((ox + rr * math.cos(t), oy + rr * 0.68 * math.sin(t)))
        strokes.append(Stroke(pts, color=color, width=3, seed=seed + k, amplitude=2.8, closed=True))
    return {"strokes": strokes, "texts": []}


def foreground_trench(seed=0, scale=1.0, y=790, x0=40, x1=1890, n_men=5):
    """The near trench the barrage is being watched from: parapet line, duckboard
    ticks, and a few small crouching silhouettes."""
    rng = seeded_rng(seed, "fgtrench")
    strokes = []
    lip = []
    steps = 9
    for i in range(steps + 1):
        t = i / steps
        lip.append((x0 + (x1 - x0) * t, y + math.sin(t * 4.1) * 13 + rng.uniform(-4, 4)))
    strokes.append(Stroke(lip, color=INK, width=5, seed=seed + 1, amplitude=2.2))
    strokes.append(Stroke([(x0, y + 120), (x1, y + 132)], color=INK, width=4, seed=seed + 2, amplitude=1.8))
    # duckboard ticks between lip and floor
    for i in range(22):
        tx = x0 + (i + 0.5) * (x1 - x0) / 22
        strokes.append(Stroke([(tx, y + 118), (tx + 8, y + 134)], color=INK, width=2, seed=seed + 20 + i, amplitude=0.7))
    # sandbags on the near lip
    for i in range(14):
        bx = x0 + (i + 0.5) * (x1 - x0) / 14 + rng.uniform(-7, 7)
        bw, bh = rng.uniform(24, 34) * scale, rng.uniform(9, 14) * scale
        by = y + math.sin((bx - x0) / (x1 - x0) * 4.1) * 13
        strokes.append(Stroke([(bx - bw / 2, by), (bx - bw * 0.25, by - bh), (bx + bw * 0.25, by - bh), (bx + bw / 2, by)], color=INK, width=2, seed=seed + 60 + i, amplitude=1.0))
    # small crouching soldiers looking over the lip
    for i in range(n_men):
        mx = x0 + (x1 - x0) * (0.13 + 0.18 * i) + rng.uniform(-24, 24)
        my = y + 96
        hs = 13 * scale
        head = [(mx + hs * math.cos(a), my - hs + hs * math.sin(a)) for a in [j / 10 * math.tau for j in range(11)]]
        strokes.append(Stroke(head, color=INK, width=4, seed=seed + 200 + i, amplitude=1.1, closed=True))
        strokes.append(Stroke([(mx, my + hs * 0.1), (mx + rng.uniform(-5, 5), my + 42)], color=INK, width=5, seed=seed + 230 + i, amplitude=1.2))
        strokes.append(Stroke([(mx - 16, my + 16), (mx + 17, my + 9)], color=INK, width=4, seed=seed + 260 + i, amplitude=1.1))
    return {"strokes": strokes, "texts": []}


def star_field(seed=0, n=14, y_max=400, x0=140, x1=1790, color=OLIVE):
    rng = seeded_rng(seed, "stars")
    strokes = []
    for i in range(n):
        sx = rng.uniform(x0, x1)
        sy = rng.uniform(70, y_max)
        r = rng.uniform(2.0, 3.2)
        strokes.append(Stroke([(sx - r, sy), (sx + r, sy)], color=color, width=2, seed=seed + i, amplitude=0.4))
        strokes.append(Stroke([(sx, sy - r), (sx, sy + r)], color=color, width=2, seed=seed + 100 + i, amplitude=0.4))
    return {"strokes": strokes, "texts": []}
