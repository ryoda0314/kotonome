"""The app's icons from the picture the maker chose (虹色の雫と芽生え: rain falling on a sprout, made with ChatGPT in the
sisters' style): its cream card cut out of the white ground (transparent around it), then every size the sisters also
have. Needs Pillow and numpy.
Usage: python design/make-icons.py design/icon-source.png .

The card sits on an off-white ground with a soft grey shadow round it, and ground, shadow and card are all so near
white that neither lightness nor hue tells them apart everywhere (the ground is a touch green, the card's top as light
as the ground). The card's edge can: the shadow is darkest right against it, and the card begins where it is bright
again. So the card is measured, not traced: its four sides past that line where rows and columns clear of the drawing
cross it, its corners' radius along their diagonals, and it is cut as a rounded square a few pixels inside, drawn
smooth at four times the size."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

src, root = Path(sys.argv[1]), Path(sys.argv[2])
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int32)
h, w = a.shape[:2]
luma = a.mean(axis=2)
zone = int(min(h, w) * 0.2)
# The plain card, left of the drops and above the leaves; a pixel this bright, past the shadow, is the card.
card = float(np.median(luma[int(h * 0.3) : int(h * 0.45), int(w * 0.15) : int(w * 0.3)]))
bright = card - 6


def edge(line: np.ndarray, start: int, end: int, step: int) -> int:
    """From the shadow's darkest point between start and end, the first pixel of the card going `step`."""
    i = start + int(np.argmin(line[start:end]))
    while line[i] < bright:
        i += step
    return i


# Rows and columns clear of the drawing: the middle column runs into the drops and the stem, rows below the middle into
# the outer leaves, which reach almost to the sides.
rows = [int(h * f) for f in (0.25, 0.3, 0.35, 0.4, 0.45)]
columns = [int(w * f) for f in (0.3, 0.35, 0.4, 0.6, 0.65, 0.7)]
left = int(np.median([edge(luma[y], 0, zone, 1) for y in rows]))
right = int(np.median([edge(luma[y], w - zone, w, -1) for y in rows]))
top = int(np.median([edge(luma[:, x], 0, zone, 1) for x in columns]))
bottom = int(np.median([edge(luma[:, x], h - zone, h, -1) for x in columns]))

# Each corner along its diagonal: the card's edge there lies r(1 - 1/√2) in from the corner of its sides. Not far enough
# in to reach the leaves.
reach = min(right - left, bottom - top) // 8
radii = []
for x0, y0, dx, dy in ((left, top, 1, 1), (right, top, -1, 1), (left, bottom, 1, -1), (right, bottom, -1, -1)):
    diagonal = np.array([luma[y0 + dy * t, x0 + dx * t] for t in range(reach)])
    radii.append(edge(diagonal, 0, reach, 1) / (1 - 2**-0.5))
radius = float(np.median(radii))
INSET = 3
box = (left + INSET, top + INSET, right + 1 - INSET, bottom + 1 - INSET)
print("card", (left, top, right, bottom), "radius", round(radius), "corners", [round(r) for r in radii])

# The cut, drawn at four times the size so its edge is smooth.
k = 4
big = Image.new("L", (w * k, h * k), 0)
ImageDraw.Draw(big).rounded_rectangle([v * k for v in box[:2]] + [v * k - 1 for v in box[2:]], radius=(radius - INSET) * k, fill=255)
mask = np.asarray(big.resize((w, h), Image.LANCZOS))
l, t, r, b = box
card_rgb = a[t:b, l:r].astype(np.uint8)
card_mask = mask[t:b, l:r]

# The card's own colour along each row (it is a touch lighter at the top), a little inside its sides: what fills the
# corners and the ground of the opaque icons, so they leave no seam.
inside = card_mask > 250
fill = np.full((b - t, 3), np.nan)
for y in range(b - t):
    xs = np.flatnonzero(inside[y])
    if len(xs) > 80:
        band = np.concatenate([card_rgb[y, xs[0] + 4 : xs[0] + 40], card_rgb[y, xs[-1] - 39 : xs[-1] - 3]])
        fill[y] = np.median(band, axis=0)
valid = ~np.isnan(fill[:, 0])
for c in range(3):
    fill[:, c] = np.interp(np.arange(len(fill)), np.flatnonzero(valid), fill[valid, c])
# Its top edge has a thin white highlight: the fill goes on in the cream just below it (and likewise at the bottom), or
# the margin above the card in the maskable icon would come out white.
fill[:12], fill[-12:] = fill[12], fill[-13]
print("fill top", fill[0].round(1), "middle", fill[len(fill) // 2].round(1), "bottom", fill[-1].round(1))

cut = Image.fromarray(np.dstack([card_rgb, card_mask]), "RGBA")
alpha = card_mask[:, :, None] / 255
full = Image.fromarray((card_rgb * alpha + fill[:, None, :] * (1 - alpha)).round().astype(np.uint8), "RGB")

# The card is a few pixels off square (generated): made square, too little to see.
side = max(cut.size)
cut = cut.resize((side, side), Image.LANCZOS)
full = full.resize((side, side), Image.LANCZOS)


def sized(n: int) -> Image.Image:
    return cut.resize((n, n), Image.LANCZOS)


def on_fill(n: int, scale: float) -> Image.Image:
    """The card filled out to a full square, drawn at `scale` of the square on its own colour, row by row."""
    m = round(n * scale)
    margin = (n - m) // 2
    at = np.clip((np.arange(n) - margin) / max(m - 1, 1), 0, 1) * (len(fill) - 1)
    ground = np.stack([np.interp(at, np.arange(len(fill)), fill[:, c]) for c in range(3)], axis=1)
    out = Image.fromarray(np.repeat(ground[:, None, :], n, axis=1).round().astype(np.uint8), "RGB")
    out.paste(full.resize((m, m), Image.LANCZOS), (margin, margin))
    return out


icons = root / "public" / "icons"
icons.mkdir(parents=True, exist_ok=True)
sized(512).save(icons / "icon-512.png", optimize=True)
sized(192).save(icons / "icon-192.png", optimize=True)
# Maskable: Android may cut it to a circle of 80%; the outer leaves' tips reach 0.45 of the side from the middle, so 80%
# keeps them inside with room (0.36 of the 0.4).
on_fill(512, 0.8).save(icons / "maskable-512.png", optimize=True)
app = root / "src" / "app"
sized(512).save(app / "icon.png", optimize=True)
# iOS rounds the corners itself: the card full size, its corners filled with its own cream.
on_fill(180, 1.0).save(app / "apple-icon.png", optimize=True)
sized(256).save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote icons")
