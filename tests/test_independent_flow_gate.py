import unittest
import tempfile
import json
import subprocess
import sys
from pathlib import Path

from test_package import module, ROOT


gate = module('independent_flow_gate', ROOT / 'skills/seenry-apps/scripts/independent_flow_gate.py')


class IndependentFlowGate(unittest.TestCase):
    def test_both_reviews_must_clear_without_findings(self):
        keep = {'verdict': 'Keep', 'findings': [], 'limits': ['Static captures do not verify taps']}
        self.assertEqual(gate.disposition({'visual': keep, 'flow': keep}), 'Keep')
        self.assertEqual(gate.disposition({'visual': keep}), 'Revise')
        revise = {'verdict': 'Revise', 'findings': [
            {'observation': 'Result hidden', 'impact': 'Task unclear', 'repair': 'Show result'}
        ], 'limits': []}
        self.assertEqual(gate.disposition({'visual': keep, 'flow': revise}), 'Revise')
        self.assertEqual(gate.disposition({'visual': keep, 'flow': {'verdict': 'Unverified', 'findings': [], 'limits': ['No result']}}), 'Revise')
        self.assertEqual(gate.disposition({'visual': keep, 'flow': {**revise, 'verdict': 'Keep'}}), 'Revise')

    def test_incomplete_review_rejected(self):
        with self.assertRaises(ValueError):
            gate.validate_result({'verdict': 'Keep', 'findings': [{'observation': 'Issue'}], 'limits': []})

    def test_source_binding_invalidates_changed_app_but_ignores_review_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            app = root / 'app'
            app.mkdir()
            source = app / 'Screen.swift'
            source.write_text('Text("Choose a route")')
            asset = app / 'watch.pdf'
            asset.write_bytes(b'illustration-a')
            output = root / 'review'
            snapshot = gate.source_snapshot(app, output)
            summary = {'source': {'root': str(app), 'sha256': gate.source_digest(snapshot)},
                       'output': str(output), 'review_status': 'Keep'}
            self.assertEqual(gate.verify_source(summary), ('Keep', ''))
            (app / 'evidence').mkdir()
            (app / 'evidence' / 'notes.json').write_text('{"status":"Keep"}')
            self.assertEqual(gate.verify_source(summary), ('Keep', ''))
            asset.write_bytes(b'illustration-b')
            self.assertEqual(gate.verify_source(summary)[0], 'Stale')
            asset.write_bytes(b'illustration-a')
            source.write_text('Text("Choose a seat")')
            self.assertEqual(gate.verify_source(summary)[0], 'Stale')

    def test_source_verification_requires_a_bound_source(self):
        self.assertEqual(gate.verify_source({'review_status': 'Keep'})[0], 'Unverified')

    def test_cli_review_binds_source_and_later_edit_invalidates_it(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            app = root / 'app'
            app.mkdir()
            source = app / 'Screen.swift'
            source.write_text('Text("Open")')
            brief = root / 'brief.md'
            brief.write_text('Choose a route.\n')
            captures = [root / 'entry.png', root / 'result.png']
            for image in captures:
                image.write_bytes(b'image')
            stub = root / 'codex-stub.py'
            stub.write_text('#!/usr/bin/env python3\n'
                            'import json,pathlib,sys\n'
                            'path=pathlib.Path(sys.argv[sys.argv.index("-o")+1])\n'
                            'path.write_text(json.dumps({"verdict":"Keep","findings":[],"limits":[]}))\n')
            if sys.platform == 'win32':
                launcher = root / 'codex-stub.cmd'
                launcher.write_text(f'@echo off\r\n"{sys.executable}" "{stub}" %*\r\n')
                stub = launcher
            else:
                stub.chmod(0o755)
            output = root / 'review'
            script = Path(gate.__file__)
            result = subprocess.run([sys.executable, str(script), '--brief', str(brief),
                                     '--capture', str(captures[0]), '--capture', str(captures[1]),
                                     '--source-root', str(app), '--out', str(output),
                                     '--codex-bin', str(stub)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            summary_file = output / 'summary.json'
            summary = json.loads(summary_file.read_text())
            self.assertEqual(summary['status'], 'Keep')
            self.assertEqual(summary['source']['file_count'], 1)
            source.write_text('Text("Changed")')
            check = subprocess.run([sys.executable, str(script), '--verify-summary', str(summary_file)],
                                   capture_output=True, text=True)
            self.assertEqual(check.returncode, 2, check.stderr + check.stdout)
            self.assertEqual(json.loads(check.stdout)['status'], 'Stale')


if __name__ == '__main__':
    unittest.main()
