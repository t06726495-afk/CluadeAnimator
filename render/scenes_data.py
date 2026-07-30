"""
The 180-scene manifest across the 4 sections, matching the user's exact
section timestamps:
    Section 1  0:00-3:23   (203s)  40 images  Bouin, Halswelle, Wilding
    Section 2  3:23-8:03   (280s)  56 images  Bell, Tull, Grant, Hobey Baker
    Section 3  8:03-11:36  (213s)  43 images  Kusocinski, Nile Kinnick, Paddock
    Section 4  11:36-15:06 (210s)  41 images  Blozis, Takeichi Nishi, Lummus (+CTA)

Corrected on-screen spellings used throughout: Halswelle, Hobey Baker,
Kusocinski, Nile Kinnick, Blozis, Takeichi Nishi, Lummus, Neuve-Chapelle,
Aubers Ridge, Contalmaison.
"""
import math

from render import library as lib
from render.doodle import INK, OLIVE, BRICK, Stroke

CX, CY = 560, 760          # default figure anchor (left third, wide right margin)
GY = 860                   # default ground line y
CAP_POS = (1310, 975)


# ---------------------------------------------------------------------------
# Environment builders -- each returns a `background` list for build_scene()
# ---------------------------------------------------------------------------
def _ground(seed, x0=80, x1=1840, y=GY):
    return [lambda figs, s=seed: {"strokes": [Stroke([(x0, y), (x1, y)], color=INK, width=4, seed=s + 1, amplitude=1.3)], "texts": []}]


def env_plain(seed):
    return _ground(seed)


def env_track(seed):
    return _ground(seed) + [lambda figs, s=seed: lib.stadium_arch(1500, 700, scale=1.3, seed=s + 10, color=OLIVE)]


def env_medal(seed):
    return _ground(seed) + [
        lambda figs, s=seed: lib.medal(1460, 740, scale=1.1, seed=s + 20, color=BRICK),
        lambda figs, s=seed: lib.olympic_rings(1460, 860, scale=0.8, seed=s + 30, color=INK),
    ]


def env_court(seed):
    net_posts = [(1400, GY), (1400, GY - 90), (1600, GY - 90), (1600, GY)]

    def net(figs, s=seed):
        strokes = [Stroke(net_posts, color=INK, width=3, seed=s + 1, amplitude=1.2, smooth=False)]
        for i in range(5):
            x = 1400 + (i + 0.5) * 40
            strokes.append(Stroke([(x, GY - 90), (x, GY)], color=INK, width=1, seed=s + 2 + i, amplitude=0.6))
        return {"strokes": strokes, "texts": []}

    return _ground(seed) + [net]


def env_pitch(seed):
    def goal(figs, s=seed):
        gp = [(1440, GY), (1440, GY - 100), (1620, GY - 100), (1620, GY)]
        strokes = [Stroke(gp, color=INK, width=4, seed=s + 1, amplitude=1.4, smooth=False)]
        return {"strokes": strokes, "texts": []}

    return _ground(seed) + [goal]


def env_diamond(seed):
    def plate(figs, s=seed):
        cx, cy = 1500, GY - 10
        pts = [(cx - 16, cy), (cx - 16, cy - 16), (cx, cy - 26), (cx + 16, cy - 16), (cx + 16, cy)]
        return {"strokes": [Stroke(pts, color=INK, width=3, seed=s + 1, amplitude=1.0, closed=True, smooth=False)], "texts": []}

    return _ground(seed) + [plate]


def env_trench(seed):
    return [
        lambda figs, s=seed: lib.trench(1420, 700, 480, seed=s + 1, scale=1.1),
        lambda figs, s=seed: lib.barbed_wire(1250, 630, 1650, 610, seed=s + 2, n=5),
    ]


def env_sky(seed):
    return _ground(seed, y=960)


def env_grave(seed):
    return _ground(seed) + [
        lambda figs, s=seed: lib.gravestone_cross(1460, 830, scale=1.2, seed=s + 1),
        lambda figs, s=seed: lib.laurel_wreath(1460, 780, scale=0.8, seed=s + 2, color=OLIVE),
    ]


def env_sea(seed):
    return [lambda figs, s=seed: lib.waves(1000, 900, 1650, seed=s + 1, n=8)]


