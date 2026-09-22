"""Check a replication evidence ledger, not visual quality. No network or image judgment."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def check(ledger, base):
    base = Path(base).resolve()
    gaps, mismatches = [], []
    if not isinstance(ledger, dict) or ledger.get('schema') != 1:
        raise ValueError('Expected replication ledger schema 1')
    required = ledger.get('required_states')
    if not isinstance(required, list) or not required or any(not isinstance(s, str) or not s.strip() for s in required) or len(required) != len(set(required)):
        raise ValueError('Declare distinct nonempty required_states from the inspected source')
    artifacts = ledger.get('artifacts', {})
    if not isinstance(artifacts, dict): raise ValueError('artifacts must be an object')
    valid = set()
    for name, item in artifacts.items():
        if not isinstance(item, dict) or item.get('role') not in ('source','output'):
            gaps.append(f'{name}: invalid artifact role'); continue
        path = item.get('path')
        if not isinstance(path, str) or not path:
            gaps.append(f'{name}: missing artifact path'); continue
        resolved = (base / path).resolve()
        if not resolved.is_relative_to(base) or not resolved.is_file():
            gaps.append(f'{name}: missing or external artifact'); continue
        expected = item.get('sha256')
        if not isinstance(expected, str) or len(expected) != 64 or hashlib.sha256(resolved.read_bytes()).hexdigest() != expected:
            gaps.append(f'{name}: artifact hash missing or changed'); continue
        valid.add(name)
    measurements = ledger.get('measurements', [])
    if not isinstance(measurements, list): raise ValueError('measurements must be a list')
    seen = {s: set() for s in required}
    def number(n): return type(n) in (int,float) and math.isfinite(n)
    for i, m in enumerate(measurements):
        if not isinstance(m, dict): raise ValueError('Each measurement must be an object')
        label = m.get('name') or f'measurement {i+1}'
        state, kind = m.get('state'), m.get('kind')
        if state not in seen or kind not in ('geometry','type-spacing','motion'):
            gaps.append(f'{label}: unknown state or kind'); continue
        source, output = m.get('source_artifact'), m.get('output_artifact')
        evidence = source in valid and output in valid and artifacts[source]['role']=='source' and artifacts[output]['role']=='output'
        if not evidence:
            gaps.append(f'{label}: source/output evidence incomplete'); continue
        vals = [m.get(k) for k in ('target','actual','tolerance')]
        if not all(number(n) for n in vals) or vals[2] < 0 or not isinstance(m.get('basis'),str) or not m['basis'].strip():
            gaps.append(f'{label}: finite values, nonnegative tolerance and measurement basis required'); continue
        seen[state].add(kind)
        if abs(vals[0]-vals[1]) > vals[2]: mismatches.append(label)
    motion_states = ledger.get('motion_states', [])
    if not isinstance(motion_states,list) or any(s not in seen for s in motion_states): raise ValueError('motion_states must be declared required states')
    for state, kinds in seen.items():
        needed = {'geometry','type-spacing'} | ({'motion'} if state in motion_states else set())
        for kind in sorted(needed-kinds): gaps.append(f'{state}: missing {kind} evidence')
    unresolved = ledger.get('unresolved', [])
    if not isinstance(unresolved, list) or any(not isinstance(x,str) or not x.strip() for x in unresolved): raise ValueError('unresolved must list nonempty limitations')
    gaps.extend(unresolved)
    return {'status':'needs revision' if mismatches else 'unverified' if gaps else 'matched within recorded tolerances',
            'mismatches':mismatches, 'unresolved':gaps,
            'scope':'Checks supplied numeric measurements and local artifact hashes only. Does not inspect pixels, verify the author, certify whole-reference fidelity or grant user acceptance.'}


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ledger',type=Path)
    args=parser.parse_args()
    try:
        result=check(json.loads(args.ledger.read_text(encoding='utf-8')),args.ledger.parent)
        print(json.dumps(result,indent=2)); raise SystemExit(0 if result['status']=='matched within recorded tolerances' else 1)
    except (ValueError,OSError) as exc:
        parser.exit(2,f'{exc}\n')
