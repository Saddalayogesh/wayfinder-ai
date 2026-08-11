#!/usr/bin/env python3
"""Print average warmth/brightness of every bundled travel photo, to pick the
warmest, most 'quiet luxury' hero image. Warmth = avg R - avg B (positive =
warm/orange, negative = cool/blue)."""
from PIL import Image
import glob
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "public", "images")

print(f"{'file':20s} {'size':12s} {'avgRGB':16s} {'warmth':>7s} {'brightness':>10s}")
for f in sorted(glob.glob(os.path.join(SRC, "*.jpg"))):
    im = Image.open(f).convert("RGB")
    px = list(im.resize((40, 27)).getdata())
    n = len(px)
    r = sum(p[0] for p in px) / n
    g = sum(p[1] for p in px) / n
    b = sum(p[2] for p in px) / n
    name = os.path.basename(f)
    print(
        f"{name:20s} {str(im.size):12s} ({r:4.0f},{g:4.0f},{b:4.0f}) "
        f"{r - b:+7.1f} {(r + g + b) / 3:10.0f}"
    )
