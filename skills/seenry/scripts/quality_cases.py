"""Track human review coverage and flag descriptor convergence; not a taste classifier."""
import argparse
import json
from pathlib import Path

DIMENSIONS = ('opening', 'medium', 'typography', 'palette', 'rhythm', 'interaction')


def compare(a, b):
    shared = [key for key in DIMENSIONS if a.get(key) and a.get(key) == b.get(key)]
    comparable = [key for key in DIMENSIONS if a.get(key) and b.get(key)]
    missing = [key for key in DIMENSIONS if key not in comparable]
    return {'shared': shared, 'review_convergence': len(shared) >= 4,
            'comparable': comparable, 'missing': missing,
            'evidence_status': 'complete' if not missing else 'partial' if comparable else 'missing',
            'limit': 'Exact author-provided descriptors only; useful consistency can trigger this flag. A false flag does not establish novelty; missing descriptors are not differences.'}


def summary(cases):
    labeled, agreement, unlabeled = 0, 0, 0
    projects = {'development': set(), 'holdout': set()}
    for case in cases:
        if case.get('split') not in projects or not case.get('project'): raise ValueError('Each case needs project and development/holdout split')
        projects[case['split']].add(case['project'])
        labels = case.get('human_labels', [])
        for label in labels:
            if label.get('verdict') not in ('acceptable', 'needs-revision') or not label.get('reviewer') or not label.get('reason'):
                raise ValueError('Human labels need reviewer, verdict and reason')
        if labels:
            labeled += 1
            if len(labels) >= 2 and len({x['verdict'] for x in labels}) == 1: agreement += 1
        else: unlabeled += 1
    if projects['development'] & projects['holdout']: raise ValueError('Project leakage between development and holdout')
    return {'cases': len(cases), 'human_labeled': labeled, 'unlabeled': unlabeled,
            'cases_with_two_or_more_agreeing_labels': agreement,
            'limit': 'Coverage and recorded agreement only. No automatic quality or authorship accuracy.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('command', choices=('summary', 'compare')); parser.add_argument('input', type=Path); parser.add_argument('--other', type=Path)
    args = parser.parse_args()
    try:
        data = json.loads(args.input.read_text(encoding='utf-8'))
        print(json.dumps(summary(data) if args.command == 'summary' else compare(data, json.loads(args.other.read_text(encoding='utf-8'))), indent=2))
    except (ValueError, OSError, AttributeError, TypeError) as error: parser.exit(1, str(error) + '\n')
