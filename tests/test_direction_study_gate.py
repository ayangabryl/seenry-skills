import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from test_package import ROOT


SCRIPT = ROOT / 'skills/seenry/scripts/direction_study_gate.py'


class DirectionStudyGate(unittest.TestCase):
    def run_gate(self, verdict):
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
            result = subprocess.run(command, cwd=folder, text=True, capture_output=True)
            self.assertTrue((folder / 'review/summary.json').is_file(), result.stderr)
            summary = json.loads((folder / 'review/summary.json').read_text())
            self.assertFalse(Path((folder / 'review/review/cwd.txt').read_text()).is_relative_to(folder))
            return result, summary

    def test_clean_independent_keep_clears_and_records_inputs(self):
        result, summary = self.run_gate('Keep')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(summary['status'], 'Keep')
        self.assertEqual(len(summary['input_sha256']), 6)
        self.assertEqual(set(summary['skill_sha256']), {'review', 'art-direction'})

    def test_reset_blocks_expansion(self):
        result, summary = self.run_gate('Reset')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertEqual(summary['status'], 'Revise')
        self.assertEqual(summary['review']['verdict'], 'Reset')


if __name__ == '__main__':
    unittest.main()
