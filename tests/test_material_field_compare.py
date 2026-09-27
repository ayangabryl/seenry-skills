import importlib.util
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw


script = Path(__file__).resolve().parents[1] / "skills/seenry/scripts/material_field_compare.py"
spec = importlib.util.spec_from_file_location("material_field_compare", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MaterialFieldCompareTest(unittest.TestCase):
    def test_shifted_material_detected_when_total_area_is_equal(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.png"
            output = Path(directory) / "output.png"
            for path, x in ((source, 0), (output, 60)):
                image = Image.new("RGB", (120, 80), "#f7f7f7")
                ImageDraw.Draw(image).rectangle((x, 0, x + 19, 39), fill="#ef6b4d")
                image.save(path)
            report = module.compare(source, output, "#ef6b4d", columns=6, rows=4,
                                    mask_dir=Path(directory) / "masks")
            self.assertEqual(report["source_coverage"], report["output_coverage"])
            self.assertNotEqual(report["source_grid"], report["output_grid"])
            self.assertNotIn("relative_spatial_count_difference", report)
            self.assertTrue((Path(directory) / "masks/source-mask.png").exists())
            self.assertTrue((Path(directory) / "masks/output-mask.png").exists())
            self.assertTrue((Path(directory) / "masks/source-density.png").exists())
            self.assertTrue((Path(directory) / "masks/output-density.png").exists())

    def test_same_material_and_unrelated_dark_ink(self):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / "page.png"
            image = Image.new("RGB", (40, 40), "#f7f7f7")
            draw = ImageDraw.Draw(image)
            draw.rectangle((0, 0, 9, 9), fill="#ef6b4d")
            draw.rectangle((20, 20, 29, 29), fill="#181818")
            image.save(page)
            report = module.compare(page, page, "#ef6b4d", columns=2, rows=2)
            self.assertEqual(report["source_grid"], report["output_grid"])
            self.assertEqual(report["source_coverage"], 0.0625)

    def test_mismatched_sizes_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.png"
            output = Path(directory) / "output.png"
            Image.new("RGB", (10, 10)).save(source)
            Image.new("RGB", (12, 10)).save(output)
            with self.assertRaisesRegex(ValueError, "equal physical dimensions"):
                module.compare(source, output, "#ef6b4d")


if __name__ == "__main__":
    unittest.main()
