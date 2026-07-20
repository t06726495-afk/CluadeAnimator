"""Render 1920x1080 motion-graphic scene cards with Pillow.

Cards are rendered oversized-friendly flat art; the render stage adds motion
(Ken Burns pan/zoom) on top. If a file exists at
``<project>/assets/custom/scene_NN.png`` (e.g. dropped in from an AI image
generator using the storyboard's ``image_prompt``), it is used as the card
background with a dark overlay so the typography stays readable.
"""

from __future__ import annotations

import glob
import os
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .models import Scene, Storyboard

W, H = 1920, 1080

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
FONT_BOLD = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
FONT_REG = os.path.join(FONT_DIR, "DejaVuSans.ttf")
FONT_SERIF = os.path.join(FONT_DIR, "DejaVuSerif-Bold.ttf")

BG_TOP = (12, 14, 20)
BG_BOTTOM = (22, 26, 38)
TEXT_MAIN = (245, 245, 248)
TEXT_DIM = (168, 174, 188)


def _hex_to_rgb(value: str, fallback: Tuple[int, int, int] = (200, 16, 46)) -> Tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) == 3:
        value = "".join(c * 2 for c in value)
    try:
        return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]
    except (ValueError, IndexError):
        return fallback


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def _text_width(font: ImageFont.FreeTypeFont, text: str) -> int:
    box = font.getbbox(text)
    return box[2] - box[0]


def _wrap(font: ImageFont.FreeTypeFont, text: str, max_width: int) -> List[str]:
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and _text_width(font, candidate) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def _fit(
    path: str, text: str, max_width: int, start: int, minimum: int, max_lines: int
) -> Tuple[ImageFont.FreeTypeFont, List[str]]:
    """Largest font size at which the text wraps into <= max_lines lines."""
    for size in range(start, minimum - 1, -6):
        font = _font(path, size)
        lines = _wrap(font, text, max_width)
        if len(lines) <= max_lines:
            return font, lines
    font = _font(path, minimum)
    return font, _wrap(font, text, max_width)[:max_lines]


def _gradient_background(accent: Tuple[int, int, int]) -> Image.Image:
    tinted_bottom = tuple(min(255, int(c * 0.82 + a * 0.10)) for c, a in zip(BG_BOTTOM, accent))
    column = Image.new("RGB", (1, H))
    for y in range(H):
        t = y / (H - 1)
        column.putpixel(
            (0, y),
            tuple(int(top + (bot - top) * t) for top, bot in zip(BG_TOP, tinted_bottom)),
        )
    return column.resize((W, H))


