"""Cutout run-cycle animator, flat-cartoon style.

Demonstrates the technique for animating a still character illustration:
a jointed skeleton drives outlined limbs, the body bobs against the
supporting leg, background layers scroll at different rates for depth,
and dust puffs spawn on footfall.

The scene here is a procedural stand-in for a supplied illustration. The
part that matters is the rig: skeleton() + draw_runner() retarget onto
any cut-out character with the same joint set.

Render:  python3 -m render.runner_demo
Preview: python3 -m render.runner_demo --preview
"""

import argparse
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw

W, H = 1920, 1080
FPS = 24
CYCLE_FRAMES = 15          # frames per full stride (2 steps)
CYCLES = 8                 # 8 * 15 = 120 frames = 5s, loops seamlessly
TOTAL_FRAMES = CYCLE_FRAMES * CYCLES

OUTLINE = (26, 24, 22)
SKIN = (247, 244, 238)
SKIN_SHADE = (223, 217, 208)   # far-side limbs, to imply depth
DUST = (216, 198, 180)
CLOTH = (252, 250, 246)
HAIR = (74, 55, 40)
SHOE = (58, 44, 34)
SKY = (185, 199, 206)
CLOUD = (201, 212, 217)
WOOD = (200, 180, 140)
WOOD_D = (162, 140, 101)
WOOD_S = (138, 118, 80)
GRASS = (142, 156, 107)
TRACK = (176, 106, 92)
TRACK_L = (188, 122, 107)
LANE = (203, 147, 133)
CROWD = (92, 82, 74)

GROUND_Y = 820
CX = int(W * 0.42)

HEAD_R = 105
NECK = 8
TORSO = 135
THIGH, SHIN, FOOT = 105, 100, 34
UARM, FARM = 72, 66
TORSO_W = 96
LIMB_W = 26
OUT_W = 5

# layer scroll: px/frame at rate 1.0, and tile widths chosen so every
# layer's total travel over the loop is a whole number of tiles.
BASE_PX = 16
LAYERS = [
    ("sky", 0.0, 192),
    ("stand", 0.35, 672),
    ("grass", 0.60, 576),
    ("track", 1.00, 480),
]


def dvec(deg):
    r = math.radians(deg)
    return math.sin(r), math.cos(r)


def limb(d, pts, width=LIMB_W, fill=SKIN):
    d.line(pts, fill=OUTLINE, width=width + 2 * OUT_W, joint="curve")
    d.line(pts, fill=fill, width=width, joint="curve")
    for p in (pts[0], pts[-1]):
        r = (width + 2 * OUT_W) // 2
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=OUTLINE)
        r2 = width // 2
        d.ellipse([p[0] - r2, p[1] - r2, p[0] + r2, p[1] + r2], fill=fill)


def leg_chain(hip, theta, amp=48.0):
    """Hip/knee/ankle/toe for one leg at cycle phase theta (radians)."""
    thigh_a = amp * math.sin(theta)
    # knee flexes hardest just after the leg passes rearmost
    flex = 12 + 68 * max(0.0, -math.sin(theta - 0.9))
    shin_a = thigh_a - flex
    kx, ky = dvec(thigh_a)
    knee = (hip[0] + THIGH * kx, hip[1] + THIGH * ky)
    ax, ay = dvec(shin_a)
    ankle = (knee[0] + SHIN * ax, knee[1] + SHIN * ay)
    fx, fy = dvec(shin_a + 78)
    toe = (ankle[0] + FOOT * fx, ankle[1] + FOOT * fy)
    return knee, ankle, toe, thigh_a


def arm_chain(sh, theta):
    sh_a = -48 * math.sin(theta)
    # keep the forearm from folding back through the chest
    flex = 46 + 16 * math.cos(theta)
    fa = sh_a + flex
    ex, ey = dvec(sh_a)
    elbow = (sh[0] + UARM * ex, sh[1] + UARM * ey)
    hx, hy = dvec(fa)
    hand = (elbow[0] + FARM * hx, elbow[1] + FARM * hy)
    return elbow, hand, sh_a


