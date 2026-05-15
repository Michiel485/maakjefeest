"""
Sample the approximate locations of the gold curl decorations in earthy-diamond.
The screenshot is ~629x634 showing a 2048x2048 image.
Scale factor: ~3.26
Red circle positions estimated from screenshot.
"""
from PIL import Image
import os

path = os.path.join(os.path.dirname(__file__), "..", "public", "frames", "earthy-diamond.png.png")
img = Image.open(path).convert("RGBA")
pixels = img.load()
w, h = img.size
print(f"Image: {w}x{h}")

scale = w / 629  # approx display scale

# Estimated red circle centers in screenshot pixels (x, y)
screen_centers = [
    ("left-curl-1",   105, 400),
    ("left-curl-2",   130, 440),
    ("right-curl-1",  510, 230),
    ("right-curl-2",  530, 350),
    ("bottom-right",  510, 440),
]

for name, sx, sy in screen_centers:
    ax = int(sx * scale)
    ay = int(sy * scale)
    print(f"\n--- {name} @ actual approx ({ax},{ay}) ---")
    for dx in range(-60, 61, 6):
        for dy in range(-60, 61, 6):
            x, y = ax + dx, ay + dy
            if 0 <= x < w and 0 <= y < h:
                r, g, b, a = pixels[x, y]
                # Show warm/golden pixels only
                if a > 80 and r > 140 and r - b > 55 and g > 100 and not (r>220 and g>200 and b>180):
                    print(f"  ({x},{y})  R={r} G={g} B={b} A={a}  R-B={r-b}")
