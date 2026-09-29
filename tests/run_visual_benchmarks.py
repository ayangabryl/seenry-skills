"""Opt-in model calibration for the Seenry first-screen typography reviewer.

This intentionally runs the real independent gate, not a mocked verdict. It is
not part of CI: reviewer availability and model behavior vary over time.
"""

import argparse
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
GATE = ROOT / 'skills/seenry/scripts/independent_review_gate.py'
CASES = ROOT / 'tests/visual_benchmarks/cases.json'


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True, help='Directory for reviewer reports')
    parser.add_argument('--model', help='Optional Codex model override')
    parser.add_argument('--effort', choices=('low', 'medium', 'high', 'xhigh', 'max', 'ultra'))
    parser.add_argument('--codex-bin', help='Codex CLI executable')
    parser.add_argument('--case', help='Run one named case')
    args = parser.parse_args()
    cases = json.loads(CASES.read_text(encoding='utf-8'))
    if args.case:
        cases = [case for case in cases if case['name'] == args.case]
        if not cases:
            parser.error(f'Unknown case: {args.case}')
    args.out.mkdir(parents=True, exist_ok=True)
    passed = True
    for case in cases:
        name = case['name']
        output = args.out / name
        command = [sys.executable, str(GATE), '--brief', str(ROOT / case['brief']),
                   '--desktop', str(ROOT / case['desktop']),
                   '--mobile', str(ROOT / case['mobile']),
                   '--task-anchor', case['task_anchor'], '--out', str(output)]
        if case.get('selected_study'):
            command += ['--selected-study', str(ROOT / case['selected_study'])]
        if args.model:
            command += ['--model', args.model]
        if args.effort:
            command += ['--effort', args.effort]
        if args.codex_bin:
            command += ['--codex-bin', args.codex_bin]
        result = subprocess.run(command, text=True, capture_output=True, check=False)
        summary_path = output / 'summary.json'
        if not summary_path.is_file():
            print(f'{name}: gate failed without a summary ({result.returncode}): {result.stderr.strip()}')
            passed = False
            continue
        summary = json.loads(summary_path.read_text(encoding='utf-8'))
        actual = summary['reviews']['typography']['verdict']
        expected = case['typography_verdict']
        match = actual == expected
        print(f'{name}: typography {actual}; expected {expected}; {"PASS" if match else "FAIL"}; {summary_path}')
        passed &= match
    return 0 if passed else 1


if __name__ == '__main__':
    raise SystemExit(main())
