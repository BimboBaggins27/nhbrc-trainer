from PIL import Image, ImageDraw, ImageFont
import os

OUT = r"C:\Users\matte\nhbrc-app\public\icons"
os.makedirs(OUT, exist_ok=True)

GREEN_TOP = (14, 138, 79)
GREEN_BOT = (11, 110, 63)
GOLD = (245, 184, 0)
WHITE = (255, 255, 255)


def gradient(size, top, bot):
    img = Image.new("RGB", (size, size), top)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        d.line([(0, y), (size, y)], fill=(r, g, b))
    return img


def draw_house(d, cx, cy, size, color):
    """Simple house silhouette centred on (cx, cy) within bounding 'size'."""
    half = size / 2
    # Roof (triangle)
    roof = [
        (cx - half, cy - size * 0.05),
        (cx, cy - size * 0.55),
        (cx + half, cy - size * 0.05),
    ]
    d.polygon(roof, fill=color)
    # Body (rectangle)
    body = [
        cx - half * 0.85, cy - size * 0.05,
        cx + half * 0.85, cy + size * 0.45
    ]
    d.rectangle(body, fill=color)


def make_icon(size, maskable=False):
    img = gradient(size, GREEN_TOP, GREEN_BOT)
    d = ImageDraw.Draw(img)

    # Maskable safe zone is inner 80%
    pad = size * 0.10 if maskable else size * 0.04
    inner = size - 2 * pad
    cx, cy = size / 2, size / 2

    # House
    draw_house(d, cx, cy * 0.95, inner * 0.55, WHITE)

    # Gold "check" / arc beneath the house signifying certification
    arc_r = inner * 0.34
    d.arc(
        [cx - arc_r, cy + inner * 0.05, cx + arc_r, cy + inner * 0.55],
        start=200, end=340, fill=GOLD, width=max(int(size * 0.05), 4)
    )

    # NHBRC band at bottom (skip on small icons)
    if size >= 192:
        try:
            font_size = int(size * 0.12)
            try:
                font = ImageFont.truetype("arialbd.ttf", font_size)
            except OSError:
                font = ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()
        text = "NHBRC"
        bbox = d.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        ty = cy + inner * 0.30
        d.text((cx - tw / 2, ty), text, font=font, fill=WHITE)

    return img


for s in [192, 512]:
    make_icon(s).save(os.path.join(OUT, f"icon-{s}.png"), "PNG")

# Maskable: extra padding so platform-applied mask doesn't cut the design
make_icon(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"), "PNG")

# Favicon (32px PNG works as a simple favicon and apple-touch fallback)
make_icon(192).resize((32, 32), Image.LANCZOS).save(os.path.join(OUT, "favicon-32.png"), "PNG")

print("Icons written to:", OUT)
for f in os.listdir(OUT):
    print(" -", f)
