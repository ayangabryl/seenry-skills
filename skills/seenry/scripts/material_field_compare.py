#!/usr/bin/env python3
"""Compare where a sampled color family appears in equal-size reference/output images.

This is a diagnostic for a dominant material, not a visual-fidelity score.
"""

import argparse
import colorsys
import json
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageFilter
except ImportError as error:
    raise SystemExit("Pillow is required: python3 -m pip install Pillow") from error


def color_hue(value):
    if len(value) != 7 or not value.startswith("#"):
        raise ValueError("--sample must be a #RRGGBB color")
    try:
        red, green, blue = (int(value[index:index + 2], 16) / 255 for index in (1, 3, 5))
    except ValueError as error:
        raise ValueError("--sample must be a #RRGGBB color") from error
    return colorsys.rgb_to_hsv(red, green, blue)[0] * 255


def mask_for(image, hue, tolerance, minimum_saturation, minimum_value):
    h, s, v = image.convert("HSV").split()
    hue_limit = tolerance / 360 * 255
    hue_mask = h.point(lambda value: 255 if min(abs(value - hue), 255 - abs(value - hue)) <= hue_limit else 0)
    saturation_mask = s.point(lambda value: 255 if value >= minimum_saturation * 255 else 0)
    value_mask = v.point(lambda value: 255 if value >= minimum_value * 255 else 0)
    return ImageChops.multiply(ImageChops.multiply(hue_mask, saturation_mask), value_mask)


def grid_counts(mask, columns, rows):
    width, height = mask.size
    result = []
    for row in range(rows):
        cells = []
        for column in range(columns):
            left, right = column * width // columns, (column + 1) * width // columns
            top, bottom = row * height // rows, (row + 1) * height // rows
            count = mask.crop((left, top, right, bottom)).histogram()[255]
            cells.append({"pixels": count, "coverage": round(count / ((right - left) * (bottom - top)), 5)})
        result.append(cells)
    return result


def compare(source, output, sample, hue_tolerance=18, minimum_saturation=0.08,
            minimum_value=0.25, columns=12, rows=8, region=None, mask_dir=None,
            density_radius=None):
    source_image = Image.open(source).convert("RGB")
    output_image = Image.open(output).convert("RGB")
    if source_image.size != output_image.size:
        raise ValueError(f"Images need equal physical dimensions: {source_image.size} != {output_image.size}")
    if region:
        left, top, width, height = region
        if width <= 0 or height <= 0 or left < 0 or top < 0 or left + width > source_image.width or top + height > source_image.height:
            raise ValueError("--region must be a nonempty rectangle inside both images")
        box = (left, top, left + width, top + height)
        source_image, output_image = source_image.crop(box), output_image.crop(box)
    hue = color_hue(sample)
    masks = [mask_for(image, hue, hue_tolerance, minimum_saturation, minimum_value)
             for image in (source_image, output_image)]
    radius = density_radius if density_radius is not None else max(2, round(min(source_image.size) * 0.025))
    if radius < 0:
        raise ValueError("--density-radius cannot be negative")
    if mask_dir:
        directory = Path(mask_dir)
        directory.mkdir(parents=True, exist_ok=True)
        masks[0].save(directory / "source-mask.png")
        masks[1].save(directory / "output-mask.png")
        masks[0].filter(ImageFilter.GaussianBlur(radius)).save(directory / "source-density.png")
        masks[1].filter(ImageFilter.GaussianBlur(radius)).save(directory / "output-density.png")
    grids = [grid_counts(mask, columns, rows) for mask in masks]
    total_area = source_image.width * source_image.height
    totals = [sum(cell["pixels"] for row in grid for cell in row) for grid in grids]
    differences = [
        {"row": row, "column": column,
         "source_coverage": grids[0][row][column]["coverage"],
         "output_coverage": grids[1][row][column]["coverage"],
         "delta": round(grids[1][row][column]["coverage"] - grids[0][row][column]["coverage"], 5)}
        for row in range(rows) for column in range(columns)
    ]
    return {
        "verdict": "diagnostic",
        "dimensions": list(source_image.size),
        "region": region,
        "selection": {"sample": sample, "hue_tolerance_degrees": hue_tolerance,
                      "minimum_saturation": minimum_saturation, "minimum_value": minimum_value},
        "grid": {"columns": columns, "rows": rows},
        "density_blur_radius_pixels": radius,
        "source_coverage": round(totals[0] / total_area, 5),
        "output_coverage": round(totals[1] / total_area, 5),
        "largest_cell_differences": sorted(differences, key=lambda cell: abs(cell["delta"]), reverse=True)[:10],
        "source_grid": [[cell["coverage"] for cell in row] for row in grids[0]],
        "output_grid": [[cell["coverage"] for cell in row] for row in grids[1]],
        "warnings": (["Selected source color is sparse; inspect mask previews and sample choice."]
                     if totals[0] / total_area < 0.0005 else []),
    }


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("source")
    cli.add_argument("output")
    cli.add_argument("--sample", required=True, help="Dominant material color sampled from the source, #RRGGBB")
    cli.add_argument("--hue-tolerance", type=float, default=18, help="Hue radius in degrees (default 18)")
    cli.add_argument("--min-saturation", type=float, default=0.08)
    cli.add_argument("--min-value", type=float, default=0.25)
    cli.add_argument("--grid", default="12x8", help="Columns x rows, e.g. 12x8")
    cli.add_argument("--region", help="Physical-pixel x,y,width,height crop")
    cli.add_argument("--mask-dir", help="Write source/output masks here for visual inspection")
    cli.add_argument("--density-radius", type=float,
                     help="Gaussian blur radius in physical pixels for density previews (default 2.5%% of shorter side)")
    args = cli.parse_args()
    try:
        columns, rows = (int(value) for value in args.grid.lower().split("x"))
        if columns <= 0 or rows <= 0 or columns * rows > 400:
            raise ValueError("Grid must contain 1–400 cells")
        if not 0 <= args.hue_tolerance <= 180 or not 0 <= args.min_saturation <= 1 or not 0 <= args.min_value <= 1:
            raise ValueError("Hue tolerance or channel minimum is outside range")
        region = tuple(int(value) for value in args.region.split(",")) if args.region else None
        if region is not None and len(region) != 4:
            raise ValueError("--region needs x,y,width,height")
        report = compare(args.source, args.output, args.sample, args.hue_tolerance,
                         args.min_saturation, args.min_value, columns, rows, region, args.mask_dir,
                         args.density_radius)
    except (ValueError, FileNotFoundError) as error:
        cli.error(str(error))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
