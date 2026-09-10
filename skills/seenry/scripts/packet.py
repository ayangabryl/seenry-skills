"""Print a focused Seenry stage packet. Supplied text is not proof of application."""
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = {
    'understand': ['design-record.md'],
    'research': ['reference-standards.md'],
    'plan': ['design-record.md', 'art-direction.md'],
    'wireframe': ['art-direction.md', 'content-and-finish.md'],
    'type': ['visual-decisions.md'],
    'surface': ['color-decisions.md', 'interaction-review.md'],
    'prototype': ['content-and-finish.md', 'visual-decisions.md', 'color-decisions.md', 'interaction-review.md'],
    'compare': ['visual-review.md', 'quality-diagnosis.md'],
    'build': ['content-and-finish.md', 'design-record.md', 'interaction-review.md'],
    'review': ['visual-review.md', 'quality-diagnosis.md', 'production-review.md'],
    'refine': ['content-and-finish.md', 'visual-review.md', 'interaction-review.md', 'visual-decisions.md', 'color-decisions.md'],
}
DEPENDENCIES = {'content-and-finish.md': ['studies/hoy.md']}
SOURCES = {
    'auto': 'Use an available evidence route; MCP is optional. Record the actual route.',
    'mcp': 'Use connected MCP for research; if unavailable report it and explicitly change route.',
    'web': 'Do not call MCP. Use ordinary permitted browsing and supplied material.',
    'local': 'Do not use MCP or network. Use supplied local material and bundled guides. Record unverified current facts.',
}

def compile_packet(stage, motion=False, assets=False, root=ROOT, research_source='auto', project=None):
    if research_source not in SOURCES:
        raise ValueError(f'Unknown research source: {research_source}')
    root = Path(root)
    decisions = []
    if project is not None:
        if project.get('media') not in ('needed', 'none', 'undecided') or project.get('motion') not in ('signature', 'feedback', 'none', 'undecided'):
            raise ValueError('Project requires explicit media and motion needs; use undecided when unknown')
        # Asset-dependent concepts and choreography must be informed before selection.
        if stage in ('research', 'plan', 'prototype', 'type', 'surface', 'build', 'refine'):
            if project['media'] != 'none': assets = True; decisions.append('Material guidance loaded before committing to image-led direction')
            if project['motion'] != 'none' and stage != 'type': motion = True; decisions.append('Motion direction available during planning')
        if stage == 'type': assets = True; decisions.append('Actual typography shortlist guidance selected')
    paths = [root / 'SKILL.md'] + [root / 'references' / p for p in STAGES[stage]]
    if stage == 'research' or research_source in ('local', 'web'):
        paths += [root / 'references/without-mcp.md']
    if stage == 'research' and research_source in ('auto', 'mcp'):
        paths += [root / 'references/research.md']
    if stage == 'research' and research_source in ('local', 'web'):
        paths += [root / 'references/visual-decisions.md', root / 'references/hci-decisions.md']
    if motion:
        motion_root = root.parent / 'seenry-motion'
        paths += [motion_root / 'SKILL.md']
        if stage in ('research','plan') and (not project or project['motion'] != 'feedback'):
            paths += [motion_root / 'references/worked-scores.md']
        else:
            paths += [motion_root / 'references/motion-craft.md']
        if stage in ('surface', 'build', 'review', 'refine') and (not project or project['motion'] != 'feedback'):
            paths += [motion_root / 'references/scroll-choreography.md', motion_root / 'references/adapters.md']
    if assets:
        paths += [root.parent / 'seenry-assets/SKILL.md']
        if stage == 'type':
            paths += [root.parent / 'seenry-assets/assets/type.example.json']
        if stage in ('research', 'plan'):
            paths += [root.parent / 'seenry-assets/assets/candidates.example.json']
        if stage in ('research','plan','surface','build','review','refine'):
            paths += [root.parent / 'seenry-assets/references/material-production.md']
    # Resolve declared dependencies recursively; arbitrary prose links are progressive reading.
    pending = list(paths)
    seen = set()
    while pending:
        path = pending.pop(0)
        if path in seen: continue
        seen.add(path)
        for dependency in DEPENDENCIES.get(path.name, []):
            target = root / 'references' / dependency
            paths.append(target); pending.append(target)
    paths = list(dict.fromkeys(paths))
    # Resolve every declared selection before returning any partial packet.
    records = []
    for path in paths:
        if not path.is_file():
            raise FileNotFoundError(f'Missing required resource: {path}')
        content = path.read_text(encoding='utf-8')
        records.append({'path': path.relative_to(root.parent).as_posix(),
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'content': content})
    return {'schema': 3, 'stage': stage, 'evidence': 'supplied-only', 'routing_decisions': decisions,
            'project_decisions': project,
            'research_source': research_source, 'execution_constraint': SOURCES[research_source],
            'constraint_enforcement': 'host responsibility; this compiler does not sandbox tools',
            'resources': records}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=STAGES)
    parser.add_argument('--motion', action='store_true')
    parser.add_argument('--assets', action='store_true')
    parser.add_argument('--research-source', choices=SOURCES, default='auto')
    parser.add_argument('--project', type=Path, help='JSON with media and motion needs; enables automatic early support')
    args = parser.parse_args()
    try:
        project = json.loads(args.project.read_text(encoding='utf-8')) if args.project else None
        print(json.dumps(compile_packet(args.stage, args.motion, args.assets, research_source=args.research_source, project=project), ensure_ascii=False, indent=2))
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, str(exc) + '\n')
