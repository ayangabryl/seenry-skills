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
DEPENDENCIES = {'content-and-finish.md': ['studies/hoy.md'], 'visual-review.md': ['visual-lessons.md'], 'component-design.md': ['content-model.md']}
SOURCES = {
    'auto': 'Use an available evidence route; MCP is optional. Record the actual route.',
    'mcp': 'Use connected MCP for research; if unavailable report it and explicitly change route.',
    'web': 'Do not call MCP. Use ordinary permitted browsing and supplied material.',
    'local': 'Do not use MCP or network. Use supplied local material and bundled guides. Record unverified current facts.',
}
MOTION_HELPERS = {
    'geometry': ['geometry-transition.mjs'],
    'icon-swap': ['icon-swap.mjs'],
    'morph-icon': ['morph-icon.mjs'],
    'lottie': ['lottie-toggle.mjs'],
    'scroll': ['scroll-scene.mjs'],
    'number': ['number-transition.mjs'],
}
FOCUSED_STAGES = {
    'understand': ['design-record.md'],
    'research': ['reference-standards.md'],
    'plan': ['art-direction.md'],
    'wireframe': ['art-direction.md'],
    'type': ['visual-decisions.md'],
    'surface': ['visual-decisions.md', 'color-decisions.md'],
    'prototype': ['content-and-finish.md', 'visual-decisions.md'],
    'compare': ['visual-review.md'],
    'build': ['content-and-finish.md', 'interaction-review.md'],
    'review': ['visual-review.md', 'production-review.md'],
    'refine': ['visual-review.md', 'visual-decisions.md'],
}

# Component scope substitutes its own decision guides; it is not a website packet
# with a component warning appended after hero/brand/section instructions.
COMPONENT_REPLACEMENTS = {
    'art-direction.md': ['component-design.md'],
    'design-record.md': ['component-record.md'],
    'content-and-finish.md': ['component-design.md'],
}

