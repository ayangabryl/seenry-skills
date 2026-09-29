import base64
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from test_package import ROOT


SCRIPT = ROOT / 'skills/seenry/scripts/direction_study_gate.py'


class DirectionStudyGate(unittest.TestCase):
    def run_gate(self, verdict, craft_image=None, craft_suffix='.png'):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            (folder / 'brief.md').write_text('Compare two poster proofs.\n')
            for name in ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile'):
                (folder / f'{name}.png').write_bytes(name.encode())
            stub = folder / 'codex-stub.py'
            stub.write_text(
                'import json, pathlib, sys\n'
                'path = sys.argv[sys.argv.index("-o") + 1]\n'
                '(pathlib.Path(path).parent / "cwd.txt").write_text(sys.argv[sys.argv.index("-C") + 1])\n'
                '(pathlib.Path(path).parent / "argv.json").write_text(json.dumps(sys.argv))\n'
                '(pathlib.Path(path).parent / "prompt.txt").write_text(sys.stdin.read())\n'
                f'json.dump({{"verdict":"{verdict}","findings":[],"strengths":[],"limits":[]}}, open(path,"w"))\n'
            )
            if sys.platform == 'win32':
                fake_cli = folder / 'codex-stub.cmd'
                fake_cli.write_text(f'@echo off\r\n"{sys.executable}" "{stub}" %*\r\n')
            else:
                stub.write_text('#!/usr/bin/env python3\n' + stub.read_text())
                stub.chmod(0o755)
                fake_cli = stub
            command = [sys.executable, str(SCRIPT), '--brief', 'brief.md',
                       '--decision', 'Keep both posters legible in the opening comparison',
                       '--out', 'review', '--codex-bin', str(fake_cli)]
            for name in ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile'):
                command.extend([f'--{name}', f'{name}.png'])
            if craft_image is not None:
                (folder / f'craft{craft_suffix}').write_bytes(craft_image)
                (folder / 'reference.md').write_text('Source notes.\n')
                command.extend(['--craft-reference-image', f'craft{craft_suffix}',
                                '--reference', 'reference.md'])
            result = subprocess.run(command, cwd=folder, text=True, capture_output=True)
            if result.returncode == 2 and not (folder / 'review/summary.json').is_file():
                return result, None, None, None
            self.assertTrue((folder / 'review/summary.json').is_file(), result.stderr)
            summary = json.loads((folder / 'review/summary.json').read_text())
            review = folder / 'review/review'
            self.assertFalse(Path((review / 'cwd.txt').read_text()).is_relative_to(folder))
            return result, summary, json.loads((review / 'argv.json').read_text()), (review / 'prompt.txt').read_text()

    def test_clean_independent_keep_clears_and_records_inputs(self):
        result, summary, _, _ = self.run_gate('Keep')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(summary['status'], 'Keep')
        self.assertEqual(len(summary['input_sha256']), 6)
        self.assertEqual(set(summary['skill_sha256']), {'gate', 'review', 'art-direction'})

    def test_reset_blocks_expansion(self):
        result, summary, _, _ = self.run_gate('Reset')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertEqual(summary['status'], 'Revise')
        self.assertEqual(summary['review']['verdict'], 'Reset')

    def test_craft_reference_is_attached_and_hashed_separately_from_notes(self):
        image = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII='
        )
        result, summary, argv, prompt = self.run_gate('Keep', craft_image=image)
        self.assertEqual(result.returncode, 0, result.stderr)
        attachments = [Path(argv[index + 1]).name for index, arg in enumerate(argv[:-1]) if arg == '-i']
        self.assertEqual(attachments, ['a-desktop.png', 'a-mobile.png', 'b-desktop.png',
                                       'b-mobile.png', 'craft-reference-image.png'])
        self.assertEqual(summary['input_sha256']['craft-reference-image'], hashlib.sha256(image).hexdigest())
        self.assertIn('reference', summary['input_sha256'])
        self.assertIn('subject material depth', prompt)
        self.assertIn('quiet utility interface', prompt)
        self.assertIn('Read ../reference.md', prompt)

    def test_craft_reference_rejects_invalid_image(self):
        result, summary, _, _ = self.run_gate('Keep', craft_image=b'\x89PNG\r\n\x1a\nnot an image')
        self.assertEqual(result.returncode, 2)
        self.assertIsNone(summary)
        self.assertIn('Cannot read PNG, JPEG or WebP dimensions', result.stderr)

    def test_craft_reference_rejects_unsupported_suffix(self):
        result, summary, _, _ = self.run_gate('Keep', craft_image=b'not an image', craft_suffix='.svg')
        self.assertEqual(result.returncode, 2)
        self.assertIsNone(summary)
        self.assertIn('--craft-reference-image must be PNG, JPEG or WebP', result.stderr)


if __name__ == '__main__':
    unittest.main()