def env_snow(seed):
    return [lambda figs, s=seed: lib.mountain_range(1000, GY, 1750, seed=s + 1, snowy=True, scale=1.1)]


def env_volcanic(seed):
    return [lambda figs, s=seed: lib.volcanic_island(1000, GY, 1750, seed=s + 1, scale=1.2)]


def env_office(seed):
    return _ground(seed) + [lambda figs, s=seed: lib.newspaper(1460, 740, scale=1.1, seed=s + 1)]


def env_forest(seed):
    def trees(figs, s=seed):
        strokes = []
        for i, x in enumerate([1280, 1420, 1560, 1700]):
            trunk = [(x, GY), (x, GY - 60)]
            canopy = [(x - 34, GY - 55), (x, GY - 130), (x + 34, GY - 55)]
            strokes.append(Stroke(trunk, color=INK, width=3, seed=s + i, amplitude=1.0))
            strokes.append(Stroke(canopy, color=OLIVE, width=3, seed=s + i + 10, amplitude=1.4, closed=True))
        return {"strokes": strokes, "texts": []}

    return _ground(seed) + [trees]


def env_prison(seed):
    def wall(figs, s=seed):
        pts = [(1300, GY), (1300, 650), (1650, 650), (1650, GY)]
        strokes = [Stroke(pts, color=INK, width=4, seed=s + 1, amplitude=1.4, smooth=False)]
        for i in range(3):
            x = 1350 + i * 110
            strokes.append(Stroke([(x, 700), (x, 760), (x + 40, 760), (x + 40, 700), (x, 700)], color=INK, width=2, seed=s + 2 + i, amplitude=0.8, closed=True, smooth=False))
        return {"strokes": strokes, "texts": []}

    return _ground(seed) + [wall]


def env_carrier(seed):
    return [
        lambda figs, s=seed: lib.ship_hull(1450, 820, scale=1.3, seed=s + 1),
        lambda figs, s=seed: lib.waves(1450, 900, 700, seed=s + 2, n=5),
    ]


ENV = {
    "plain": env_plain, "track": env_track, "medal": env_medal, "court": env_court,
    "pitch": env_pitch, "diamond": env_diamond, "trench": env_trench, "sky": env_sky,
    "grave": env_grave, "sea": env_sea, "snow": env_snow, "volcanic": env_volcanic,
    "office": env_office, "forest": env_forest, "prison": env_prison, "carrier": env_carrier,
}


# ---------------------------------------------------------------------------
# Auto-attached hand props, keyed by pose name
# ---------------------------------------------------------------------------
def _auto_prop(pose, figs, seed):
    f = figs[0]
    facing = f.get("facing", 1)
    if pose == "serve_tennis":
        return lib.tennis_racket(f["hand_front"], angle_deg=115 if facing == 1 else 65, seed=seed)
    if pose in ("aim_rifle",):
        return lib.rifle(f["hand_front"], angle_deg=35 if facing == 1 else 145, seed=seed)
    if pose == "prone_fire":
        return lib.rifle(f["hand_front"], angle_deg=8 if facing == 1 else 172, seed=seed)
    if pose == "catch_glove":
        hb = f["hand_back"]
        return lib.ball(hb[0] - 8, hb[1] - 10, r=7, seed=seed)
    if pose == "swing_bat":
        return lib.baseball_bat(f["hand_front"], angle_deg=95 if facing == 1 else 85, seed=seed)
    if pose == "pitch_throw":
        hf = f["hand_front"]
        return lib.ball(hf[0], hf[1], r=6, seed=seed)
    if pose == "throw_grenade":
        hb = f["hand_back"]
        return lib.ball(hb[0], hb[1], r=7, seed=seed, color=OLIVE)
    if pose == "raise_trophy":
        hf, hb = f["hand_front"], f["hand_back"]
        cx = (hf[0] + hb[0]) / 2
        cy = min(hf[1], hb[1]) - 6
        return lib.trophy_cup(cx, cy, scale=0.75, seed=seed, color=BRICK)
    if pose == "hold_medal":
        sh = f["shoulder"]
        return lib.medal(sh[0], sh[1] + 55, scale=0.65, seed=seed, color=BRICK)
    return None


