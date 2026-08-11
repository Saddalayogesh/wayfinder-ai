#!/usr/bin/env python3
"""Generate responsive width variants for the bundled static travel photos.

Produces `public/images/resp/<stem>-<width>.jpg` at 480/640/960/1280/1600w
(capped at each source's native width — never upscales). The frontend builds
`srcset` from these via `responsiveSrcSet()` in src/utils/destinationImage.ts.

Usage (from the repo root or anywhere):
    python frontend/scripts/generate-image-variants.py

Requires Pillow:  pip install pillow
"""
import os
from pathlib import Path

from PIL import Image

SOURCE_DIR = Path(__file__).resolve().parent.parent / "public" / "images"
OUT_DIR = SOURCE_DIR / "resp"
TARGET_WIDTHS = (480, 640, 960, 1280, 1600)
QUALITY = 82


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    generated = 0
    for source in sorted(SOURCE_DIR.glob("*.jpg")):
        with Image.open(source) as img:
            width, height = img.size
            native = width
            for target in TARGET_WIDTHS:
                if target >= native:
                    continue
                ratio = target / native
                out = OUT_DIR / f"{source.stem}-{target}.jpg"
                resized = img.resize(
                    (target, max(1, round(height * ratio))),
                    Image.Resampling.LANCZOS,
                )
                resized.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
                generated += 1
                print(f"  {out.name} ({target}w)")
    print(f"Done — {generated} variants in {OUT_DIR.relative_to(SOURCE_DIR.parent.parent.parent)}")


if __name__ == "__main__":
    main()