def _decorate(img: Image.Image, accent: Tuple[int, int, int]) -> None:
    """Subtle large-scale shapes so the Ken Burns motion has something to move."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    # Oversized ring, upper right
    draw.ellipse((W - 700, -420, W + 320, 600), outline=accent + (34,), width=90)
    # Diagonal stripes, lower left
    for i in range(3):
        x = -300 + i * 130
        draw.polygon(
            [(x, H + 200), (x + 70, H + 200), (x + 640, H - 560), (x + 570, H - 560)],
            fill=accent + (16 + i * 6,),
        )
    img.paste(layer, (0, 0), layer)


def _base_card(
    accent: Tuple[int, int, int], custom_bg: Optional[str] = None
) -> Image.Image:
    if custom_bg and os.path.exists(custom_bg):
        img = Image.open(custom_bg).convert("RGB").resize((W, H))
        img = img.filter(ImageFilter.GaussianBlur(1))
        overlay = Image.new("RGBA", (W, H), (8, 10, 16, 175))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    else:
        img = _gradient_background(accent)
    _decorate(img, accent)
    return img


def _footer(draw: ImageDraw.ImageDraw, scene_number: int, total: int) -> None:
    font = _font(FONT_REG, 26)
    label = f"{scene_number:02d} / {total:02d}"
    draw.text((W - 150, H - 64), label, font=font, fill=TEXT_DIM)


def _kicker(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, accent) -> None:
    font = _font(FONT_BOLD, 34)
    spaced = " ".join(text.upper())
    draw.text((x, y), spaced, font=font, fill=accent)


def render_scene(scene: Scene, storyboard: Storyboard, out_path: str, custom_bg: Optional[str]) -> None:
    accent = _hex_to_rgb(storyboard.accent_color)
    spec = scene.visual
    img = _base_card(accent, custom_bg)
    draw = ImageDraw.Draw(img)

    if spec.kind == "title_card":
        _kicker(draw, 160, 300, "Sports History", accent)
        font, lines = _fit(FONT_BOLD, spec.headline, W - 320, 150, 72, 3)
        y = 380
        for line in lines:
            draw.text((160, y), line, font=font, fill=TEXT_MAIN)
            y += int(font.size * 1.18)
        draw.rectangle((160, y + 26, 560, y + 44), fill=accent)
        if spec.subline:
            sub_font, sub_lines = _fit(FONT_REG, spec.subline, W - 320, 48, 32, 2)
            sy = y + 90
            for line in sub_lines:
                draw.text((160, sy), line, font=sub_font, fill=TEXT_DIM)
                sy += int(sub_font.size * 1.3)

    elif spec.kind == "stat_card":
        font, lines = _fit(FONT_BOLD, spec.headline, W - 320, 84, 54, 2)
        y = 150
        for line in lines:
            draw.text((160, y), line, font=font, fill=TEXT_MAIN)
            y += int(font.size * 1.15)
        row_y = y + 90
        value_font = _font(FONT_BOLD, 120)
        label_font = _font(FONT_REG, 40)
        for stat in spec.stats[:4]:
            draw.rectangle((160, row_y + 14, 176, row_y + 130), fill=accent)
            draw.text((216, row_y), stat.value, font=value_font, fill=accent)
            vw = _text_width(value_font, stat.value)
            draw.text((216 + vw + 48, row_y + 66), stat.label, font=label_font, fill=TEXT_DIM)
            row_y += 190

    elif spec.kind == "quote_card":
        draw.text((140, 130), "“", font=_font(FONT_SERIF, 300), fill=accent)
        quote = spec.quote or spec.headline
        font, lines = _fit(FONT_SERIF, quote, W - 480, 76, 44, 5)
        y = 400
        for line in lines:
            draw.text((240, y), line, font=font, fill=TEXT_MAIN)
            y += int(font.size * 1.28)
        if spec.attribution:
            draw.text((240, y + 40), f"— {spec.attribution}", font=_font(FONT_REG, 42), fill=accent)

    elif spec.kind == "timeline_card":
        font, lines = _fit(FONT_BOLD, spec.headline, W - 320, 84, 54, 2)
        y = 130
        for line in lines:
            draw.text((160, y), line, font=font, fill=TEXT_MAIN)
            y += int(font.size * 1.15)
        events = spec.timeline[:5]
        line_x = 200
        start_y = y + 80
        step = min(160, (H - start_y - 120) // max(len(events), 1))
        if events:
            draw.rectangle(
                (line_x - 3, start_y, line_x + 3, start_y + step * (len(events) - 1)), fill=accent
            )
        date_font = _font(FONT_BOLD, 40)
        event_font = _font(FONT_REG, 38)
        for i, ev in enumerate(events):
            cy = start_y + i * step
            draw.ellipse((line_x - 16, cy - 16, line_x + 16, cy + 16), fill=accent)
            draw.text((line_x + 56, cy - 44), ev.date, font=date_font, fill=accent)
            event_lines = _wrap(event_font, ev.event, W - line_x - 480)[:2]
            draw.text((line_x + 380, cy - 44), "\n".join(event_lines), font=event_font, fill=TEXT_MAIN)

    else:  # scene_card
        draw.rectangle((160, 400, 178, 620), fill=accent)
        font, lines = _fit(FONT_BOLD, spec.headline, W - 480, 110, 64, 2)
        y = 410
        for line in lines:
            draw.text((228, y), line, font=font, fill=TEXT_MAIN)
            y += int(font.size * 1.16)
        if spec.subline:
            sub_font, sub_lines = _fit(FONT_REG, spec.subline, W - 480, 46, 32, 2)
            sy = y + 30
            for line in sub_lines:
                draw.text((228, sy), line, font=sub_font, fill=TEXT_DIM)
                sy += int(sub_font.size * 1.3)
        # Ghost scene numeral
        ghost = _font(FONT_BOLD, 420)
        numeral = f"{scene.number:02d}"
        gw = _text_width(ghost, numeral)
        ghost_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ghost_layer).text(
            (W - gw - 90, H - 520), numeral, font=ghost, fill=TEXT_MAIN + (16,)
        )
        img.paste(ghost_layer, (0, 0), ghost_layer)

    _footer(draw, scene.number, len(storyboard.scenes))
    img.save(out_path, "PNG")


def render_all(storyboard: Storyboard, assets_dir: str) -> List[str]:
    os.makedirs(assets_dir, exist_ok=True)
    custom_dir = os.path.join(assets_dir, "custom")
    paths = []
    for scene in storyboard.scenes:
        custom_matches = glob.glob(os.path.join(custom_dir, f"scene_{scene.number:02d}.*"))
        out_path = os.path.join(assets_dir, f"scene_{scene.number:02d}.png")
        render_scene(scene, storyboard, out_path, custom_matches[0] if custom_matches else None)
        paths.append(out_path)
    return paths
