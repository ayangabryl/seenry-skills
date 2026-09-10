"""Print a focused Seenry stage packet. Supplied text is not proof of application."""
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = {
    'understand': ['design-record.md'],
    'research': ['reference-standards.md'],
    'plan': ['design-record.md', 'content-and-finish.md', 'visual-decisions.md', 'color-decisions.md', 'hci-decisions.md'],
    'prototype': ['content-and-finish.md', 'visual-decisions.md', 'color-decisions.md', 'interaction-review.md'],
    'compare': ['visual-review.md', 'reference-standards.md', 'design-record.md'],
    'build': ['content-and-finish.md', 'design-record.md', 'interaction-review.md'],
    'review': ['visual-review.md', 'interaction-review.md', 'reference-standards.md'],
    'refine': ['content-and-finish.md', 'visual-review.md', 'interaction-review.md', 'visual-decisions.md', 'color-decisions.md'],
}
DEPENDENCIES = {'content-and-finish.md': ['studies/hoy.md']}
SOURCES = {
    'auto': 'Use an available evidence route; MCP is optional. Record the actual route.',
    'mcp': 'Use connected MCP for research; if unavailable report it and explicitly change route.',
    'web': 'Do not call MCP. Use ordinary permitted browsing and supplied material.',
    'local': 'Do not use MCP or network. Use supplied local material and bundled guides. Record unverified current facts.',
}

def compile_packet(stage, motion=False, assets=False, root=ROOT, research_source='auto'):
    if research_source not in SOURCES:
        raise ValueError(f'Unknown research source: {research_source}')
    paths = [root / 'SKILL.md'] + [root / 'references' / p for p in STAGES[stage]]
    if stage == 'research' or research_source in ('local', 'web'):
        paths += [root / 'references/without-mcp.md']
    if stage == 'research' and research_source in ('auto', 'mcp'):
        paths += [root / 'references/research.md']
    if stage == 'research' and research_source in ('local', 'web'):
        paths += [root / 'references/visual-decisions.md', root / 'references/hci-decisions.md']
    if motion:
        motion_root = root.parent / 'seenry-motion'
        paths += [motion_root / 'SKILL.md', motion_root / 'references/motion-craft.md',
                  motion_root / 'references/scroll-choreography.md', motion_root / 'references/adapters.md']
    if assets:
        paths += [root.parent / 'seenry-assets/SKILL.md']
    for path in list(paths):
        for dependency in DEPENDENCIES.get(path.name, []):
            paths.append(root / 'references' / dependency)
    paths = list(dict.fromkeys(paths))
    # Resolve every declared selection before returning any partial packet.
    records = []
    for path in paths:
        if not path.is_file():
            raise FileNotFoundError(f'Missing required resource: {path}')
        content = path.read_text(encoding='utf-8')
        records.append({'path': path.relative_to(root.parent).as_posix(),
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'content': content})
    return {'schema': 2, 'stage': stage, 'evidence': 'supplied-only',
            'research_source': research_source, 'execution_constraint': SOURCES[research_source],
            'constraint_enforcement': 'host responsibility; this compiler does not sandbox tools',
            'resources': records}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=STAGES)
    parser.add_argument('--motion', action='store_true')
    parser.add_argument('--assets', action='store_true')
    parser.add_argument('--research-source', choices=SOURCES, default='auto')
    args = parser.parse_args()
    try:
        print(json.dumps(compile_packet(args.stage, args.motion, args.assets, research_source=args.research_source), ensure_ascii=False, indent=2))
    except (FileNotFoundError, UnicodeError) as exc:
        parser.exit(1, str(exc) + '\n')
