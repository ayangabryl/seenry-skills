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


if __name__ == '__main__':
    unittest.main()
