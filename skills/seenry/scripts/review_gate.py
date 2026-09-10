"""Check review evidence/disposition consistency, not visual quality itself."""
import argparse
import hashlib
import json
from pathlib import Path

CRITERIA = ('subject', 'opening', 'hierarchy', 'material', 'interaction')
RESULTS = {'pass', 'revise', 'fail', 'unverified'}


def evaluate(report, root):
    root = Path(root).resolve()
    candidates = report.get('candidates')
    if not isinstance(candidates, list) or not candidates:
        raise ValueError('At least one candidate review is required')
    eligible, identities, evidence, actions = [], set(), [], []
    for candidate in candidates:
        identity = candidate.get('id')
        if not isinstance(identity, str) or not identity.strip() or identity in identities:
            raise ValueError('Candidate ids must be nonempty and unique')
        identities.add(identity)
        checks = candidate.get('checks', {})
        if set(checks) != set(CRITERIA):
            raise ValueError(f'{identity}: every visual criterion must be assessed separately')
        blockers = candidate.get('blocking_issues')
        if not isinstance(blockers, list) or any(not isinstance(x, str) or not x.strip() for x in blockers):
            raise ValueError(f'{identity}: blocking_issues must be an explicit list')
        passed = not blockers
        unresolved = []
        for criterion, check in checks.items():
            if not isinstance(check, dict) or check.get('result') not in RESULTS:
                raise ValueError(f'{identity}/{criterion}: invalid result')
            if not isinstance(check.get('observation'), str) or not check['observation'].strip():
                raise ValueError(f'{identity}/{criterion}: observable reason required')
            issue = check.get('issue_type')
            if issue is not None and issue not in ('observed-defect', 'missing-evidence'):
                raise ValueError(f'{identity}/{criterion}: invalid issue_type')
            if check['result'] != 'pass':
                unresolved.append({'criterion': criterion, 'issue_type': issue or ('missing-evidence' if check['result'] == 'unverified' else 'observed-defect')})
            artifact = check.get('artifact')
            if not isinstance(artifact, str) or not artifact:
                raise ValueError(f'{identity}/{criterion}: evidence artifact required')
            path = (root / artifact).resolve()
            if not path.is_relative_to(root) or not path.is_file():
                raise ValueError(f'{identity}/{criterion}: evidence must be an existing file inside the run')
            evidence.append({'candidate': identity, 'criterion': criterion,
                             'artifact': path.relative_to(root).as_posix(),
                             'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
            passed = passed and check['result'] == 'pass'
        if passed:
            eligible.append(identity)
        actions.append({'candidate': identity, 'next_action': 'collect-evidence' if unresolved and all(x['issue_type'] == 'missing-evidence' for x in unresolved) else ('repair' if unresolved or blockers else 'eligible'), 'unresolved': unresolved})
    selected = report.get('selected')
    if selected is not None and selected not in identities:
        raise ValueError('Selected candidate does not exist')
    accepted = selected is not None and selected in eligible
    return {'status': 'ready-for-human-review' if accepted else 'needs-revision',
            'selected': selected, 'eligible': eligible, 'evidence': evidence, 'actions': actions,
            'limit': 'Recorded judgments and existing artifacts checked; pixels and user acceptance not assessed.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    parser.add_argument('--root', required=True, type=Path)
    args = parser.parse_args()
    try:
        result = evaluate(json.loads(args.report.read_text(encoding='utf-8')), args.root)
    except (ValueError, OSError, TypeError, KeyError) as exc:
        parser.exit(1, str(exc) + '\n')
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['status'] == 'ready-for-human-review' else 2)


if __name__ == '__main__':
    main()
