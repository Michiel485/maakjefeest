"""
Remove gold curl decorations from earthy-diamond.png.png.

Method: palette comparison with earthy-circle.png.png.
Foreign pixels (not in circle palette) that are warm-toned AND in the
spatial zones where the red circles were drawn are removed.
Clusters are grown with a loose colour tolerance so curls are fully captured.
"""
from PIL import Image
import os
from collections import deque

base = os.path.join(os.path.dirname(__file__), "..", "public", "frames")
diamond_path = os.path.join(base, "earthy-diamond.png.png")

diamond = Image.open(diamond_path).convert("RGBA")
circle  = Image.open(os.path.join(base, "earthy-circle.png.png")).convert("RGBA")
dp = diamond.load()
cp = circle.load()
w, h = diamond.size

# ── Build earthy-circle palette (8-level buckets = tolerance ~8 per channel) ──
circle_pal = set()
for x in range(0, w, 2):
    for y in range(0, h, 2):
        r, g, b, a = cp[x, y]
        if a > 50:
            circle_pal.add((r >> 3, g >> 3, b >> 3))

# ── Spatial zones covering the 5 red circles (in 2048×2048 coordinates) ──
# Left side (2 circles), right upper, right middle, bottom-right
ZONES = [
    (0,    1000, 800,  1700),   # left lower (2 circles)
    (1350,  450, 1900, 1000),   # right upper
    (1450,  950, 2048, 1500),   # right middle
    (1350, 1250, 2048, 1750),   # bottom right
]

def in_zone(x, y):
    for x0, y0, x1, y1 in ZONES:
        if x0 <= x < x1 and y0 <= y < y1:
            return True
    return False

def is_warm_foreign(x, y):
    r, g, b, a = dp[x, y]
    if a < 40:
        return False
    if (r >> 3, g >> 3, b >> 3) in circle_pal:
        return False
    # warm gold tone: clearly not in earthy palette
    return r - b > 55 and g > 100 and r > 140

# ── Seed pixels: foreign warm pixels inside zones ──
seed_mask = [[False]*h for _ in range(w)]
for x in range(w):
    for y in range(h):
        if in_zone(x, y) and is_warm_foreign(x, y):
            seed_mask[x][y] = True

# ── Flood fill with loose colour tolerance to capture full curl shapes ──
# Tolerance: each channel within ±20 of the seed pixel's colour
TOLERANCE = 20

def similar(px, ref):
    r, g, b, a = px
    if a < 40:
        return False
    return (abs(r - ref[0]) <= TOLERANCE and
            abs(g - ref[1]) <= TOLERANCE and
            abs(b - ref[2]) <= TOLERANCE)

visited = [[False]*h for _ in range(w)]
total_px = 0
total_clusters = 0

for sx in range(w):
    for sy in range(h):
        if not seed_mask[sx][sy] or visited[sx][sy]:
            continue
        ref_color = dp[sx, sy][:3]
        q = deque([(sx, sy)])
        visited[sx][sy] = True
        pts = []
        while q:
            x, y = q.popleft()
            pts.append((x, y))
            for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                    if similar(dp[nx, ny], ref_color):
                        visited[nx][ny] = True
                        q.append((nx, ny))

        for x, y in pts:
            dp[x, y] = (0, 0, 0, 0)
        total_px += len(pts)
        total_clusters += 1

diamond.save(diamond_path)
print(f"Done. Removed {total_clusters} clusters ({total_px} pixels) from earthy-diamond.png.png")