def skeleton(theta):
    """Pose for cycle phase theta, hip height solved from the support leg.

    Limb rotation is hip-relative, so the toe offsets below are independent
    of where the hip sits. That lets the hip be placed exactly so the lower
    toe rests on GROUND_Y -- the support foot stays planted instead of
    sliding vertically, and the body's rise and fall falls out of the leg
    geometry rather than an independent sine that fights it.
    """
    a_off = leg_chain((0.0, 0.0), theta)
    b_off = leg_chain((0.0, 0.0), theta + math.pi)
    drop = max(a_off[2][1], b_off[2][1])
    hip = (CX, GROUND_Y - drop)
    sh = (CX + 6, hip[1] - TORSO)
    head = (CX + 12, sh[1] - NECK - HEAD_R)
    legA = leg_chain(hip, theta)
    legB = leg_chain(hip, theta + math.pi)
    # shoulders spread so the rear arm clears the torso silhouette
    armA = arm_chain((sh[0] - 26, sh[1]), theta + math.pi)
    armB = arm_chain((sh[0] + 20, sh[1]), theta)
    planted = "A" if legA[2][1] >= legB[2][1] else "B"
    return dict(hip=hip, sh=sh, head=head, legA=legA, legB=legB,
                armA=armA, armB=armB, planted=planted)


