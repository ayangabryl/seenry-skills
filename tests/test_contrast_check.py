"""The no-browser contrast gate must distinguish a real failed pair from a pass."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'skills/seenry/scripts/contrast_check.py'


class ContrastCheck(unittest.TestCase):
    def test_mixed_pairs_fail_with_individual_results(self):
        run = subprocess.run([sys.executable, str(SCRIPT),
                              '--pair', 'Body on paper', '#24382d', '#f5f1e7', '4.5',
                              '--pair', 'Muted on paper', '#647267', '#f5f1e7', '4.5'],
                             capture_output=True, text=True)
        self.assertEqual(run.returncode, 2)
        checks = json.loads(run.stdout)['checks']
        self.assertEqual([item['pass'] for item in checks], [True, False])

    def test_fully_passing_pair_exits_zero(self):
        run = subprocess.run([sys.executable, str(SCRIPT),
                              '--pair', 'Strong text', '#24382d', '#f5f1e7', '4.5'],
                             capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)


if __name__ == '__main__':
    unittest.main()
