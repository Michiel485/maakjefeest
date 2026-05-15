"""
Remove ALL white/near-white regions from frame PNGs, EXCEPT the inner circle.

Strategy:
  1. Find every connected white region in the image (flood-fill labelling).
  2. The inner circle = the region that contains the exact center pixel of the image.
  3. Make every other white region fully transparent.

This handles:
  - The outer background (large connected area touching edges)
  - Isolated white pockets inside leaves / petals
  - Any anti-aliasing fringe not caught by a simple corner flood-fill
"""

from PIL import Image
import glob, os
from collections import deque

TOLERANCE = 230  # pixels with R,G,B > this are treated as white

def is_near_white(px):
    return px[0] > TOLERANCE and px[1] > TOLERANCE and px[2] > TOLERANCE

def process(path):
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # --- Step 1: label every connected white region ---
    label = [[0] * h for _ in range(w)]
    regions = {}          # label -> list of (x, y)
    current = 1

    for sx in range(w):
        for sy in range(h):
            if label[sx][sy] == 0 and is_near_white(pixels[sx, sy]):
                queue = deque()
                queue.append((sx, sy))
                label[sx][sy] = current
                pts = []
                while queue:
                    x, y = queue.popleft()
                    pts.append((x, y))
                    for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                        if 0 <= nx < w and 0 <= ny < h \
                           and label[nx][ny] == 0 \
                           and is_near_white(pixels[nx, ny]):
                            label[nx][ny] = current
                            queue.append((nx, ny))
                regions[current] = pts
                current += 1

    # --- Step 2: identify the inner circle by its center pixel ---
    cx, cy = w // 2, h // 2
    keep = label[cx][cy]   # label of the region at dead center

    if keep == 0:
        # Center pixel was already transparent (previous run); find closest region
        best_dist = float("inf")
        for lbl, pts in regions.items():
            for x, y in pts:
                d = (x - cx) ** 2 + (y - cy) ** 2
                if d < best_dist:
                    best_dist = d
                    keep = lbl
        print(f"  [warn] center pixel transparent, nearest region {keep} used")

    # --- Step 3: erase everything except the inner circle ---
    erased = 0
    for lbl, pts in regions.items():
        if lbl != keep:
            for x, y in pts:
                pixels[x, y] = (0, 0, 0, 0)
            erased += len(pts)

    img.save(path)
    inner_size = len(regions.get(keep, []))
    print(f"  {os.path.basename(path):30s}  regions={current-1}  kept={keep} ({inner_size}px)  erased={erased}px")

frames_dir = os.path.join(os.path.dirname(__file__), "..", "public", "frames")
files = sorted(glob.glob(os.path.join(frames_dir, "*.png")))

if not files:
    print("No PNG files found in", frames_dir)
else:
    for path in files:
        process(path)

print("\nDone — all frames updated.")
