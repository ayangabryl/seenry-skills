import importlib.util
import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('seenry_palette', ROOT / 'skills/seenry/scripts/palette.py')
palette = importlib.util.module_from_spec(spec)
spec.loader.exec_module(palette)


class Palette(unittest.TestCase):
    def test_contrast_matches_reference_values(self):
        self.assertAlmostEqual(palette.wcag('#ffffff', '#000000'), 21.0, places=2)
        self.assertAlmostEqual(palette.apca('#888888', '#ffffff'), 63.1, delta=0.2)
        self.assertAlmostEqual(palette.apca('#ffffff', '#000000'), -107.9, delta=0.2)

    def test_oklch_round_trip(self):
        for value in ('#5b5bd6', '#ff5a1f', '#16a34a', '#facc15'):
            L, C, H = palette.rgb_to_oklch(palette.hex_to_rgb(value))
            self.assertEqual(palette.oklch_to_hex(L, C, H)[0], value)

    def test_generated_systems_pass_every_measured_pair(self):
        for brand in ('#5b5bd6', '#ff5a1f', '#16a34a', '#facc15', '#0ea5e9', '#e11d48', '#111111', '#7c3aed'):
            with self.subTest(brand=brand), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                self.assertEqual(palette.main([brand]), 0)

    def test_ramp_lightness_descends_and_hue_holds(self):
        values, anchor, (L0, C0, H0) = palette.ramp('#0ea5e9')
        lightness = [palette.rgb_to_oklch(palette.hex_to_rgb(v))[0] for v in values.values()]
        self.assertEqual(lightness, sorted(lightness, reverse=True))
        for step in (300, 500, 700):
            H = palette.rgb_to_oklch(palette.hex_to_rgb(values[step]))[2]
            self.assertLess(abs(H - H0), 6, step)

    def test_pin_keeps_the_exact_brand(self):
        values, anchor, _ = palette.ramp('#facc15', pin=True)
        self.assertEqual(values[anchor], '#facc15')

    def test_gray_brand_produces_true_neutrals(self):
        values, _, _ = palette.ramp('#111111', neutral=True)
        for v in values.values():
            r, g, b = palette.hex_to_rgb(v)
            self.assertAlmostEqual(r, g, delta=1 / 255)
            self.assertAlmostEqual(g, b, delta=1 / 255)

    def test_light_brand_keeps_its_color_with_dark_text(self):
        light, dark = palette.semantic(palette.ramp('#facc15')[0], palette.ramp('#facc15', neutral=True)[0], 200)
        self.assertEqual(light['on-accent'], palette.ramp('#facc15', neutral=True)[0][950])


if __name__ == '__main__':
    unittest.main()