AUTO_PROP_POSES = {
    "serve_tennis", "aim_rifle", "prone_fire", "catch_glove", "swing_bat",
    "pitch_throw", "throw_grenade", "raise_trophy", "hold_medal",
}


# ---------------------------------------------------------------------------
# Compiler: turns a compact per-person beat list into exact-timed scene dicts
# ---------------------------------------------------------------------------
def compile_person(person_key, t_start, t_end, count, beats, namecard_text, namecard_sub, base_cx=CX, base_cy=CY, base_scale=2.15):
    n = count
    dur_each = (t_end - t_start) / n
    nb = len(beats)
    scenes = []
    for i in range(n):
        t0 = t_start + i * dur_each
        pass_num = i // nb
        idx = i % nb
        pose, env_key, caption = beats[idx]
        facing = 1 if (pass_num % 2 == 0) else -1
        variant = pass_num % 3
        scale = base_scale * (1.0 if variant == 0 else (1.08 if variant == 1 else 0.93))
        cx = base_cx + (30 if pass_num % 2 == 1 else -10)
        seed_id = f"{person_key}_{i}"

        figures = []
        if pose is not None:
            figures = [{"pose": pose, "cx": cx, "cy": base_cy, "scale": scale, "facing": facing}]

        background = ENV[env_key](hash((seed_id, "env")) % 100000)
        foreground = []
        if pose in AUTO_PROP_POSES and figures:
            foreground.append(lambda figs, _p=pose, _s=hash((seed_id, "prop")) % 100000: _auto_prop(_p, figs, _s))

        spec = {"figures": figures, "background": background, "foreground": foreground, "caption_pos": CAP_POS}
        if i == 0:
            spec["namecard"] = {"text": namecard_text, "subtext": namecard_sub}
        if caption:
            spec["caption"] = caption

        scenes.append({"t_start": t0, "duration": dur_each, "spec": spec, "seed_id": seed_id})
    return scenes


def cta_scene(t_start, duration, seed_id="cta_outro"):
    def pointer(figs, s=1):
        hf = figs[0]["hand_front"]
        return lib.arrow(hf[0] + 10, hf[1] - 10, hf[0] + 140, hf[1] - 70, seed=s, color=BRICK, width=5)

    def play_button(figs, s=2):
        cx, cy, r = 1500, 720, 70
        circ = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i / 20 * math.tau for i in range(21)]]
        tri = [(cx - 22, cy - 32), (cx - 22, cy + 32), (cx + 30, cy)]
        strokes = [
            Stroke(circ, color=INK, width=5, seed=s + 1, amplitude=1.6, closed=True),
            Stroke(tri, color=BRICK, width=4, seed=s + 2, amplitude=1.2, closed=True, smooth=False),
        ]
        return {"strokes": strokes, "texts": []}

    spec = {
        "figures": [{"pose": "point_forward", "cx": 520, "cy": 760, "scale": 2.2, "facing": 1}],
        "background": _ground(hash("cta") % 100000),
        "foreground": [pointer, play_button],
        "caption": "Watch more",
        "caption_pos": (1500, 900),
    }
    return {"t_start": t_start, "duration": duration, "spec": spec, "seed_id": seed_id}


# ---------------------------------------------------------------------------
# Section boundaries (seconds) -- exact per the user's cut points
# ---------------------------------------------------------------------------
SECTION_BOUNDS = [(0, 203), (203, 483), (483, 696), (696, 906)]


