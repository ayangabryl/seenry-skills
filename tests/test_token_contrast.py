"""The offline token check must catch the repeated muted-on-paper failure."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'skills/seenry/scripts/token_contrast.py'


class TokenContrast(unittest.TestCase):
    def run_check(self, muted):
        with tempfile.TemporaryDirectory() as folder:
            page = Path(folder) / 'index.html'
            page.write_text(f'<style>:root{{--paper:#f4f1eb;--ink:#242522;--muted:{muted};'
                            '--on-action-text:#fff}body{background:var(--paper);color:var(--ink)}'
                            '.caption{color:var(--muted)}.button{color:var(--on-action-text)}</style>')
            run = subprocess.run([sys.executable, str(SCRIPT), str(page)],
                                 capture_output=True, text=True)
        return run, json.loads(run.stdout)

    def test_detects_weak_muted_text_without_misclassifying_action_text(self):
        run, report = self.run_check('#77766f')
        self.assertEqual(run.returncode, 2)
        self.assertEqual([(item['textToken'], item['pass']) for item in report['checks']],
                         [('--ink', True), ('--muted', False)])

    def test_passing_tokens_exit_zero(self):
        run, report = self.run_check('#55554f')
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertTrue(all(item['pass'] for item in report['checks']))

    def test_direct_small_text_uses_root_background_and_local_action_fill(self):
        with tempfile.TemporaryDirectory() as folder:
            page = Path(folder) / 'styles.css'
            page.write_text(':root{--paper:#f3f2ee;--action:#315b48;background:var(--paper)}'
                            '.hint{color:#989d93;font-size:10px}'
                            '.action{background:var(--action);color:#ffffff}')
            run = subprocess.run([sys.executable, str(SCRIPT), str(page)],
                                 capture_output=True, text=True)
        report = json.loads(run.stdout)
        self.assertEqual(run.returncode, 2)
        by_selector = {item['selector']: item for item in report['directChecks']}
        self.assertFalse(by_selector['.hint']['pass'])
        self.assertEqual(by_selector['.hint']['backgroundScope'], 'page background approximation')
        self.assertTrue(by_selector['.action']['pass'])
        self.assertEqual(by_selector['.action']['backgroundScope'], 'same rule')

    def test_variable_button_ink_uses_its_local_fill(self):
        with tempfile.TemporaryDirectory() as folder:
            page = Path(folder) / 'index.html'
            page.write_text('<style>:root{--ink:#10100f;--paper:#f4f2eb;--acid:#d5fb6b}'
                            'body{background:var(--ink);color:var(--paper)}'
                            '.button{background:var(--acid);color:var(--ink)}</style>')
            run = subprocess.run([sys.executable, str(SCRIPT), str(page)],
                                 capture_output=True, text=True)
        report = json.loads(run.stdout)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(report['checks'], [])
        self.assertEqual([(item['selector'], item['backgroundScope'], item['pass'])
                          for item in report['directChecks']],
                         [('body', 'same rule', True), ('.button', 'same rule', True)])


if __name__ == '__main__':
    unittest.main()
