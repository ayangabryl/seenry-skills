"""Print a focused Seenry stage packet. Supplied text is not proof of application."""
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = {
    'understand': ['design-record.md'],
    'research': ['research.md', 'reference-standards.md'],
    'plan': ['design-record.md', 'visual-decisions.md', 'hci-decisions.md'],
    'prototype': ['visual-decisions.md', 'interaction-review.md'],
    'compare': ['reference-standards.md', 'design-record.md'],
    'build': ['design-record.md', 'interaction-review.md'],
    'review': ['interaction-review.md', 'reference-standards.md'],
    'refine': ['interaction-review.md', 'visual-decisions.md'],
}

def compile_packet(stage, motion=False, assets=False, root=ROOT):
    paths = [root / 'SKILL.md'] + [root / 'references' / p for p in STAGES[stage]]
    if motion:
        motion_root = root.parent / 'seenry-motion'
        paths += [motion_root / 'SKILL.md', motion_root / 'references/motion-craft.md',
                  motion_root / 'references/scroll-choreography.md', motion_root / 'references/adapters.md']
    if assets:
        paths += [root.parent / 'seenry-assets/SKILL.md']
    # Resolve every declared selection before returning any partial packet.
    records = []
    for path in paths:
        if not path.is_file():
            raise FileNotFoundError(f'Missing required resource: {path}')
        content = path.read_text(encoding='utf-8')
        records.append({'path': path.relative_to(root.parent).as_posix(),
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'content': content})
    return {'schema': 1, 'stage': stage, 'evidence': 'supplied-only', 'resources': records}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=STAGES)
    parser.add_argument('--motion', action='store_true')
    parser.add_argument('--assets', action='store_true')
    args = parser.parse_args()
    try:
        print(json.dumps(compile_packet(args.stage, args.motion, args.assets), ensure_ascii=False, indent=2))
    except (FileNotFoundError, UnicodeError) as exc:
        parser.exit(1, str(exc) + '\n')