def build_section1():
    scenes = []
    scenes += compile_person(
        "bouin", 0, 66, 13,
        [
            ("stand", "track", None),
            ("run", "track", None),
            ("sprint_lean", "track", "vs. Hannes Kolehmainen"),
            ("leap_tape", "track", "1912 Stockholm - 5000m"),
            ("hold_medal", "medal", "Silver medal"),
            ("march", "plain", "Aug 1914 - mobilized"),
            ("at_attention", "trench", None),
            ("collapse", "plain", "Sept 29, 1914 - age 25"),
        ],
        "Jean Bouin", "France - distance runner",
    )
    scenes += compile_person(
        "halswelle", 66, 133, 13,
        [
            ("stand", "track", None),
            ("run", "track", "1908 London"),
            ("leap_tape", "track", "The walkover final"),
            ("salute", "plain", None),
            ("march", "trench", "Neuve-Chapelle, Mar 1915"),
            ("stumble", "trench", "Wounded by shrapnel"),
            ("collapse", "trench", "Mar 31, 1915 - age 32"),
        ],
        "Halswelle", "Scotland - 400m, army officer",
    )
    scenes += compile_person(
        "wilding", 133, 203, 14,
        [
            ("stand", "court", None),
            ("serve_tennis", "court", None),
            ("raise_trophy", "court", "4x Wimbledon, 1910-13"),
            ("stand", "plain", "Royal Marines"),
            ("march", "trench", "Aubers Ridge, May 1915"),
            ("collapse", "trench", "May 9, 1915 - age 31"),
            (None, "court", "Wimbledon went dark"),
        ],
        "Anthony Wilding", "New Zealand - tennis champion",
    )
    return scenes


def build_section2():
    scenes = []
    scenes += compile_person(
        "bell", 203, 274, 14,
        [
            ("stand", "pitch", None),
            ("run", "pitch", None),
            ("march", "trench", "Enlisted, 1914"),
            ("throw_grenade", "trench", "Somme, July 5 1916"),
            ("point_forward", "trench", "Silenced the gun"),
            ("hold_medal", "medal", "Victoria Cross"),
            ("stand", "plain", '"Only did my duty"'),
            ("collapse", "trench", "July 10, 1916 - age 25"),
        ],
        "Donald Bell", "England - footballer, VC",
    )
    scenes += compile_person(
        "tull", 274, 342, 14,
        [
            ("stand", "pitch", None),
            ("run", "pitch", None),
            ("salute", "plain", "Commissioned, 1917"),
            ("point_forward", "trench", "Leading troops, Italy"),
            ("march", "trench", "Spring offensive, 1918"),
            ("collapse", "trench", "Mar 25, 1918"),
            (None, "grave", "Missing - never found"),
        ],
        "Walter Tull", "England - footballer, officer",
    )
    scenes += compile_person(
        "grant", 342, 413, 14,
        [
            ("stand", "diamond", None),
            ("catch_glove", "diamond", '"I have it!"'),
            ("stand", "office", "Retired to law, 1915"),
            ("march", "trench", "Volunteered for war"),
            ("point_forward", "trench", "Argonne Forest, Oct 1918"),
            ("point_forward", "trench", "Lost Battalion rescue"),
            ("collapse", "trench", "Oct 5, 1918 - age 35"),
            (None, "track", "Plaque - later lost"),
        ],
        "Eddie Grant", 'USA - infielder, "Harvard Eddie"',
    )
    scenes += compile_person(
        "baker", 413, 483, 14,
        [
            ("stand", "pitch", None),
            ("run", "pitch", "Princeton legend"),
            ("raise_trophy", "medal", None),
            ("fly_cockpit", "sky", "Fighter pilot, France"),
            ("fly_cockpit", "sky", "Squadron commander"),
            ("stand", "plain", "Armistice - orders home"),
            ("point_forward", "sky", "Dec 21, 1918 - one last flight"),
            ("collapse", "sky", "Age 26 - survived the war"),
        ],
        "Hobey Baker", "USA - hockey & football star",
    )
    return scenes


