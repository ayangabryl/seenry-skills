import json
import hashlib
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

    def test_selected_study_and_task_anchor_are_checked_in_first_screen_prompts(self):
        typography = gate.review_prompt('typography', 'first-screen', selected_study=True,
                                        task_anchor='first timetable card')
        self.assertIn('dominant type silhouette', typography)
        self.assertIn('actual words', typography)
        self.assertIn('materially new headline', typography)
        self.assertIn('return Revise', typography)
        self.assertIn('submitting its new study', typography)
        self.assertIn('first timetable card', typography)
        self.assertIn('phone capture', typography)
        whole = gate.review_prompt('whole-screen', 'first-screen', task_anchor='first timetable card')
        self.assertIn('first timetable card', whole)
        self.assertIn('return Revise', whole)
        self.assertNotIn('dominant type silhouette', whole)
        legacy = gate.review_prompt('typography', 'first-screen')
        self.assertNotIn('selected study', legacy)
        self.assertNotIn('task anchor', legacy)

    def test_selected_study_is_staged_hashed_and_attached_only_to_typography(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            (folder / 'brief.md').write_text('Review the opening.\n')
            for name in ('desktop', 'mobile', 'selected'):
                (folder / f'{name}.png').write_bytes(name.encode())
            stub = folder / 'codex-stub.py'
            stub.write_text(
                '#!/usr/bin/env python3\n'
                'import json, pathlib, sys\n'
                'path = pathlib.Path(sys.argv[sys.argv.index("-o") + 1])\n'
                'images = [sys.argv[i+1] for i, arg in enumerate(sys.argv[:-1]) if arg == "-i"]\n'
                '(path.parent / "invocation.json").write_text(json.dumps({"images": images, '
                '"prompt": sys.stdin.read()}))\n'
                'path.write_text(json.dumps({"verdict":"Keep","findings":[],"strengths":[],"limits":[]}))\n'
            )
            if sys.platform == 'win32':
                launcher = folder / 'codex-stub.cmd'
                launcher.write_text(f'@echo off\r\n"{sys.executable}" "{stub}" %*\r\n')
                stub = launcher
            else:
                stub.chmod(0o755)
            output = folder / 'review-output'
            result = subprocess.run([
                sys.executable, str(ROOT / 'skills/seenry/scripts/independent_review_gate.py'),
                '--brief', 'brief.md', '--desktop', 'desktop.png', '--mobile', 'mobile.png',
                '--selected-study', 'selected.png', '--task-anchor', 'first timetable card',
                '--out', str(output), '--codex-bin', str(stub),
            ], cwd=folder, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            summary = json.loads((output / 'summary.json').read_text())
            self.assertEqual(summary['task_anchor'], 'first timetable card')
            self.assertEqual(summary['input_sha256']['selected-study'], hashlib.sha256(b'selected').hexdigest())
            self.assertEqual((output / 'selected-study.png').read_bytes(), b'selected')
            typography = json.loads((output / 'typography/invocation.json').read_text())
            whole = json.loads((output / 'whole-screen/invocation.json').read_text())
            self.assertEqual([Path(path).name for path in typography['images']],
                             ['desktop.png', 'mobile.png', 'selected-study.png'])
            self.assertEqual([Path(path).name for path in whole['images']],
                             ['desktop.png', 'mobile.png'])
            self.assertIn('first timetable card', typography['prompt'])
            self.assertIn('first timetable card', whole['prompt'])

    def test_study_options_reject_unsupported_scope_and_empty_anchor(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            script = str(ROOT / 'skills/seenry/scripts/independent_review_gate.py')
            base = [sys.executable, script, '--brief', 'brief.md', '--desktop', 'desktop.png',
                    '--mobile', 'mobile.png', '--out', 'output', '--codex-bin', sys.executable]
            for extra, error in [(['--scope', 'full-page', '--selected-study', 'study.png'], 'require --scope first-screen'),
                                 (['--task-anchor', '  '], 'must name a visible first useful item')]:
                with self.subTest(extra=extra):
                    result = subprocess.run(base + extra, cwd=folder, capture_output=True, text=True)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(error, result.stderr)

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
