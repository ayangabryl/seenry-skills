import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAN = ROOT / 'skills/seenry/scripts/motion_scan.mjs'


def scan(files):
    with tempfile.TemporaryDirectory() as d:
        for name, text in files.items():
            (Path(d) / name).write_text(text)
        out = Path(d) / 'scan.json'
        proc = subprocess.run(['node', str(SCAN), d, '--json', str(out)], capture_output=True, text=True)
        return proc.returncode, json.loads(out.read_text())


def rules(result, level):
    return sorted({f['rule'] for f in result['findings'] if f['level'] == level})


class MotionScan(unittest.TestCase):
    def test_token_motion_with_reduced_motion_passes(self):
        code, result = scan({'a.css': '.m { transition: transform 240ms cubic-bezier(.16, 1, .3, 1), opacity 120ms cubic-bezier(.2, 0, .2, 1); }\n'
                                      '@media (prefers-reduced-motion: reduce) { .m { transition: none; } }\n'})
        self.assertEqual(code, 0)
        self.assertEqual(result['violations'], 0)
        self.assertEqual(result['warnings'], 0)

    def test_transition_all_long_duration_and_missing_reduced_motion_are_violations(self):
        code, result = scan({'a.css': '.m { transition: all 900ms ease; }\n'})
        self.assertEqual(code, 1)
        self.assertEqual(rules(result, 'violation'), ['reduced-motion', 'too-long', 'transition-all'])
        self.assertIn('default-easing', rules(result, 'warn'))

    def test_off_token_values_get_the_nearest_token(self):
        _, result = scan({'a.css': '.m { transition: opacity 200ms cubic-bezier(.16, 1, .3, 1) 150ms; }\n'
                                   '.n { transition-delay: calc(var(--i) * 100ms); }\n'
                                   '@media (prefers-reduced-motion: reduce) { * { transition: none; } }\n'})
        details = {f['rule']: f['detail'] for f in result['findings']}
        self.assertIn('nearest token 180ms', details['off-token-duration'])
        self.assertIn('off-token-delay', details)
        self.assertIn('stagger', details)

    def test_loops_and_tailwind_classes(self):
        _, result = scan({'a.css': '.spinner { animation: spin 1.2s linear infinite; }\n',
                          'b.tsx': 'export const B = () => <div className="transition-transform duration-[2000ms] motion-reduce:transition-none" />\n'})
        self.assertEqual(rules(result, 'violation'), ['too-long'])
        self.assertTrue(result['reducedMotion'])


if __name__ == '__main__':
    unittest.main()
