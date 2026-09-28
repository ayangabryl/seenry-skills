import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from test_package import module, ROOT


gate = module('independent_review_gate', ROOT / 'skills/seenry/scripts/independent_review_gate.py')


class IndependentReviewGate(unittest.TestCase):
    def test_only_two_clean_keep_verdicts_clear_the_gate(self):
        clean = {'verdict': 'Keep', 'findings': [], 'strengths': [], 'limits': []}
        self.assertEqual(gate.disposition({}), 'Revise')
        self.assertEqual(gate.disposition({'typography': clean}), 'Revise')
        results = {'typography': clean, 'whole-screen': clean}
        self.assertEqual(gate.disposition(results), 'Keep')
        results['typography'] = {'verdict': 'Keep', 'findings': [{
            'observation': 'Visible issue', 'impact': 'Task cost', 'repair': 'Fix it'
        }], 'limits': []}
        self.assertEqual(gate.disposition(results), 'Revise')
        results['typography'] = clean
        results['whole-screen'] = {'verdict': 'Unverified', 'findings': [], 'limits': ['No mobile capture']}
        self.assertEqual(gate.disposition(results), 'Revise')

    def test_incomplete_structured_review_cannot_clear_the_gate(self):
        with self.assertRaises(ValueError):
            gate.validate_result({'verdict': 'Keep', 'findings': [{'observation': 'Issue'}], 'limits': []})
        with self.assertRaises(ValueError):
            gate.validate_result({'verdict': 'Keep', 'findings': [], 'strengths': ['Good', 5], 'limits': []})
        self.assertEqual(gate.disposition({'typography': {'verdict': 'Keep', 'findings': [],
            'strengths': ['Visible artwork'], 'limits': []}, 'whole-screen':
            {'verdict': 'Keep', 'findings': [], 'strengths': ['Clear action'], 'limits': []}}), 'Keep')
        self.assertIn('findings: []', gate.review_prompt('typography', 'first-screen'))

    def test_full_page_scope_reviews_the_complete_task(self):
        clean = {'verdict': 'Keep', 'findings': [], 'strengths': [], 'limits': ['Static captures do not prove behavior']}
        self.assertEqual(gate.disposition({'whole-screen': clean}, 'full-page'), 'Revise')
        self.assertEqual(gate.disposition({'writing': clean, 'whole-screen': clean}, 'full-page'), 'Keep')
        self.assertEqual(gate.disposition({'typography': clean}, 'full-page'), 'Revise')
        prompt = gate.review_prompt('whole-screen', 'full-page')
        self.assertIn('complete page', prompt)
        self.assertIn('full-page captures', prompt)
        self.assertIn('responsive reflow', prompt)
        self.assertNotIn('first-screen captures', prompt)
        writing_prompt = gate.review_prompt('writing', 'full-page')
        self.assertIn('every later section', writing_prompt)
        self.assertIn('new answer, evidence or action', writing_prompt)

    def test_named_states_are_bounded_and_included_in_review(self):
        states = gate.parse_states(['proof-a=/tmp/a.png', 'saved-b=/tmp/b.webp'])
        self.assertEqual(list(states), ['proof-a', 'saved-b'])
        prompt = gate.review_prompt('whole-screen', 'first-screen', states)
        self.assertIn('proof-a, saved-b', prompt)
        self.assertIn('material, decision and result', prompt)
        for values in (['Proof A=/tmp/a.png'], ['a=/tmp/a.svg'], ['a=/tmp/a.png', 'a=/tmp/b.png'],
                       ['a=/tmp/a.png'] * 5):
            with self.subTest(values=values), self.assertRaises(ValueError):
                gate.parse_states(values)

    def test_reviewers_run_on_staged_inputs_outside_the_project(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            (folder / 'brief.md').write_text('Review the opening.\n')
            for name in ('desktop', 'mobile'):
                (folder / f'{name}.png').write_bytes(name.encode())
            stub = folder / 'codex-stub.py'
            stub.write_text(
                'import json, pathlib, sys\n'
                'path = pathlib.Path(sys.argv[sys.argv.index("-o") + 1])\n'
                '(path.parent / "cwd.txt").write_text(sys.argv[sys.argv.index("-C") + 1])\n'
                'json.dump({"verdict":"Keep","findings":[],"strengths":[],"limits":[]}, path.open("w"))\n'
            )
            if sys.platform == 'win32':
                fake_cli = folder / 'codex-stub.cmd'
                fake_cli.write_text(f'@echo off\r\n"{sys.executable}" "{stub}" %*\r\n')
            else:
                stub.write_text('#!/usr/bin/env python3\n' + stub.read_text())
                stub.chmod(0o755)
                fake_cli = stub
            output = folder / 'review-output'
            result = subprocess.run([
                sys.executable, str(ROOT / 'skills/seenry/scripts/independent_review_gate.py'),
                '--brief', 'brief.md', '--desktop', 'desktop.png', '--mobile', 'mobile.png',
                '--out', str(output), '--codex-bin', str(fake_cli),
            ], cwd=folder, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            summary = json.loads((output / 'summary.json').read_text())
            self.assertEqual(summary['status'], 'Keep')
            for kind, review in summary['reviews'].items():
                self.assertTrue(Path(review['log']).is_file())
                self.assertTrue(Path(review['report']).is_file())
                self.assertFalse(Path((output / kind / 'cwd.txt').read_text()).is_relative_to(folder))


if __name__ == '__main__':
    unittest.main()
