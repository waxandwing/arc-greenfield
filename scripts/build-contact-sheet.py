#!/usr/bin/env python3
"""Compose Day / Week / Planning PNGs into one labeled contact sheet."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = ROOT / "docs/overnight/evidence/current"
OUT_NAME = "CONTACT-SHEET.png"

PANELS = [
    ("01-day.png", "Day — My Teaching Day · Sep 15"),
    ("02-week.png", "Week — This Week"),
    ("03-planning.png", "Planning — Period 5 · Now / Needs attention / Next planned"),
]


def load_scaled(path: Path, target_width: int) -> Image.Image:
    im = Image.open(path).convert("RGB")
    if im.width == target_width:
        return im
    ratio = target_width / im.width
    return im.resize((target_width, max(1, round(im.height * ratio))), Image.Resampling.LANCZOS)


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("DejaVuSans.ttf", "LiberationSans-Regular.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def build_contact_sheet(source_dir: Path, out_path: Path, meta: str = "") -> None:
    margin = 32
    gap = 20
    label_h = 32
    sheet_w = 1600
    col_w = (sheet_w - 3 * margin) // 2

    day = load_scaled(source_dir / PANELS[0][0], col_w)
    week = load_scaled(source_dir / PANELS[1][0], col_w)
    top_h = max(day.height, week.height)
    planning = load_scaled(source_dir / PANELS[2][0], sheet_w - 2 * margin)

    meta_h = 28 if meta else 0
    sheet_h = margin + meta_h + label_h + top_h + gap + label_h + planning.height + margin

    sheet = Image.new("RGB", (sheet_w, sheet_h), (245, 240, 232))
    draw = ImageDraw.Draw(sheet)
    title_font = font(14)
    meta_font = font(11)

    y = margin
    if meta:
        draw.text((margin, y), meta, fill=(80, 70, 60), font=meta_font)
        y += meta_h

    def blit_with_label(img: Image.Image, x: int, y0: int, label: str) -> None:
        draw.text((x, y0), label, fill=(40, 35, 30), font=title_font)
        sheet.paste(img, (x, y0 + label_h))

    row_y = y
    blit_with_label(day, margin, row_y, PANELS[0][1])
    blit_with_label(week, margin + col_w + margin, row_y, PANELS[1][1])

    bottom_y = row_y + label_h + top_h + gap
    blit_with_label(planning, margin, bottom_y, PANELS[2][1])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, optimize=True)
    print(out_path)


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DIR
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else src / OUT_NAME
    head = sys.argv[3] if len(sys.argv) > 3 else "Arc current views · cursor/arc-production-integration"
    build_contact_sheet(src, out, head)
