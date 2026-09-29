import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('seenry_sheet', ROOT / 'skills/seenry/scripts/sheet.py')
sheet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sheet)


class Sheet(unittest.TestCase):
    def render(self, record, palette=None):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'sheet.json'
            path.write_text(json.dumps(record), encoding='utf-8')
            args = [str(path)] + (['--palette', palette] if palette else [])
            with redirect_stdout(io.StringIO()):
                sheet.main(args)
            return path.with_suffix('.html').read_text(encoding='utf-8')

    def test_example_renders_every_section_in_seenry_style(self):
        html = self.render(sheet.EXAMPLE, palette='#5b5bd6')
        for sid in ('why', 'research', 'exploration', 'color', 'type', 'guidelines', 'verification'):
            self.assertIn(f'id="{sid}"', html)
        self.assertIn('font-family:Runde', html)
        self.assertIn('Discovered while exploring', html)
        self.assertIn('seenry.design', html)
        self.assertIn('Pass', html)

    def test_minimal_record_omits_empty_sections(self):
        html = self.render({'project': 'Tiny', 'pointOfView': 'A small test.'})
        self.assertNotIn('id="research"', html)
        self.assertNotIn('id="color"', html)

    def test_text_is_escaped(self):
        html = self.render({'project': '<script>x</script>', 'pointOfView': 'a & b'})
        self.assertNotIn('<script>x</script>', html)
        self.assertIn('&lt;script&gt;', html)

    def test_required_fields(self):
        with self.assertRaises(SystemExit):
            sheet.render({'project': 'No view'}, Path('.'))


if __name__ == '__main__':
    unittest.main()
