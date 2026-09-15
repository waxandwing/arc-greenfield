#!/usr/bin/env python3
"""Compose Repair Pass 3 evidence into 00-contact-sheet.png."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/overnight/evidence/repair-pass-3"
OUT = SRC / "00-contact-sheet.png"

PANELS = [
    ("01-day-no-dark-header.png", "Day — no dark header · + Capture"),
    ("02-week-no-banner.png", "Week — no Try Capture banner"),
    ("05-planning-period.png", "Planning period · + Capture"),
]


def font(size: int):
    for name in ("DejaVuSans.ttf", "LiberationSans-Regular.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def load(path: Path, width: int) -> Image.Image:
    im = Image.open(path).convert("RGB")
    if im.width == width:
        return im
    ratio = width / im.width
    return im.resize((width, max(1, round(im.height * ratio))), Image.Resampling.LANCZOS)


def main() -> None:
    margin = 24
    gap = 16
    label_h = 28
    sheet_w = 1500
    col_w = (sheet_w - 3 * margin) // 2
    imgs = [load(SRC / name, col_w) for name, _ in PANELS]
    row_h = max(im.height for im in imgs[:2])
    sheet_h = margin + label_h + row_h + gap + label_h + imgs[2].height + margin
    sheet = Image.new("RGB", (sheet_w, sheet_h), (245, 240, 232))
    draw = ImageDraw.Draw(sheet)
    title = font(13)
    y = margin
    draw.text((margin, y), "ARC Repair Pass 3 — contact sheet", fill=(40, 35, 30), font=title)
    y += label_h

    def paste(img, x, y0, label):
        draw.text((x, y0), label, fill=(40, 35, 30), font=title)
        sheet.paste(img, (x, y0 + label_h))

    paste(imgs[0], margin, y, PANELS[0][1])
    paste(imgs[1], margin + col_w + margin, y, PANELS[1][1])
    y2 = y + label_h + row_h + gap
    wide = load(SRC / PANELS[2][0], sheet_w - 2 * margin)
    paste(wide, margin, y2, PANELS[2][1])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
