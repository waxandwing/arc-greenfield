#!/usr/bin/env python3
"""Resize ref+preview to common size, compute diff % and SSIM, write overlay artifacts."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageDraw, ImageFont


def ssim_gray(a: Image.Image, b: Image.Image) -> float:
    """Simple SSIM on luminance (windowless global approximation)."""
    import math

    a = a.convert("L")
    b = b.convert("L")
    if a.size != b.size:
        b = b.resize(a.size, Image.Resampling.LANCZOS)
    pa = list(a.getdata())
    pb = list(b.getdata())
    n = len(pa)
    mu_a = sum(pa) / n
    mu_b = sum(pb) / n
    var_a = sum((x - mu_a) ** 2 for x in pa) / n
    var_b = sum((y - mu_b) ** 2 for y in pb) / n
    cov = sum((pa[i] - mu_a) * (pb[i] - mu_b) for i in range(n)) / n
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    num = (2 * mu_a * mu_b + c1) * (2 * cov + c2)
    den = (mu_a**2 + mu_b**2 + c1) * (var_a + var_b + c2)
    return round(num / den if den else 0.0, 4)


def main() -> None:
    preview_path, ref_path, out_prefix, w_s, h_s = sys.argv[1:6]
    w, h = int(w_s), int(h_s)
    threshold = 24

    preview = Image.open(preview_path).convert("RGB")
    ref = Image.open(ref_path).convert("RGB")
    preview_r = preview.resize((w, h), Image.Resampling.LANCZOS)
    ref_r = ref.resize((w, h), Image.Resampling.LANCZOS)

    diff = ImageChops.difference(preview_r, ref_r)
    diff_pixels = list(diff.getdata())
    total = len(diff_pixels) * 3
    over = sum(1 for px in diff_pixels for c in px if c >= threshold)
    diff_pct = round(100 * over / total, 2)

    # Heatmap: amplify diff for visibility
    heat = diff.convert("L")
    heat = ImageEnhance.Contrast(heat).enhance(4.0)
    heat = heat.convert("RGB")

    overlay = Image.blend(ref_r, preview_r, alpha=0.5)
    side = Image.new("RGB", (w * 2, h))
    side.paste(ref_r, (0, 0))
    side.paste(preview_r, (w, 0))
    draw = ImageDraw.Draw(side)
    draw.text((8, 8), "reference", fill=(255, 255, 255))
    draw.text((w + 8, 8), "preview", fill=(255, 255, 255))

    prefix = Path(out_prefix)
    overlay.save(f"{prefix}-overlay.png")
    heat.save(f"{prefix}-diff-heatmap.png")
    side.save(f"{prefix}-side-by-side.png")

    ssim = ssim_gray(preview_r, ref_r)
    print(
        json.dumps(
            {
                "diffPct": diff_pct,
                "diffThreshold": threshold,
                "ssim": ssim,
                "overlay": f"{prefix}-overlay.png",
            }
        )
    )


if __name__ == "__main__":
    main()
