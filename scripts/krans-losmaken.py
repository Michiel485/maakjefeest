# Krans van papier losmaken, zonder lichte rand.
# Inkt op wit: gezien = wit*(1-a) + inkt*a. De dekking a volgt uit hoe donker
# een pixel is ten opzichte van de inkt. De kleur van de randpixels komt van
# de inkt ernaast (genormaliseerde vervaging), niet van het papier, en
# verkleinen gebeurt voorvermenigvuldigd. Zo loopt er geen wit de rand in.
import sys, math
import numpy as np
from PIL import Image, ImageFilter
src, uit_web, uit_png, mono = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] == "mono"
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
L = 0.299*im[...,0] + 0.587*im[...,1] + 0.114*im[...,2]
papier = float(np.percentile(L, 60))
d = np.clip(papier - L, 0, 255)
H, W = d.shape
zoek = d.copy(); zoek[:int(H*0.08)] = 0; zoek[int(H*0.92):] = 0; zoek[:, :int(W*0.03)] = 0; zoek[:, int(W*0.97):] = 0
ys, xs = np.where(zoek > 30)
cx, cy = (xs.min()+xs.max())/2, (ys.min()+ys.max())/2
half = max(xs.max()-xs.min(), ys.max()-ys.min())/2 * 1.04
X0, Y0, S = int(round(cx-half)), int(round(cy-half)), int(round(2*half))
def snij(a, vul):
    out = np.full((S, S) + a.shape[2:], vul, np.float32)
    sx0, sy0 = max(0, X0), max(0, Y0); sx1, sy1 = min(W, X0+S), min(H, Y0+S)
    out[sy0-Y0:sy1-Y0, sx0-X0:sx1-X0] = a[sy0:sy1, sx0:sx1]
    return out
im = snij(im, papier); d = snij(d, 0)
# De inkt: hoe donker de echte lijnen zijn
k = float(np.percentile(d[d > 25], 92))
a = np.clip((d - 2.5) / (k - 2.5), 0, 1)
if mono:
    inkt = im[d >= k*0.9].mean(axis=0)
    kleur = np.broadcast_to(inkt, im.shape).copy()
else:
    wit = np.clip(im * (255.0/papier), 0, 255)
    veilig = np.maximum(a, 1e-3)[..., None]
    los = np.clip(255 - (255 - wit)/veilig, 0, 255)
    # Alleen waar de dekking hoog is, is de kleur betrouwbaar; de rest vult
    # de inkt uit de buurt in
    w = (a > 0.8).astype(np.float32)
    def doos(x, r, as_):
        c = np.cumsum(np.pad(x, [(r+1, r) if i == as_ else (0, 0) for i in range(x.ndim)], mode="edge"), axis=as_)
        hi = np.take(c, range(2*r+1, c.shape[as_]), axis=as_); lo = np.take(c, range(0, c.shape[as_]-2*r-1), axis=as_)
        return (hi - lo) / (2*r+1)
    def vervaag(x, r):
        for _ in range(2):
            x = doos(doos(x, r, 0), r, 1)
        return x
    teller = np.dstack([vervaag((los[..., i]*w).astype(np.float32), 3) for i in range(3)])
    noemer = vervaag(w, 3)[..., None]
    gevuld = teller / np.maximum(noemer, 1e-4)
    kleur = np.where((a > 0.8)[..., None], los, np.where(noemer > 1e-3, gevuld, los))
# Iets voller dan de ware dekking, zodat dunne lijnen ook op een foto
# opvallen; de kleur blijft die van de inkt
vol = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
rgba = np.dstack([np.clip(kleur, 0, 255), (a ** vol)*255]).astype(np.uint8)
img = Image.fromarray(rgba, "RGBA")
def verklein(img, n):
    return img.convert("RGBa").resize((n, n), Image.LANCZOS).convert("RGBA")
web = verklein(img, min(S, 1000)); web.save(uit_web, "WEBP", lossless=True, method=6)
verklein(img, 840).save(uit_png, "PNG", optimize=True)
print("S", S, "k", round(k,1), "papier", round(papier,1))
