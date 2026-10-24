"""The app's icons from the picture the maker chose (for now: 雨に育つパステルの芽, the sprout in the rain, from
ことのあめ's folder; replace design/icon-source.png and run again). The picture has a transparent ground: the sprout is
cut to what is drawn, set on a paper card (the app's paper, #fcfbf8, a hairline round it) and written in every size the
sisters have. Needs Pillow and numpy.
Usage: python design/make-icons.py design/icon-source.png ."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

src, root = Path(sys.argv[1]), Path(sys.argv[2])
art = Image.open(src).convert("RGBA")
alpha = np.asarray(art)[:, :, 3]
ys, xs = np.where(alpha > 8)
art = art.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
print("drawn", art.size)

PAPER = (252, 251, 248, 255)
LINE = (228, 231, 236, 255)
S = 1024


def card(rounded: bool, scale: float) -> Image.Image:
    """The sprout at `scale` of the square's height on the paper; rounded corners (transparent) or a full square."""
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0) if rounded else PAPER)
    if rounded:
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((8, 8, S - 9, S - 9), radius=228, fill=PAPER, outline=LINE, width=6)
    h = round(S * scale)
    w = round(art.width * h / art.height)
    a = art.resize((w, h), Image.LANCZOS)
    im.alpha_composite(a, ((S - w) // 2, (S - h) // 2 + round(S * 0.01)))
    return im


rounded = card(True, 0.74)
square = card(False, 0.62)  # maskable: the sprout inside the safe circle
(root / "public" / "icons").mkdir(parents=True, exist_ok=True)
for n in (192, 512):
    rounded.resize((n, n), Image.LANCZOS).save(root / "public" / "icons" / f"icon-{n}.png")
square.resize((512, 512), Image.LANCZOS).save(root / "public" / "icons" / "maskable-512.png")
rounded.resize((512, 512), Image.LANCZOS).save(root / "src" / "app" / "icon.png")
card(False, 0.7).convert("RGB").resize((180, 180), Image.LANCZOS).save(root / "src" / "app" / "apple-icon.png")
rounded.resize((48, 48), Image.LANCZOS).save(root / "src" / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("written")