def compile_packet(stage, motion=False, assets=False, root=ROOT, research_source='auto', project=None, profile='complete'):
    if research_source not in SOURCES:
        raise ValueError(f'Unknown research source: {research_source}')
    root = Path(root).resolve()
    if profile not in ('complete', 'focused'): raise ValueError('Unknown packet profile: ' + profile)
    focused = profile == 'focused'
    decisions = []
    helpers = project.get('motion_helpers', []) if project else []
    if not isinstance(helpers, list) or any(not isinstance(h, str) for h in helpers) or len(set(helpers)) != len(helpers) or any(h not in MOTION_HELPERS for h in helpers):
        raise ValueError('motion_helpers must name distinct supported helpers: ' + ', '.join(MOTION_HELPERS))
    if helpers and project.get('motion') == 'none':
        raise ValueError('Selected motion helpers conflict with motion: none')
    if project is not None:
        if project.get('media') not in ('needed', 'none', 'undecided') or project.get('motion') not in ('signature', 'feedback', 'none', 'undecided'):
            raise ValueError('Project requires explicit media and motion needs; use undecided when unknown')
        # Asset-dependent concepts and choreography must be informed before selection.
        if stage in ('research', 'plan', 'prototype', 'type', 'surface', 'build', 'refine'):
            if project['media'] != 'none': assets = True; decisions.append('Material guidance loaded before committing to image-led direction')
            if project['motion'] != 'none' and stage != 'type': motion = True; decisions.append('Motion direction available during planning')
        if stage == 'type': assets = True; decisions.append('Actual typography shortlist guidance selected')
    selected = (FOCUSED_STAGES if focused else STAGES)[stage]
    component = project is not None and project.get('scope') == 'component'
    if component:
        selected = [name for p in selected for name in COMPONENT_REPLACEMENTS.get(p,[p])]
        decisions.append('Component-specific guides replace website argument, hero and page-record guidance')
    paths = ([root / 'references/working-contract.md'] if focused else [root / 'SKILL.md']) + [root / 'references' / p for p in selected]
    if component and stage == 'plan':
        paths += [root / 'references/component-record.md', root / 'references/color-decisions.md']
        decisions.append('Resolve inherited versus invented color identity before component concepts')
    if project is not None and project.get('scope') == 'component':
        paths += [root / 'references/component-design.md']
        decisions.append('Component scope: preserve its containing context and states; do not silently expand into a landing page')
    if project is not None and project.get('scope') == 'system':
        paths += [root / 'references/system-design.md']
        decisions.append('System scope: carry shared decisions and journey context; a finished slice does not certify the whole application')
    lesson_evidence = None
    lesson_stages = ('type', 'surface', 'prototype', 'refine') if focused else ('plan', 'type', 'surface', 'prototype', 'compare', 'review', 'refine')
    explicit_lesson_stage = project is not None and bool(project.get('decisions')) and stage in ('plan', 'wireframe', 'type', 'surface', 'prototype', 'compare', 'build', 'review', 'refine')
    if project is not None and (stage in lesson_stages or explicit_lesson_stage):
        import importlib.util
        spec = importlib.util.spec_from_file_location('seenry_lesson_packet', root / 'scripts/lesson_packet.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        topics = project.get('decisions') or (['hierarchy'] if stage == 'type' else
            ['state', 'controls'] if project.get('scope') == 'component' else ['hierarchy', 'color'])
        lesson_evidence = module.select(topics, root / 'references/lessons')
        paths += [root / 'references/visual-lessons.md']
        decisions.append('Selected actual lesson renders; host must provide image inspection and record observed reads')
    if stage == 'research' or (not focused and research_source in ('local', 'web')):
        paths += [root / 'references/without-mcp.md']
    if stage == 'research' and research_source in ('auto', 'mcp'):
        paths += [root / 'references/research.md']
    if stage == 'research' and research_source in ('local', 'web'):
        paths += [root / 'references/visual-decisions.md', root / 'references/hci-decisions.md']
    if motion:
        motion_root = root.parent / 'seenry-motion'
        if not focused: paths += [motion_root / 'SKILL.md']
        if stage in ('research','plan') and (not project or project['motion'] != 'feedback'):
            paths += [motion_root / 'references/worked-scores.md']
        else:
            paths += [motion_root / 'references/motion-craft.md']
        if stage in ('surface', 'build', 'review', 'refine'):
            paths += [motion_root / 'references/adapters.md']
            if not project or project['motion'] != 'feedback':
                paths += [motion_root / 'references/scroll-choreography.md']
    if 'number' in helpers and stage == 'plan':
        paths += [root.parent / 'seenry-motion/references/number-transitions.md']
    selected_helper_files = []
    stage_helpers = helpers if stage in ('prototype', 'surface', 'build', 'refine') else (['number'] if stage == 'type' and 'number' in helpers else [])
    if stage_helpers:
        motion_root = root.parent / 'seenry-motion'
        paths += [motion_root / 'references/adapters.md']
        for helper in stage_helpers:
            paths += [motion_root / 'assets' / p for p in MOTION_HELPERS[helper]]
            selected_helper_files += [motion_root / 'assets' / p for p in MOTION_HELPERS[helper]]
            if helper == 'number':
                paths += [motion_root / 'references/number-transitions.md']
            if helper in ('morph-icon','number'):
                vendor = motion_root / ('assets/morphicons' if helper == 'morph-icon' else 'assets/number-flow')
                manifest = vendor / 'manifest.json'
                metadata = json.loads(manifest.read_text(encoding='utf-8'))
                selected_helper_files += [manifest]
                for entry in metadata['files']:
                    dep = (vendor / entry['file']).resolve()
                    if not dep.is_relative_to(vendor.resolve()): raise ValueError('Helper dependency escapes its runtime')
                    if hashlib.sha256(dep.read_bytes()).hexdigest() != entry['sha256']:
                        raise ValueError('Helper runtime differs from pinned manifest: ' + entry['file'])
                    selected_helper_files.append(dep)
        decisions.append('Selected helper APIs and authored source included; host must copy listed runtime files with licenses before code uses them')
    if assets:
        if not focused: paths += [root.parent / 'seenry-assets/SKILL.md']
        if stage == 'type':
            paths += [root.parent / 'seenry-assets/assets/type.example.json']
        if stage in ('research', 'plan'):
            paths += [root.parent / 'seenry-assets/assets/candidates.example.json']
        if stage in ('research','plan','surface','build','review','refine'):
            paths += [root.parent / ('seenry-assets/references/object-material.md' if component else 'seenry-assets/references/material-production.md')]
    if stage in ('type','surface','build','refine'):
        paths += [root / 'references/design-continuity.md']
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
    entry = root / 'SKILL.md'
    runtime_files = []
    for path in dict.fromkeys(selected_helper_files):
        if path.is_dir(): continue
        if not path.is_file(): raise FileNotFoundError(f'Missing helper runtime: {path}')
        runtime_files.append({'path': path.relative_to(root.parent).as_posix(), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    return {'schema': 5, 'stage': stage, 'profile': profile, 'evidence': 'supplied-only', 'routing_decisions': decisions,
            'entrypoint': {'path': entry.relative_to(root.parent).as_posix(), 'sha256': hashlib.sha256(entry.read_bytes()).hexdigest(), 'body_supplied': not focused},
            'visual_lessons': lesson_evidence,
            'project_decisions': project,
            'runtime_files': runtime_files,
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
    parser.add_argument('--profile', choices=('complete', 'focused'), default='complete', help='Focused is an experimental smaller stage packet; the host must already load the entrypoint')
    args = parser.parse_args()
    try:
        project = json.loads(args.project.read_text(encoding='utf-8')) if args.project else None
        print(json.dumps(compile_packet(args.stage, args.motion, args.assets, research_source=args.research_source, project=project, profile=args.profile), ensure_ascii=False, indent=2))
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, str(exc) + '\n')
