import importlib.util
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('seenry_assets', ROOT / 'skills/seenry-assets/scripts/assets.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class AssetsTool(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.out = Path(self.temp.name)
    def tearDown(self):
        self.temp.cleanup()

    def test_icons_outside_the_permissive_allowlist_are_refused(self):
        err = io.StringIO()
        with patch.object(assets, 'fetch') as fetch, redirect_stderr(err), redirect_stdout(io.StringIO()):
            assets.main(['icon', 'someset:thing', '--out', str(self.out)])
        fetch.assert_not_called()
        self.assertIn('permissive allowlist', err.getvalue())

    def test_icon_download_records_license(self):
        def fake(url, *args, **kwargs):
            if 'collection?' in url:
                return json.dumps({'info': {'name': 'Lucide', 'license': {'spdx': 'ISC'}}}).encode(), 'application/json'
            return b'<svg xmlns="http://www.w3.org/2000/svg"/>', 'image/svg+xml'
        with patch.object(assets, 'fetch', side_effect=fake), redirect_stdout(io.StringIO()):
            assets.main(['icon', 'lucide:play', '--out', str(self.out)])
        manifest = json.loads((self.out / 'manifest.json').read_text())
        self.assertEqual(manifest[0]['file'], 'lucide-play.svg')
        self.assertEqual(manifest[0]['license'], 'ISC')
        self.assertTrue((self.out / 'lucide-play.svg').is_file())

    def test_image_search_keeps_provenance_and_skips_small_files(self):
        results = {'results': [
            {'id': 'aaaaaaaa1', 'title': 'Tiny', 'width': 300, 'url': 'https://x/tiny.jpg'},
            {'id': 'bbbbbbbb2', 'title': 'Harbor fog', 'width': 1600, 'height': 1067, 'url': 'https://x/fog.jpg',
             'creator': 'A. Person', 'foreign_landing_url': 'https://x/page', 'license': 'cc0', 'license_version': '1.0',
             'provider': 'flickr', 'category': 'photograph'}]}
        def fake(url, *args, **kwargs):
            return (json.dumps(results).encode(), 'application/json') if 'openverse' in url else (b'jpeg', 'image/jpeg')
        with patch.object(assets, 'fetch', side_effect=fake), redirect_stdout(io.StringIO()):
            assets.main(['images', 'harbor fog', '--count', '2', '--out', str(self.out)])
        manifest = json.loads((self.out / 'manifest.json').read_text())
        self.assertEqual(len(manifest), 1)
        self.assertEqual(manifest[0]['license'], 'CC0 1.0')
        self.assertEqual(manifest[0]['source_page'], 'https://x/page')
        assets.main(['sheet', '--out', str(self.out)])
        self.assertIn('harbor-fog', (self.out / 'contact.html').read_text())

    def test_generate_without_a_key_explains_fallbacks(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaisesRegex(SystemExit, 'No image provider key'):
            assets.main(['generate', 'a quiet harbor', '--out', str(self.out)])

    def test_generate_dry_run_picks_available_provider(self):
        out = io.StringIO()
        with patch.dict(os.environ, {'GEMINI_API_KEY': 'test'}, clear=True), redirect_stdout(out):
            assets.main(['generate', 'a quiet harbor', '--dry-run'])
        self.assertEqual(json.loads(out.getvalue())['provider'], 'gemini')


if __name__ == '__main__':
    unittest.main()
