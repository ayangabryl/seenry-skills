"""The offline check catches generated generic-container naming errors."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / 'skills/seenry/scripts/semantic_names.py'


class SemanticNames(unittest.TestCase):
    def check(self, html):
        with tempfile.TemporaryDirectory() as folder:
            page = Path(folder) / 'index.html'
            page.write_text(html)
            run = subprocess.run([sys.executable, str(SCRIPT), str(page)],
                                 capture_output=True, text=True)
        return run, json.loads(run.stdout)

    def test_flags_named_generic_art_and_summary(self):
        run, report = self.check('<div class="art" aria-label="Vase illustration"></div>'
                                 '<div aria-labelledby="heading">Summary</div>')
        self.assertEqual(run.returncode, 2)
        self.assertEqual(len(report['findings']), 2)
        self.assertEqual(report['findings'][0]['class'], 'art')

    def test_allows_named_semantic_group_and_image(self):
        run, report = self.check('<div role="img" aria-label="Vase illustration"></div>'
                                 '<div role="region" aria-labelledby="heading"></div>'
                                 '<span aria-hidden="true">*</span>')
        self.assertEqual(run.returncode, 0)
        self.assertEqual(report['findings'], [])