def draw_runner(d, sk):
    hip, sh, head = sk["hip"], sk["sh"], sk["head"]
    legs = sorted([sk["legA"], sk["legB"]], key=lambda L: L[3])
    arms = sorted([sk["armA"], sk["armB"]], key=lambda A: A[2])

    def draw_leg(L, fill=SKIN):
        knee, ankle, toe, _ = L
        limb(d, [hip, knee, ankle], fill=fill)
        limb(d, [ankle, toe], width=LIMB_W - 4, fill=SHOE)

    def draw_arm(A, fill=SKIN):
        elbow, hand, _ = A
        # anchor at the torso edge, not the spine, so a neutral arm is not
        # swallowed by the singlet silhouette
        ox = -TORSO_W // 2 if fill is SKIN_SHADE else TORSO_W // 2
        limb(d, [(sh[0] + ox, sh[1]), elbow, hand], width=LIMB_W - 5, fill=fill)

    draw_leg(legs[0], SKIN_SHADE)

    # singlet, then shorts over its hem
    d.polygon(
        [
            (sh[0] - TORSO_W // 2 + 6, sh[1] - 10),
            (sh[0] + TORSO_W // 2 - 6, sh[1] - 10),
            (sh[0] + TORSO_W // 2 + 2, sh[1] + 30),
            (hip[0] + TORSO_W // 2 - 4, hip[1] - 4),
            (hip[0] - TORSO_W // 2 + 4, hip[1] - 4),
            (sh[0] - TORSO_W // 2 - 2, sh[1] + 30),
        ],
        fill=CLOTH,
        outline=OUTLINE,
        width=OUT_W,
    )
    d.polygon(
        [
            (hip[0] - TORSO_W // 2 - 2, hip[1] - 26),
            (hip[0] + TORSO_W // 2 + 2, hip[1] - 26),
            (hip[0] + TORSO_W // 2 + 10, hip[1] + 34),
            (hip[0] + 6, hip[1] + 26),
            (hip[0] - 6, hip[1] + 26),
            (hip[0] - TORSO_W // 2 - 10, hip[1] + 34),
        ],
        fill=CLOTH,
        outline=OUTLINE,
        width=OUT_W,
    )

    draw_leg(legs[1])
    # both arms sit in front of the torso -- antiphase swing puts them both
    # near vertical at the passing frame, and behind the torso that reads as
    # the figure briefly losing its arms. Shading carries the depth instead.
    draw_arm(arms[0], SKIN_SHADE)
    draw_arm(arms[1])

    # head
    hx, hy = head
    d.ellipse(
        [hx - HEAD_R, hy - HEAD_R, hx + HEAD_R, hy + HEAD_R],
        fill=SKIN,
        outline=OUTLINE,
        width=OUT_W,
    )
    # hair: chord fills arc-to-chord, so it sits as a cap on the skull
    # instead of a pie wedge slicing across the face
    box = [hx - HEAD_R, hy - HEAD_R, hx + HEAD_R, hy + HEAD_R]
    d.chord(box, start=196, end=344, fill=HAIR)
    d.arc(box, start=196, end=344, fill=OUTLINE, width=OUT_W)
    d.line(
        [
            (hx + HEAD_R * math.cos(math.radians(196)), hy + HEAD_R * math.sin(math.radians(196))),
            (hx + HEAD_R * math.cos(math.radians(344)), hy + HEAD_R * math.sin(math.radians(344))),
        ],
        fill=OUTLINE,
        width=OUT_W - 1,
    )
    for ex in (-30, 26):
        d.ellipse([hx + ex - 11, hy - 24, hx + ex + 11, hy + 4], fill=OUTLINE)
    # mustache
    d.polygon(
        [(hx - 34, hy + 44), (hx, hy + 34), (hx + 34, hy + 44),
         (hx + 20, hy + 58), (hx, hy + 50), (hx - 20, hy + 58)],
        fill=HAIR,
    )


def build_layer(name, tile_w):
    """One horizontally tileable background layer, wide enough to scroll."""
    img = Image.new("RGBA", (W + tile_w, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    n = img.width // tile_w + 2

    if name == "sky":
        # sky does not scroll, so it needs no tileable period and the clouds
        # can be irregular instead of a visibly repeating band
        import random

        d.rectangle([0, 0, img.width, GROUND_Y], fill=SKY)
        rng = random.Random(7)
        for _ in range(13):
            cx = rng.randint(-60, img.width)
            cy = rng.randint(52, 190)
            sc = rng.uniform(0.7, 1.7)
            for ox, oy, w, h in ((0, 0, 150, 52), (78, -18, 132, 58), (-64, 12, 116, 44)):
                d.ellipse(
                    [cx + ox * sc, cy + oy * sc,
                     cx + (ox + w) * sc, cy + (oy + h) * sc],
                    fill=CLOUD,
                )
    elif name == "stand":
        SHADE = (118, 104, 86)
        for k in range(n):
            x = k * tile_w
            # shadowed interior first, so the stand reads as a covered
            # structure rather than a roof floating over open sky
            d.rectangle([x, 258, x + tile_w, 470], fill=SHADE)
            # back wall slats
            for i in range(8):
                y = 268 + i * 26
                d.line([(x, y), (x + tile_w, y)], fill=(104, 92, 76), width=2)
            # roof slab, overhanging
            d.rectangle([x - 4, 226, x + tile_w + 4, 258], fill=WOOD_D, outline=OUTLINE, width=3)
            # posts
            for px in range(16, tile_w, 112):
                d.rectangle([x + px, 258, x + px + 13, 470], fill=WOOD_S, outline=OUTLINE, width=2)
            # tiers
            d.rectangle([x, 470, x + tile_w, 600], fill=WOOD)
            for i in range(5):
                y = 486 + i * 24
                d.line([(x, y), (x + tile_w, y)], fill=WOOD_S, width=3)
            # two stair bands per tile
            for sxb in (tile_w // 3, tile_w - 110):
                d.rectangle([x + sxb, 470, x + sxb + 34, 600], fill=WOOD_D)
                for i in range(5):
                    d.line([(x + sxb, 484 + i * 24), (x + sxb + 34, 484 + i * 24)],
                           fill=WOOD_S, width=2)
            # spectators across the tiers
            for i in range(16):
                sx = 26 + i * 41
                if sx > tile_w - 20:
                    break
                sy = 482 + ((i * 3) % 5) * 24
                d.ellipse([x + sx - 5, sy - 12, x + sx + 5, sy - 2], fill=CROWD)
                d.line([(x + sx, sy - 2), (x + sx, sy + 10)], fill=CROWD, width=3)
                d.line([(x + sx - 7, sy + 14), (x + sx, sy + 10), (x + sx + 7, sy + 14)],
                       fill=CROWD, width=3)
            d.line([(x, 600), (x + tile_w, 600)], fill=OUTLINE, width=4)
    elif name == "grass":
        d.rectangle([0, 600, img.width, 720], fill=GRASS)
        for k in range(n):
            x = k * tile_w
            for gx in (30, 120, 250, 330):
                d.line([(x + gx, 700), (x + gx + 6, 684)], fill=WOOD_S, width=2)
        d.line([(0, 718), (img.width, 718)], fill=OUTLINE, width=3)
    elif name == "track":
        d.rectangle([0, 720, img.width, H], fill=TRACK)
        d.rectangle([0, 720, img.width, 742], fill=TRACK_L)
        for y in (790, 880, 985):
            d.line([(0, y), (img.width, y)], fill=LANE, width=4)
        for k in range(n):
            x = k * tile_w
            for sx, sy in ((60, 840), (180, 930), (280, 770), (140, 1020)):
                d.ellipse([x + sx, sy, x + sx + 7, sy + 5], fill=LANE)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--out", default="output/demo/runner_loop.mp4")
    a = ap.parse_args()

    layers = [(rate, tw, build_layer(nm, tw)) for nm, rate, tw in LAYERS]

    # dust spawns on footfall, read off the rig rather than guessed at a
    # fixed phase. Near the crossover both toes sit at almost equal depth,
    # so a bare argmax flickers between legs frame to frame and fires a puff
    # on each flicker; require the challenger to be clearly lower to switch.
    HYST = 10.0
    puffs = []
    cur = None
    for f in range(TOTAL_FRAMES):
        sk = skeleton(2 * math.pi * f / CYCLE_FRAMES)
        ay, by = sk["legA"][2][1], sk["legB"][2][1]
        if cur is None:
            cur = "A" if ay >= by else "B"
        else:
            other = "B" if cur == "A" else "A"
            oy, cy = (by, ay) if cur == "A" else (ay, by)
            if oy > cy + HYST:
                cur = other
                toe = sk["legA"][2] if cur == "A" else sk["legB"][2]
                puffs.append((f, toe[0], GROUND_Y + 4))

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    if a.preview:
        os.makedirs("output/demo", exist_ok=True)
    else:
        proc = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
             "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
             "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p", a.out],
            stdin=subprocess.PIPE,
        )

    for f in range(TOTAL_FRAMES):
        th = 2 * math.pi * f / CYCLE_FRAMES
        frame = Image.new("RGB", (W, H), SKY)
        for rate, tw, img in layers:
            off = int(round(f * BASE_PX * rate)) % tw
            frame.paste(img.crop((off, 0, off + W, H)), (0, 0), img.crop((off, 0, off + W, H)))

        # dust behind the figure, drifting back with the track
        dust = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dd = ImageDraw.Draw(dust)
        for (pf, px, py) in puffs:
            age = f - pf
            if 0 <= age < 16:
                t = age / 16.0
                r = 18 + 66 * t
                x = px - age * BASE_PX - 18
                y = py - 34 * t
                al = int(205 * (1 - t) ** 1.3)
                for ox, oy, sc in ((0, 0, 1.0), (-r * 0.62, 8, 0.72), (r * 0.58, 11, 0.62)):
                    rr = r * sc
                    dd.ellipse([x + ox - rr, y + oy - rr, x + ox + rr, y + oy + rr],
                               outline=DUST + (al,), width=5)
        frame.paste(Image.alpha_composite(frame.convert("RGBA"), dust).convert("RGB"), (0, 0))

        fig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_runner(ImageDraw.Draw(fig), skeleton(th))
        frame.paste(Image.alpha_composite(frame.convert("RGBA"), fig).convert("RGB"), (0, 0))

        if a.preview:
            if f % 3 == 0 and f < 18:
                frame.save(f"output/demo/prev_{f:03d}.png")
        else:
            proc.stdin.write(frame.tobytes())

    if not a.preview:
        proc.stdin.close()
        proc.wait()
        print("wrote", a.out)
    else:
        print("preview frames in output/demo/")


if __name__ == "__main__":
    sys.exit(main())
