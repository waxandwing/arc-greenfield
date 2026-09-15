#!/usr/bin/env python3
"""Generate desk-composition contact sheets for Icarus promotion pass."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/overnight/evidence/icarus-promotion-pass"
FIGMA = ROOT / "docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png"

ASSETS = {
    "wood_icarus": ROOT / "public/assets/arc/icarus/texture-wood.png",
    "wood_light_desk": ROOT / "public/assets/desk/light-wood-desk.png",
    "cream_icarus": ROOT / "public/assets/arc/icarus/texture-cream-paper.png",
    "cream_planner": ROOT / "public/assets/arc/planner-paper.png",
    "cream_arctable": ROOT / "public/assets/arctable/paper-cream.png",
}

MOCK_W, MOCK_H = 836, 520  # ~half of Figma comp width for side-by-side panels
PLANNER_RECT = (72, 118, 764, 462)  # cream/green planner zone in mock
LABEL_H = 36


def load_rgb(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGB")
    return im


def tile_cover(src: Image.Image, w: int, h: int) -> Image.Image:
    """Scale-tile source to cover w×h (center crop)."""
    sw, sh = src.size
    scale = max(w / sw, h / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    scaled = src.resize((nw, nh), Image.Resampling.LANCZOS)
    x0 = (nw - w) // 2
    y0 = (nh - h) // 2
    return scaled.crop((x0, y0, x0 + w, y0 + h))


def grain_contrast(im: Image.Image) -> float:
    gray = im.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    return ImageStat.Stat(edges).stddev[0]


def sample_stats(im: Image.Image, box: tuple[int, int, int, int] | None = None) -> dict:
    region = im.crop(box) if box else im
    stat = ImageStat.Stat(region)
    r, g, b = stat.mean
    return {
        "mean_rgb": (round(r, 1), round(g, 1), round(b, 1)),
        "stddev_l": round(ImageStat.Stat(region.convert("L")).stddev[0], 2),
        "grain_contrast": round(grain_contrast(region), 2),
    }


def draw_planner_stack(base: Image.Image, paper: Image.Image) -> Image.Image:
    """Wood tabletop + planner-like rounded rect with paper texture."""
    out = base.copy()
    x0, y0, x1, y1 = PLANNER_RECT
    pw, ph = x1 - x0, y1 - y0
    paper_fill = tile_cover(paper, pw, ph)
    mask = Image.new("L", (pw, ph), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, pw - 1, ph - 1), radius=18, fill=255)
    planner = Image.new("RGB", (pw, ph), (0x5a, 0x7a, 0x62))
    planner.paste(paper_fill, (0, 0), mask)
    pd = ImageDraw.Draw(planner)
    pd.rectangle((0, 0, pw, 52), fill=(0x4a, 0x6a, 0x55))
    pd.text((24, 14), "Teaching week", fill=(0xf5, 0xf0, 0xe4))
    bordered = Image.new("RGB", (pw + 8, ph + 8), (0x3d, 0x5c, 0x48))
    bordered.paste(planner, (4, 4), mask)
    out.paste(bordered, (x0 - 4, y0 - 4))
    return out


def label_bar(text: str, width: int) -> Image.Image:
    bar = Image.new("RGB", (width, LABEL_H), (0x1a, 0x1a, 0x1a))
    d = ImageDraw.Draw(bar)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
    d.text((8, 10), text, fill=(0xf0, 0xf0, 0xf0), font=font)
    return bar


def stack_panel(label: str, panel: Image.Image) -> Image.Image:
    bar = label_bar(label, panel.width)
    out = Image.new("RGB", (panel.width, bar.height + panel.height))
    out.paste(bar, (0, 0))
    out.paste(panel, (0, bar.height))
    return out


def hstack_panels(panels: list[Image.Image], gap: int = 12) -> Image.Image:
    total_w = sum(p.width for p in panels) + gap * (len(panels) - 1)
    h = max(p.height for p in panels)
    canvas = Image.new("RGB", (total_w, h), (0x2a, 0x2a, 0x2a))
    x = 0
    for p in panels:
        canvas.paste(p, (x, 0))
        x += p.width + gap
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    wood_i = load_rgb(ASSETS["wood_icarus"])
    wood_l = load_rgb(ASSETS["wood_light_desk"])
    cream_i = load_rgb(ASSETS["cream_icarus"])
    cream_p = load_rgb(ASSETS["cream_planner"])

    # light-wood-desk is a composed onboarding frame (folder + pattern), not a viewport tile.
    wood_l_crop = wood_l.crop((48, 96, 980, 540)).convert("RGB")

    # --- Wood tabletop only (full mock, fair texture compare) ---
    wood_panels = []
    for name, src in [
        ("Viewport candidate: icarus/texture-wood.png (seamless tile)", wood_i),
        (
            "Schedule-setup frame: light-wood-desk.png (folder wood crop only)",
            wood_l_crop,
        ),
    ]:
        tabletop = tile_cover(src, MOCK_W, MOCK_H)
        wood_panels.append(stack_panel(name, tabletop))
    wood_sheet = hstack_panels(wood_panels)
    wood_sheet.save(OUT / "01-wood-tabletop-texture-compare.png")

    fig_wood_crop = None
    if FIGMA.exists():
        fig = Image.open(FIGMA).convert("RGB")
        fig_wood_crop = fig.crop((48, 120, 520, 520))
        fig_wood_crop.save(OUT / "01b-figma-wood-folder-crop-reference.png")
        wood_panels3 = [
            stack_panel("Figma 37:11052 folder wood (reference crop)", tile_cover(fig_wood_crop, MOCK_W, MOCK_H)),
            stack_panel("icarus/texture-wood.png (tiled)", tile_cover(wood_i, MOCK_W, MOCK_H)),
            stack_panel(
                "light-wood-desk folder wood (crop tiled)",
                tile_cover(wood_l_crop, MOCK_W, MOCK_H),
            ),
        ]
        hstack_panels(wood_panels3).save(OUT / "01c-wood-three-way-figma-icarus-lightwood-crop.png")

    # --- Wood + planner rectangle (cream = production planner paper) ---
    desk_prod = draw_planner_stack(tile_cover(wood_i, MOCK_W, MOCK_H), cream_p)
    desk_alt = draw_planner_stack(tile_cover(wood_l_crop, MOCK_W, MOCK_H), cream_p)
    comp_wood = hstack_panels(
        [
            stack_panel("Desk mock: icarus wood + planner-paper planner", desk_prod),
            stack_panel("Desk mock: light-wood-desk + planner-paper planner", desk_alt),
        ]
    )
    comp_wood.save(OUT / "02-wood-desk-composition-mock-planner-paper.png")

    # --- Cream on fixed icarus wood ---
    cream_panels = []
    for name, paper in [
        ("Production: arc/planner-paper (+ arctable/paper-cream identical)", cream_p),
        ("Icarus: icarus/texture-cream-paper.png", cream_i),
    ]:
        mock = draw_planner_stack(tile_cover(wood_i, MOCK_W, MOCK_H), paper)
        cream_panels.append(stack_panel(name, mock))
    cream_sheet = hstack_panels(cream_panels)
    cream_sheet.save(OUT / "03-cream-planner-rectangle-side-by-side.png")

    # --- Figma reference strip ---
    if FIGMA.exists():
        fig = Image.open(FIGMA).convert("RGB")
        fig_thumb = fig.resize((int(MOCK_W * 2 + 12), int(MOCK_H * 0.85)), Image.Resampling.LANCZOS)
        fig_thumb.save(OUT / "00-figma-reference-37-11052-thumb.png")
        # sample wood from figma (left/bottom wood visible regions)
        fig_stats = {
            "full_comp": sample_stats(fig),
            "wood_band_bottom": sample_stats(fig, (0, 700, 400, 940)),
            "wood_folder_body": sample_stats(fig, (40, 120, 520, 520)),
        }
    else:
        fig_stats = {}

    metrics = {
        "wood_icarus": sample_stats(tile_cover(wood_i, MOCK_W, MOCK_H)),
        "wood_light_desk_crop": sample_stats(tile_cover(wood_l_crop, MOCK_W, MOCK_H)),
        "wood_figma_folder_crop": sample_stats(tile_cover(fig_wood_crop, MOCK_W, MOCK_H))
        if fig_wood_crop is not None
        else {},
        "cream_icarus": sample_stats(tile_cover(cream_i, 400, 300)),
        "cream_planner": sample_stats(tile_cover(cream_p, 400, 300)),
        "figma_reference": fig_stats,
        "file_md5": {
            "icarus_cream_vs_arc_texture_cream": _md5(ASSETS["cream_icarus"])
            == _md5(ROOT / "public/assets/arc/texture-cream-paper.png"),
            "planner_vs_arctable_paper_cream": _md5(ASSETS["cream_planner"])
            == _md5(ASSETS["cream_arctable"]),
        },
    }

    import json

    (OUT / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))


def _md5(path: Path) -> str:
    import hashlib

    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


if __name__ == "__main__":
    main()
