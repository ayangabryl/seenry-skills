"""Check a recorded design checkpoint. No API calls, pixel inspection or UI edits."""
import argparse
import hashlib
import json
from pathlib import Path
from jev_decision import prepare, validate_response


def assess(checkpoint, request, result, root):
    """Combine host-recorded evidence with a validated Jev result, never its confidence."""
    payload, encoded = prepare(request)
    validate_response(result, payload)
    if result.get('live') is not True or result.get('request_sha256') != hashlib.sha256(encoded).hexdigest():
        raise ValueError('Result does not match this live request')
    for field, limit in [('repairs_used', 2), ('resets_used', 1)]:
        if type(checkpoint.get(field)) is not int or not 0 <= checkpoint[field] <= limit:
            raise ValueError('Invalid or exceeded ' + field)
    artifacts = checkpoint.get('artifacts', [])
    if not artifacts:
        raise ValueError('Supply source and inspection artifacts')
    for item in artifacts:
        path = (root / item['path']).resolve()
        if not path.is_relative_to(root.resolve()) or not path.is_file():
            raise ValueError('Artifact must exist inside the checkpoint directory')
        if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Stale artifact: ' + item['path'])
    checks = checkpoint.get('checks', [])
    if not checks or len({c['id'] for c in checks}) != len(checks):
        raise ValueError('Supply distinct required checks')
    names = {a['path'] for a in artifacts}
    for check in checks:
        if check['status'] not in ('pass', 'fail', 'uncertain', 'uninspected'):
            raise ValueError('Invalid check status')
        if not check.get('reason'):
            raise ValueError('Each check needs an observable reason')
        if check['status'] != 'uninspected' and check.get('evidence') not in names:
            raise ValueError('Inspected checks must reference a recorded artifact')
    failed = [c['id'] for c in checks if c['status'] == 'fail']
    unknown = [c['id'] for c in checks if c['status'] in ('uncertain', 'uninspected')]
    abstained = [k for k, a in result['answers'].items() if a['choice'] == 'none']
    if failed:
        status = 'repair' if checkpoint['repairs_used'] < 2 else 'stop-unresolved'
    elif unknown:
        status = 'inspect-or-compare'
    elif abstained:
        status = 'agent-review'
    else:
        status = 'ready-for-human-review'
    return {'status': status, 'failed': failed, 'unresolved': unknown, 'abstained': abstained,
            'choices': {k:a['choice'] for k,a in result['answers'].items()},
            'human_acceptance':'pending', 'reference_parity':'unproven',
            'scope':'Host-recorded evidence and hash integrity only; does not inspect pixels or validate attestations.',
            'automatic_mutations':False}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('checkpoint', type=Path)
    p.add_argument('--request', type=Path, required=True)
    p.add_argument('--result', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    a = p.parse_args()
    try:
        r = assess(json.loads(a.checkpoint.read_text()), json.loads(a.request.read_text()),
                   json.loads(a.result.read_text()), a.checkpoint.parent)
        with a.output.open('x') as f:
            json.dump(r, f, indent=2); f.write('\n')
        print(r['status'])
    except (OSError, ValueError, TypeError, KeyError) as e:
        p.exit(1, 'Stopped: ' + str(e) + '\n')


if __name__ == '__main__':
    main()
