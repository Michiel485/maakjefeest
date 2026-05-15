"""Run outer-white removal on earthy-diamond.png.png only."""
from PIL import Image
import os
from collections import deque

TOLERANCE = 230

def is_near_white(px):
    return px[0] > TOLERANCE and px[1] > TOLERANCE and px[2] > TOLERANCE

def process(path):
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    label = [[0] * h for _ in range(w)]
    regions = {}
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

    cx, cy = w // 2, h // 2
    keep = label[cx][cy]

    if keep == 0:
        best_dist = float("inf")
        for lbl, pts in regions.items():
            for x, y in pts:
                d = (x - cx) ** 2 + (y - cy) ** 2
                if d < best_dist:
                    best_dist = d
                    keep = lbl

    erased = 0
    for lbl, pts in regions.items():
        if lbl != keep:
            for x, y in pts:
                pixels[x, y] = (0, 0, 0, 0)
            erased += len(pts)

    img.save(path)
    print(f"Done: {os.path.basename(path)} — kept inner region ({len(regions.get(keep,[]))}px), erased {erased}px")

path = os.path.join(os.path.dirname(__file__), "..", "public", "frames", "earthy-diamond.png.png")
process(path)
