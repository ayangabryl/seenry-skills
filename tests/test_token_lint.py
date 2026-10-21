import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINT = ROOT / 'skills/seenry/scripts/token_lint.mjs'


def lint(files, *extra):
    with tempfile.TemporaryDirectory() as d:
        for name, text in files.items():
            (Path(d) / name).write_text(text)
        out = Path(d) / 'lint.json'
        proc = subprocess.run(['node', str(LINT), d, '--json', str(out), *extra], capture_output=True, text=True)
        return proc.returncode, json.loads(out.read_text())


class TokenLint(unittest.TestCase):
    def test_token_references_pass(self):
        code, result = lint({'tokens.css': ':root { --space-4: 16px; --text-body: 16px; --dur-1: 120ms; }\n',
                             'a.css': '.card { padding: var(--space-4) calc(var(--space-4) * 2); font-size: var(--text-body); margin: 0 auto;'
                                      ' border: 1px solid; transition: opacity var(--dur-1) var(--ease-out); line-height: 1.5; }\n'})
        self.assertEqual(code, 0)
        self.assertEqual(result['findings'], 0)

    def test_typed_values_and_tailwind_arbitrary_values_fail(self):
        code, result = lint({'a.css': '.card { padding: 9px 15px; font-size: 15px; transition: color 350ms ease; border-radius: 7px; }\n',
                             'b.tsx': 'export const B = () => <div className="p-4 text-[15px] rounded-[7px] duration-[350ms]" />\n'}, '--strict')
        self.assertEqual(code, 1)
        self.assertEqual(result['byRule'], {'padding': 1, 'font-size': 1, 'transition': 1, 'border-radius': 1, 'tailwind-arbitrary': 3})


    def test_project_without_a_scale_is_advised_not_blocked(self):
        code, result = lint({'a.css': '.card { padding: 9px 15px; }\n'})
        self.assertEqual(code, 0)
        self.assertEqual(result['findings'], 1)
        code, _ = lint({'tokens.css': ':root { --space-1: 4px; --space-2: 8px; --text-sm: 14px; --radius-sm: 6px; }\n', 'a.css': '.card { padding: 9px 15px; }\n'})
        self.assertEqual(code, 1)

    def test_converter_leaves_nothing_for_the_lint(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / 'styles.css').write_text('.a { padding: 9px 15px; font-size: 15px; margin: -12px 0 0; border-radius: 7px; transition: color 150ms ease; }\n'
                                                '.b { font-size: 16px; gap: 14px; border-radius: 999px; }\n')
            subprocess.run(['node', str(ROOT / 'skills/seenry/scripts/token_convert.mjs'), d, '--apply'], check=True, capture_output=True)
            text = (Path(d) / 'styles.css').read_text()
            self.assertIn(':root {', text)
            self.assertIn('calc(var(--space-3) * -1)', text)
            proc = subprocess.run(['node', str(LINT), d, '--strict'], capture_output=True, text=True)
            self.assertEqual(proc.returncode, 0, proc.stdout)


if __name__ == '__main__':
    unittest.main()
