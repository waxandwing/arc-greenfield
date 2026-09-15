#!/usr/bin/env python3
"""One-off contact sheet for icarus desk sync evidence."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
ICARUS = ROOT / "public/assets/arc/icarus"
OUT = Path(__file__).resolve().parent / "icarus-desk-sync-contact-sheet.png"

ASSETS = [
    "texture-wood.png",
    "texture-cream-paper.png",
    "pattern-arc-geometric.png",
    "texture-mustard-paper.png",
    "texture-blue-paper.png",
    "calendar-open-planner.png",
    "arc-mark-stacked.png",
]

THUMB_W = 320
LABEL_H = 52
PAD = 16
COLS = 3


def load_font(size: int):
    for name in ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    rows = (len(ASSETS) + COLS - 1) // COLS
    cell_w = THUMB_W + PAD * 2
    cell_h = THUMB_W + LABEL_H + PAD * 2
    sheet = Image.new("RGB", (COLS * cell_w + PAD, rows * cell_h + PAD), (245, 242, 235))
    draw = ImageDraw.Draw(sheet)
    font = load_font(13)
    font_sm = load_font(11)

    for i, name in enumerate(ASSETS):
        col, row = i % COLS, i // COLS
        x0 = PAD + col * cell_w
        y0 = PAD + row * cell_h
        path = ICARUS / name
        img = Image.open(path).convert("RGBA")
        w, h = img.size
        scale = min(THUMB_W / w, THUMB_W / h, 1.0)
        tw, th = int(w * scale), int(h * scale)
        thumb = img.resize((tw, th), Image.Resampling.LANCZOS)
        tx = x0 + PAD + (THUMB_W - tw) // 2
        ty = y0 + PAD + (THUMB_W - th) // 2
        sheet.paste(thumb, (tx, ty), thumb)
        draw.rectangle(
            [x0 + PAD - 1, y0 + PAD - 1, x0 + PAD + THUMB_W, y0 + PAD + THUMB_W],
            outline=(180, 170, 155),
            width=1,
        )
        label_y = y0 + PAD + THUMB_W + 6
        draw.text((x0 + PAD, label_y), name, fill=(30, 50, 40), font=font)
        size_kb = path.stat().st_size // 1024
        draw.text(
            (x0 + PAD, label_y + 18),
            f"{w}×{h} · {size_kb} KB",
            fill=(90, 90, 85),
            font=font_sm,
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
