"""Numeric boundary, hostile input and portable offline artifact checks."""
import importlib.util
import json
import socket
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('color_lab', ROOT / 'skills/seenry/scripts/color_lab.py')
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)
EXAMPLE = ROOT / 'skills/seenry/assets/color-lab.example.json'

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.external, self.input_ids, self.labels = [], [], []
        self.scripts = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script': self.scripts += 1
        for key in ('src', 'href'):
            if key in attrs: self.external.append(attrs[key])
        if tag == 'input': self.input_ids.append(attrs['id'])
        if tag == 'label': self.labels.append(attrs['for'])

class ColorLab(unittest.TestCase):
    def data(self):
        return json.loads(EXAMPLE.read_text(encoding='utf-8'))
    def test_known_contrast_and_threshold_without_rounding(self):
        self.assertEqual(lab.contrast('#000', '#FFF'), 21)
        self.assertEqual(lab.contrast('#AB3456', '#AB3456'), 1)
        self.assertAlmostEqual(lab.contrast('#777', '#FFF'), 4.478089, places=5)
        data = lab.normalize(self.data())
        data['palettes'][0]['roles']['muted'] = '#777777'
        check = next(c for c in lab.audit(data)['palettes'][0]['checks'] if c['label'] == 'Secondary text')
        self.assertFalse(check['pass'])
    def test_luminous_action_requires_appropriate_foreground(self):
        data = lab.normalize(self.data())
        roles = data['palettes'][0]['roles']
        roles['action'], roles['onAction'] = '#FFFF00', '#FFFFFF'
        check = lambda: next(c for c in lab.audit(data)['palettes'][0]['checks'] if c['label'] == 'Action label')
        self.assertFalse(check()['pass'])
        roles['onAction'] = '#111111'
        self.assertTrue(check()['pass'])
    def test_invalid_or_unresolved_colors_do_not_get_silent_scores(self):
        for value in ('red', '#1234', '#12345678', 'oklch(50% .2 20)', 'var(--brand)', '#NaNNaN', None, 0):
            with self.subTest(value=value), self.assertRaises(ValueError): lab.color(value)
        data = self.data()
        del data['palettes'][0]['roles']['focus']
        with self.assertRaisesRegex(ValueError, 'missing'): lab.normalize(data)
    def test_authored_copy_cannot_inject_html_or_external_resources(self):
        data = self.data()
        payload = '<script src="https://example.com/a.js"></script><img src=x onerror=alert(1)>'
        data['copy']['title'] = payload
        data['copy']['value'] = '\" autofocus onfocus=alert(1) x=\"'
        data['palettes'][0]['name'] = payload
        data = lab.normalize(data)
        document = Document()
        rendered = lab.render(data, lab.audit(data))
        document.feed(rendered)
        self.assertEqual(document.scripts, 1)
        self.assertEqual(document.external, [])
        self.assertEqual(document.input_ids, document.labels)
        self.assertEqual(len(document.input_ids), len(set(document.input_ids)))
        self.assertIn('&lt;script', rendered)
    def test_build_with_network_unavailable_and_unicode_path(self):
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary) / 'études'
            with patch.object(socket.socket, 'connect', side_effect=AssertionError('network forbidden')):
                report = lab.build(EXAMPLE, target)
            self.assertEqual(len(report['input_sha256']), 64)
            self.assertEqual(json.loads((target / 'audit.json').read_text(encoding='utf-8')), report)
            document = Document()
            document.feed((target / 'index.html').read_text(encoding='utf-8'))
            self.assertFalse(document.external)
            self.assertTrue(all(p['role_pairs_pass'] for p in report['palettes']))
    def test_invalid_input_does_not_write_partial_artifact(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, target = Path(temporary) / 'input.json', Path(temporary) / 'result'
            source.write_text('{"copy": {}}', encoding='utf-8')
            with self.assertRaises(ValueError): lab.build(source, target)
            self.assertFalse(target.exists())

if __name__ == '__main__': unittest.main()
