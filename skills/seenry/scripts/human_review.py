"""Attach supplied human feedback to exact artifact bytes; not an identity verifier."""
import argparse, hashlib, json, time, uuid
from pathlib import Path
DECISIONS = ('accept', 'reject', 'prefer')

def source_info(root, source):
    root = Path(root).resolve(); path = (root / source).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError('Use an existing source artifact inside the run')
    return path.relative_to(root).as_posix(), hashlib.sha256(path.read_bytes()).hexdigest()

def record(root, source, expected_sha256, decision, reviewer, quotation, context):
    root = Path(root).resolve(); relative, digest = source_info(root, source)
    if digest != expected_sha256: raise ValueError('Artifact changed since review; do not apply feedback to different bytes')
    if decision not in DECISIONS: raise ValueError('Decision must be accept, reject or prefer')
    if any(not isinstance(x, str) or not x.strip() for x in (reviewer, quotation, context)):
        raise ValueError('Reviewer, exact supplied quotation and collection context are required')
    folder = root / 'human-reviews'; folder.mkdir(exist_ok=True)
    event = {'schema': 1, 'source': relative, 'sha256': digest, 'decision': decision, 'reviewer': reviewer,
             'quotation': quotation, 'context': context, 'recorded_at': time.time(),
             'limits': ['Feedback supplied by host; human identity and quotation authenticity are not independently verified.',
                        'Visual acceptance and relative preference do not establish functional or motion correctness.']}
    target = folder / (uuid.uuid4().hex + '.json')
    with target.open('x', encoding='utf-8') as stream: json.dump(event, stream, indent=2)
    return event

def assess(root, source):
    root = Path(root).resolve(); relative, digest = source_info(root, source)
    events = [json.loads(p.read_text(encoding='utf-8')) for p in (root / 'human-reviews').glob('*.json')]
    current = sorted((x for x in events if x['source'] == relative and x['sha256'] == digest), key=lambda x:x['recorded_at'])
    latest = current[-1] if current else None
    statuses = {'reject':'human-rejected', 'accept':'human-accepted-visual', 'prefer':'human-preferred-relative'}
    return {'source': relative, 'sha256': digest, 'status': statuses[latest['decision']] if latest else 'unreviewed-current-source',
            'latest': latest, 'matching_records': len(current),
            'older_source_records': sum(x['source'] == relative and x['sha256'] != digest for x in events),
            'limit': 'A model-only pass cannot override a matching human rejection. New source bytes need a new review.'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=('record','status'));p.add_argument('root',type=Path);p.add_argument('--source',required=True)
    p.add_argument('--sha256');p.add_argument('--decision',choices=DECISIONS);p.add_argument('--reviewer');p.add_argument('--quotation');p.add_argument('--context')
    a=p.parse_args()
    try:
        result=record(a.root,a.source,a.sha256,a.decision,a.reviewer,a.quotation,a.context) if a.command=='record' else assess(a.root,a.source)
        print(json.dumps(result,indent=2))
    except (ValueError,OSError,KeyError,TypeError) as error:p.exit(1,str(error)+'\n')
if __name__=='__main__':main()
