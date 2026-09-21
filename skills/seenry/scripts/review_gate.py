"""Check review evidence/disposition consistency, not visual quality itself."""
import argparse
import hashlib
import json
from pathlib import Path

CRITERIA = ('subject', 'opening', 'hierarchy', 'material', 'interaction')
RESULTS = {'pass', 'revise', 'fail', 'unverified'}
SUPPORT = ('supported', 'uncertain', 'uninspected')


def response_schema(identities, artifacts, criteria=CRITERIA, review_version=1):
    """Optional strict-output transport shape; evaluate still checks disposition."""
    if not identities or len(set(identities)) != len(identities) or not artifacts:
        raise ValueError('Unique candidate ids and actual artifact names are required')
    if any(not isinstance(x,str) or not x.strip() for x in [*identities,*artifacts,*criteria]):
        raise ValueError('Schema values must be nonempty strings')
    def object_schema(properties):
        return {'type':'object','properties':properties,'required':list(properties),'additionalProperties':False}
    if type(review_version) is not int or review_version not in (1, 2):
        raise ValueError('review_version must be 1 or 2')
    properties={'result':{'type':'string','enum':sorted(RESULTS)},
                         'artifact':{'type':'string','enum':list(artifacts)},
                         'observation':{'type':'string'},
                         'issue_type':{'type':['string','null'],'enum':['observed-defect','missing-evidence',None]}}
    if review_version == 2:
        properties.update(support={'type':'string','enum':list(SUPPORT)},
                          support_reason={'type':'string'},
                          next_check={'type':['string','null']})
    check=object_schema(properties)
    candidate=object_schema({'id':{'type':'string','enum':list(identities)},
                             'checks':object_schema({k:check for k in criteria}),
                             'blocking_issues':{'type':'array','items':{'type':'string'}}})
    properties={'candidates':{'type':'array','items':candidate,'minItems':len(identities),'maxItems':len(identities)},
                          'selected':{'type':['string','null'],'enum':[*identities,None]},
                          'continue_with':{'type':['string','null'],'enum':[*identities,None]}}
    if review_version == 2:
        properties['review_version']={'type':'integer','enum':[2]}
    return object_schema(properties)


def evidence_action(check):
    """Qualitative support is a review claim, never a probability of acceptance."""
    support = check.get('support')
    if support not in SUPPORT:
        raise ValueError('support must be supported, uncertain or uninspected')
    if not isinstance(check.get('support_reason'), str) or not check['support_reason'].strip():
        raise ValueError('support_reason must explain inspected evidence or its limit')
    result, issue = check['result'], check.get('issue_type')
    if support == 'uninspected' and result != 'unverified':
        raise ValueError('Uninspected evidence cannot support a quality verdict')
    if support == 'supported' and (result == 'unverified' or issue == 'missing-evidence'):
        raise ValueError('Missing evidence cannot have supported judgment')
    if result == 'unverified' and issue != 'missing-evidence':
        raise ValueError('Unverified checks must identify missing-evidence')
    if result == 'pass' and issue is not None:
        raise ValueError('A pass cannot also claim an unresolved issue')
    if result in ('fail', 'revise') and issue != 'observed-defect':
        raise ValueError('A visual defect requires an observed-defect record')
    action = ('collect-evidence' if support == 'uninspected' or result == 'unverified' else
              'compare' if support == 'uncertain' else
              'repair' if result in ('revise', 'fail') else 'eligible')
    probe = check.get('next_check')
    if action != 'eligible' and (not isinstance(probe, str) or not probe.strip()):
        raise ValueError('Unresolved judgment needs a specific next_check')
    if action == 'eligible' and probe is not None:
        raise ValueError('Move unresolved next_check into an uncertain or unverified check')
    return action


def evaluate(report, root, criteria=CRITERIA):
    root = Path(root).resolve()
    version = report.get('review_version', 1)
    if type(version) is not int or version not in (1, 2):
        raise ValueError('review_version must be 1 or 2')
    request_path = root / 'request.json'
    if request_path.is_file():
        request = json.loads(request_path.read_text(encoding='utf-8'))
        if request.get('review_version') == 2 and version != 2:
            raise ValueError('This request requires review version 2; legacy fallback would discard evidence support')
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
        if set(checks) != set(criteria):
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
            action = evidence_action(check) if version == 2 else None
            if version == 2 and action != 'eligible':
                unresolved.append({'criterion': criterion, 'issue_type': issue,
                                   'support': check['support'], 'next_action': action,
                                   'next_check': check['next_check']})
            elif version == 1 and check['result'] != 'pass':
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
            if version == 2:
                passed = passed and action == 'eligible'
        if passed:
            eligible.append(identity)
        if version == 2:
            required = {x['next_action'] for x in unresolved}
            if blockers: required.add('repair')
            next_action = 'eligible' if not required else next(iter(required)) if len(required) == 1 else 'resolve-checks'
        else:
            next_action = 'collect-evidence' if unresolved and all(x['issue_type'] == 'missing-evidence' for x in unresolved) else ('repair' if unresolved or blockers else 'eligible')
        actions.append({'candidate': identity, 'next_action': next_action, 'unresolved': unresolved})
    selected = report.get('selected')
    if selected is not None and selected not in identities:
        raise ValueError('Selected candidate does not exist')
    accepted = selected is not None and selected in eligible
    return {'status': 'ready-for-human-review' if accepted else 'needs-revision',
            'review_version': version, 'support_assessed': version == 2,
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