def build_section3():
    scenes = []
    scenes += compile_person(
        "kusocinski", 483, 558, 15,
        [
            ("stand", "track", None),
            ("run", "track", "1932 LA Olympics"),
            ("sprint_lean", "track", "Bleeding foot, ran on"),
            ("leap_tape", "track", "10,000m gold"),
            ("march", "trench", "Defended Warsaw, 1939"),
            ("point_forward", "plain", "Underground resistance"),
            ("stand", "prison", "Arrested, Mar 1940"),
            ("collapse", "forest", "June 21, 1940 - age 33"),
        ],
        "Janusz Kusocinski", "Poland - 10,000m gold",
    )
    scenes += compile_person(
        "kinnick", 558, 631, 14,
        [
            ("stand", "pitch", None),
            ("run", "pitch", "1939 Heisman Trophy"),
            ("point_forward", "plain", '"...not battlefields"'),
            ("fly_cockpit", "sky", "Navy aviator"),
            ("fly_cockpit", "carrier", "USS Lexington"),
            ("stumble", "sky", "June 2, 1943 - oil leak"),
            (None, "sea", "Ditched at sea - age 24"),
        ],
        "Nile Kinnick", "USA - Heisman Trophy, 1939",
    )
    scenes += compile_person(
        "paddock", 631, 696, 14,
        [
            ("stand", "track", None),
            ("leap_tape", "track", "1920 Olympic gold"),
            ("raise_trophy", "medal", "Chariots of Fire"),
            ("salute", "plain", "WWI artillery officer"),
            ("salute", "plain", "WWII Marine captain, age 42"),
            ("fly_cockpit", "sky", "Flight to Alaska"),
            (None, "snow", "July 21, 1943 - Sitka, Alaska"),
        ],
        "Charlie Paddock", 'USA - "world\'s fastest human"',
    )
    return scenes


def build_section4():
    scenes = []
    scenes += compile_person(
        "blozis", 696, 766, 13,
        [
            ("stand", "track", None),
            ("pitch_throw", "track", "Georgetown champion"),
            ("stand", "pitch", "NY Giants tackle"),
            ("throw_grenade", "plain", "94-yard grenade throw"),
            ("raise_trophy", "pitch", "Dec 1944 - championship"),
            ("point_forward", "snow", "Vosges Mountains"),
            (None, "snow", "Jan 31, 1945 - never returned"),
        ],
        "Al Blozis", 'USA - "human howitzer"',
    )
    scenes += compile_person(
        "nishi", 766, 839, 14,
        [
            ("stand", "track", None),
            ("stand", "medal", "Gold - show jumping, 1932"),
            ("wave", "plain", "Hollywood celebrity"),
            ("stand", "volcanic", "Tank regiment, Iwo Jima"),
            ("point_forward", "volcanic", "Dug into volcanic rock"),
            (None, "volcanic", "March 1945 - age 42"),
            (None, "plain", "Uranus died days later"),
        ],
        "Takeichi Nishi", "Japan - equestrian gold, 1932",
    )
    lummus_scenes = compile_person(
        "lummus", 839, 906, 14,
        [
            ("stand", "pitch", None),
            ("run", "pitch", "1941 championship game"),
            ("march", "volcanic", "Iwo Jima, Feb 1945"),
            ("throw_grenade", "volcanic", "Mar 8 - three positions"),
            ("point_forward", "volcanic", "Pressed forward"),
            ("stumble", "volcanic", "Stepped on a mine"),
            (None, "plain", "Medal of Honor"),
        ],
        "Jack Lummus", "USA - NY Giants end, Marine",
    )
    # swap the final Lummus slot for the outro CTA (kept inside his 14-image
    # budget and inside section 4's exact end timestamp, per spec)
    last = lummus_scenes[-1]
    lummus_scenes[-1] = cta_scene(last["t_start"], last["duration"])
    scenes += lummus_scenes
    return scenes


SECTIONS = [build_section1, build_section2, build_section3, build_section4]
SECTION_NAMES = ["The First Weeks", "The Long Middle", "The Next One", "The Last Months"]
EXPECTED_COUNTS = [40, 56, 43, 41]


def validate():
    ok = True
    for i, (builder, (t0, t1), expected) in enumerate(zip(SECTIONS, SECTION_BOUNDS, EXPECTED_COUNTS)):
        scenes = builder()
        n = len(scenes)
        total_dur = sum(s["duration"] for s in scenes)
        span = t1 - t0
        first_t = scenes[0]["t_start"]
        last_end = scenes[-1]["t_start"] + scenes[-1]["duration"]
        status = "OK" if (n == expected and abs(total_dur - span) < 1e-6 and abs(first_t - t0) < 1e-6 and abs(last_end - t1) < 1e-6) else "MISMATCH"
        if status != "OK":
            ok = False
        print(f"Section {i+1} '{SECTION_NAMES[i]}': {n} scenes (expected {expected}), span {first_t:.2f}-{last_end:.2f} (target {t0}-{t1}), total_dur={total_dur:.2f} -> {status}")
    return ok


if __name__ == "__main__":
    validate()
