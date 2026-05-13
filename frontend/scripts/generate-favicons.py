#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
BRANDING_DIR = PUBLIC_DIR / "branding"
SOURCE_PATH = BRANDING_DIR / "app-icon-source.png"


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def vertical_gradient(size: int, top_rgb: tuple[int, int, int], bottom_rgb: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (size, size))
    pixels = image.load()

    for y in range(size):
        ratio = y / max(size - 1, 1)
        color = tuple(
            int(top_rgb[index] * (1 - ratio) + bottom_rgb[index] * ratio)
            for index in range(3)
        ) + (255,)
        for x in range(size):
            pixels[x, y] = color

    return image


def create_default_source(size: int = 1024) -> Image.Image:
    base = vertical_gradient(size, (6, 63, 119), (2, 36, 72))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)

    glow_draw.ellipse(
        (size * 0.18, size * 0.1, size * 0.82, size * 0.74),
        fill=(255, 214, 90, 60),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.04))
    base.alpha_composite(glow)

    accent = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accent)
    accent_draw.pieslice(
        (-size * 0.22, size * 0.36, size * 1.18, size * 1.46),
        start=200,
        end=340,
        fill=(21, 142, 84, 255),
    )
    base.alpha_composite(accent)

    ring = ImageDraw.Draw(base)
    ring.rounded_rectangle(
        (size * 0.035, size * 0.035, size * 0.965, size * 0.965),
        radius=size * 0.23,
        outline=(255, 255, 255, 48),
        width=max(8, size // 64),
    )

    trophy = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(trophy)
    gold = (247, 196, 63, 255)
    gold_dark = (201, 145, 28, 255)
    white = (255, 255, 255, 255)

    draw.ellipse((size * 0.29, size * 0.15, size * 0.71, size * 0.57), fill=gold)
    draw.pieslice((size * 0.17, size * 0.18, size * 0.45, size * 0.54), 240, 80, fill=gold)
    draw.pieslice((size * 0.55, size * 0.18, size * 0.83, size * 0.54), 100, 300, fill=gold)
    draw.rounded_rectangle((size * 0.44, size * 0.49, size * 0.56, size * 0.72), radius=size * 0.03, fill=gold)
    draw.rounded_rectangle((size * 0.35, size * 0.69, size * 0.65, size * 0.79), radius=size * 0.03, fill=gold_dark)
    draw.rounded_rectangle((size * 0.28, size * 0.77, size * 0.72, size * 0.86), radius=size * 0.035, fill=gold)
    draw.ellipse((size * 0.42, size * 0.24, size * 0.58, size * 0.4), fill=white)
    draw.polygon(
        [
            (size * 0.5, size * 0.23),
            (size * 0.535, size * 0.33),
            (size * 0.64, size * 0.33),
            (size * 0.555, size * 0.39),
            (size * 0.59, size * 0.49),
            (size * 0.5, size * 0.43),
            (size * 0.41, size * 0.49),
            (size * 0.445, size * 0.39),
            (size * 0.36, size * 0.33),
            (size * 0.465, size * 0.33),
        ],
        fill=(20, 106, 73, 255),
    )

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow.alpha_composite(
        trophy.filter(ImageFilter.GaussianBlur(radius=size * 0.018)),
        (0, int(size * 0.012)),
    )
    base.alpha_composite(shadow)
    base.alpha_composite(trophy)

    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    image.paste(base, mask=rounded_mask(size, int(size * 0.22)))
    return image


def ensure_source() -> Path:
    BRANDING_DIR.mkdir(parents=True, exist_ok=True)
    if SOURCE_PATH.exists():
        return SOURCE_PATH

    source_image = create_default_source()
    source_image.save(SOURCE_PATH)
    return SOURCE_PATH


def export_png(source: Image.Image, size: int, destination: Path) -> None:
    icon = source.resize((size, size), Image.LANCZOS)
    icon.save(destination, format="PNG")


def export_ico(source: Image.Image, destination: Path) -> None:
    source.save(
        destination,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


def main() -> None:
    source_path = ensure_source()
    source = Image.open(source_path).convert("RGBA")
    if source.width != source.height:
        raise ValueError(f"Source icon must be square: {source_path}")

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    export_png(source, 16, PUBLIC_DIR / "favicon-16x16.png")
    export_png(source, 32, PUBLIC_DIR / "favicon-32x32.png")
    export_png(source, 180, PUBLIC_DIR / "apple-touch-icon.png")
    export_png(source, 192, PUBLIC_DIR / "android-chrome-192x192.png")
    export_png(source, 512, PUBLIC_DIR / "android-chrome-512x512.png")
    export_ico(source, PUBLIC_DIR / "favicon.ico")

    print(f"Generated favicon assets from {source_path}")


if __name__ == "__main__":
    main()
