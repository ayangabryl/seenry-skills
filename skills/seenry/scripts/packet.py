"""Print a focused Seenry stage packet. Supplied text is not proof of application."""
import argparse, hashlib, json, sys
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
DEPENDENCIES = {'visual-review.md': ['visual-lessons.md', 'review-evidence.md'], 'component-design.md': ['content-model.md', 'component-finish.md']}
SOURCES = {
    'auto': 'Use an available evidence route; MCP is optional. Record the actual route.',
    'mcp': 'Use connected MCP for research; if unavailable report it and explicitly change route.',
    'web': 'Do not call MCP. Use ordinary permitted browsing and supplied material.',
    'local': 'Do not use MCP or network. Use supplied local material and bundled guides. Record unverified current facts.',
}
MOTION_HELPERS = {
    'selection-surface': ['selection-surface.mjs', 'selection-surface.css'],
    'anchored-surface': ['anchored-surface.mjs'],
    'geometry': ['geometry-transition.mjs'],
    'icon-swap': ['icon-swap.mjs'],
    'morph-icon': ['morph-icon.mjs'],
    'lottie': ['lottie-toggle.mjs'],
    'scroll': ['scroll-scene.mjs'],
    'number': ['number-transition.mjs'],
}
GUIDE_TOPICS = ('subject-fit', 'convergence', 'brand-guidelines', 'marketing-evidence')
FOCUSED_STAGES = {
    'understand': ['design-record.md'],
    'research': ['reference-standards.md'],
    'plan': ['art-direction.md'],
    'wireframe': ['art-direction.md'],
    'type': ['visual-decisions.md'],
    'surface': ['visual-decisions.md'],
    'prototype': ['content-and-finish.md', 'visual-decisions.md'],
    'compare': ['visual-review.md'],
    'build': ['design-record.md', 'visual-decisions.md'],
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

CRAFT_DECISIONS = ('layout', 'typography', 'color', 'controls', 'motion', 'art-direction')
DECISION_STUDIES = {'attention': 'attention', 'expression': 'color', 'comparison': 'layout'}


def marketing_resources(stage, root, project, decision=None):
    """Opt-in website argument guidance, without taxing unrelated craft fixes."""
    if not project or project.get('scope') == 'component':
        return []
    topics = project.get('guide_topics', [])
    if not isinstance(topics, list) or 'marketing-evidence' not in topics:
        return []
    if decision is not None and decision != 'art-direction':
        return []
    if stage not in ('understand', 'plan', 'wireframe', 'prototype', 'build', 'compare', 'review', 'refine'):
        return []
    return [root / 'references/marketing-evidence.md']


def study_resources(root, project):
    """One explicit teaching case. Never download or silently choose a brand skin."""
    study = project.get('decision_study') if project else None
    if study is None:
        return []
    if not isinstance(study, str) or study not in DECISION_STUDIES:
        raise ValueError('decision_study must be attention, expression or comparison')
    return [root / 'references/studies' / (study + '.md'),
            root / 'assets/craft' / (DECISION_STUDIES[study] + '.html')]

def selected_patterns(root, project):
    names = project.get('motion_patterns', []) if project else []
    if not isinstance(names, list) or any(not isinstance(n, str) for n in names) or len(set(names)) != len(names):
        raise ValueError('motion_patterns must be distinct supported identifiers')
    if not names: return [], []
    if project.get('motion') == 'none':
        raise ValueError('Selected motion patterns conflict with motion: none')
    folder = root.parent / 'seenry-motion/references/patterns'
    catalog = json.loads((folder / 'catalog.json').read_text(encoding='utf-8'))
    paths, helpers = [], []
    for name in names:
        if name not in catalog: raise ValueError('Unknown motion pattern: ' + name)
        entry = catalog[name]
        path = (folder / entry['guide']).resolve()
        if not path.is_relative_to(folder.resolve()): raise ValueError('Pattern guide escapes its directory')
        paths.append(path); helpers += entry['helpers']
    return list(dict.fromkeys(paths)), list(dict.fromkeys(helpers))


def selected_motion_files(root, project):
    """Resolve explicitly requested helpers, including their pinned runtime closure."""
    helpers = project.get('motion_helpers', []) if project else []
    pattern_paths, pattern_helpers = selected_patterns(root, project)
    if not isinstance(helpers, list) or any(not isinstance(h, str) or h not in MOTION_HELPERS for h in helpers) or len(set(helpers)) != len(helpers):
        raise ValueError('motion_helpers must name distinct supported helpers: ' + ', '.join(MOTION_HELPERS))
    if helpers and project.get('motion') == 'none':
        raise ValueError('Selected motion helpers conflict with motion: none')
    helpers = list(dict.fromkeys(helpers + pattern_helpers))
    paths, runtime = pattern_paths, []
    motion_root = root.parent / 'seenry-motion'
    if helpers: paths.append(motion_root / 'references/adapters.md')
    if any(h in ('selection-surface', 'anchored-surface') for h in helpers):
        paths.append(motion_root / 'references/system-choreography.md')
    if any(h in ('geometry', 'icon-swap', 'morph-icon', 'number') for h in helpers):
        paths.append(motion_root / 'references/product-transitions.md')
    for helper in helpers:
        sources = [motion_root / 'assets' / name for name in MOTION_HELPERS[helper]]
        paths += sources; runtime += sources
        if helper == 'number': paths.append(motion_root / 'references/number-transitions.md')
        if helper == 'scroll': paths.append(motion_root / 'references/scroll-choreography.md')
        if helper in ('morph-icon','number'):
            vendor = motion_root / ('assets/morphicons' if helper == 'morph-icon' else 'assets/number-flow')
            manifest = vendor / 'manifest.json'
            metadata = json.loads(manifest.read_text(encoding='utf-8')); runtime.append(manifest)
            for entry in metadata['files']:
                dep = (vendor / entry['file']).resolve()
                if not dep.is_relative_to(vendor.resolve()): raise ValueError('Helper dependency escapes its runtime')
                if hashlib.sha256(dep.read_bytes()).hexdigest() != entry['sha256']:
                    raise ValueError('Helper runtime differs from pinned manifest: ' + entry['file'])
                runtime.append(dep)
    return paths, runtime

def feedback_resources(root, project):
    feedback = project.get('feedback', []) if project else []
    if not isinstance(feedback, list) or any(not isinstance(f, dict) or any(not isinstance(f.get(k), str) or not f[k].strip() for k in ('finding', 'state', 'check')) for f in feedback):
        raise ValueError('feedback must be records with nonempty finding, state and check strings')
    return [root / 'references/feedback-gate.md'] if feedback else []

def compile_decision(stage, decision, root, research_source, project):
    """A bounded decision packet; examples are source to render, not proof of quality."""
    if stage not in STAGES:
        raise ValueError('Unknown stage: ' + str(stage))
    if decision not in CRAFT_DECISIONS:
        raise ValueError('Unknown decision: ' + str(decision))
    if project is not None and not isinstance(project, dict):
        raise ValueError('Project must be an object')
    if decision == 'motion' and project and project.get('motion') == 'none':
        raise ValueError('Motion decision conflicts with motion: none')
    paths = [root / 'references/working-contract.md',
             root / 'references/craft' / (decision + '.md'),
             root / 'assets/craft' / (decision + '.html')]
    if project and project.get('scope') == 'component' and decision in ('layout','typography','color','controls'):
        paths.insert(2, root / 'references/component-finish.md')
    paths += feedback_resources(root, project)
    paths += marketing_resources(stage, root, project, decision)
    selected_study = study_resources(root, project)
    if selected_study:
        # Replace the generic example with the selected case's working example.
        paths = [p for p in paths if p.suffix != '.html'] + selected_study
    helper_paths, helper_runtime = selected_motion_files(root, project)
    # A focused decision must not silently discard an explicit runtime selection.
    paths += helper_paths
    records = []
    for path in dict.fromkeys(paths):
        if not path.is_file():
            raise FileNotFoundError(f'Missing required resource: {path}')
        data = path.read_bytes()
        records.append({'path': path.relative_to(root.parent).as_posix(),
                        'sha256': hashlib.sha256(data).hexdigest(), 'content': data.decode('utf-8')})
    entry = root / 'SKILL.md'
    return {'schema': 5, 'stage': stage, 'profile': 'focused', 'decision': decision,
            'evidence': 'supplied-only',
            'routing_decisions': ['Supply the selected craft decision, one standalone example and declared supporting resources; render and judge applicability.'] + (['Explicit motion helpers include their source and pinned runtime dependency closure.'] if helper_runtime else []),
            'guidance_size': {'resources': len(records), 'words': sum(len(r['content'].split()) for r in records),
                              'bytes': sum(len(r['content'].encode()) for r in records),
                              'scope': 'Resource bodies including one example; excludes project and host context. No truncation.'},
            'entrypoint': {'path': entry.relative_to(root.parent).as_posix(),
                          'sha256': hashlib.sha256(entry.read_bytes()).hexdigest(), 'body_supplied': False},
            'visual_lessons': None, 'project_decisions': project,
            'runtime_files': [{'path': p.relative_to(root.parent).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in dict.fromkeys(helper_runtime)],
            'research_source': research_source, 'execution_constraint': SOURCES[research_source],
            'constraint_enforcement': 'host responsibility; this compiler does not sandbox tools',
            'resources': records}

def compile_replication(stage, decision, root, research_source, project, profile):
    if stage not in STAGES: raise ValueError('Unknown stage: ' + str(stage))
    if profile != 'focused': raise ValueError('Replication requires focused profile; complete remains a historical creative audit')
    if decision is not None and decision not in CRAFT_DECISIONS: raise ValueError('Unknown decision: ' + str(decision))
    if project.get('media') not in ('needed','none','undecided') or project.get('motion') not in ('signature','feedback','none','undecided'):
        raise ValueError('Project requires explicit media and motion needs')
    # Creative case studies and art direction propose substitutions and must not be silently mixed in.
    if project.get('decision_study') or project.get('guide_topics'):
        raise ValueError('Replication uses source measurements; omit creative studies/topics/libraries and choose a motion_patterns mechanism')
    if decision == 'motion' and project['motion'] == 'none': raise ValueError('Motion decision conflicts with motion: none')
    paths = [root / 'references/working-contract.md', root / 'references/replication.md']
    if decision and decision != 'art-direction':
        paths.append(root / 'references/craft' / (decision + '.md'))
    if project['motion'] != 'none':
        paths.append(root.parent / 'seenry-motion/references/replication.md')
    if stage == 'research' and research_source in ('auto','mcp'):
        paths.append(root.parent / 'seenry-assets/references/seenry-media.md')
    paths += feedback_resources(root, project)
    helpers, runtime = selected_motion_files(root, project)
    paths += helpers
    records = []
    for path in dict.fromkeys(paths):
        data = path.read_bytes()  # Required files fail rather than returning a partial packet.
        records.append({'path':path.relative_to(root.parent).as_posix(), 'sha256':hashlib.sha256(data).hexdigest(), 'content':data.decode('utf-8')})
    entry = root / 'SKILL.md'
    return {'schema':5, 'stage':stage, 'profile':profile, 'decision':decision, 'intent':'replicate',
        'evidence':'supplied-only', 'routing_decisions':['Preserve inspected source geometry and behavior; no creative alternatives or generic example substitutes.', 'Record target, actual and uncertainty separately; passing checks is not visual approval.'],
        'guidance_size':{'resources':len(records), 'words':sum(len(r['content'].split()) for r in records), 'bytes':sum(len(r['content'].encode()) for r in records), 'scope':'Selected guidance only. No truncation; source media and observed reads are separate.'},
        'entrypoint':{'path':entry.relative_to(root.parent).as_posix(),'sha256':hashlib.sha256(entry.read_bytes()).hexdigest(),'body_supplied':False},
        'visual_lessons':None, 'project_decisions':project,
        'runtime_files':[{'path':p.relative_to(root.parent).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in dict.fromkeys(runtime)],
        'research_source':research_source, 'execution_constraint':SOURCES[research_source],
        'constraint_enforcement':'host responsibility; this compiler does not sandbox tools', 'resources':records}


def compile_packet(stage, motion=False, assets=False, root=ROOT, research_source=None, project=None, profile='focused', decision=None):
    if project is not None and not isinstance(project, dict):
        raise ValueError('Project must be an object')
    # An absent flag must not silently override the project's chosen evidence route.
    if research_source is None:
        research_source = project.get('research_source', 'auto') if project else 'auto'
    if research_source not in SOURCES:
        raise ValueError(f'Unknown research source: {research_source}')
    root = Path(root).resolve()
    intent = project.get('intent', 'create') if project else 'create'
    if intent not in ('create','refine','review','replicate'): raise ValueError('Unknown project intent: ' + str(intent))
    if intent == 'replicate': return compile_replication(stage, decision, root, research_source, project, profile)
    selected_patterns(root, project)  # Reject invalid or conflicting selectors on every route.
    feedback_paths = feedback_resources(root, project)
    selected_study = study_resources(root, project)
    if profile not in ('complete', 'focused'): raise ValueError('Unknown packet profile: ' + profile)
    if decision is not None:
        if profile != 'focused':
            raise ValueError('Decision selection requires focused profile; omit decision for historical complete packets')
        return compile_decision(stage, decision, root, research_source, project)
    focused = profile == 'focused'
    decisions = []
    guide_topics = project.get('guide_topics', []) if project else []
    if not isinstance(guide_topics, list) or any(not isinstance(t, str) for t in guide_topics) or len(set(guide_topics)) != len(guide_topics) or any(t not in GUIDE_TOPICS for t in guide_topics):
        raise ValueError('guide_topics must name distinct supported topics: ' + ', '.join(GUIDE_TOPICS))
    helpers = project.get('motion_helpers', []) if project else []
    if not isinstance(helpers, list) or any(not isinstance(h, str) for h in helpers) or len(set(helpers)) != len(helpers) or any(h not in MOTION_HELPERS for h in helpers):
        raise ValueError('motion_helpers must name distinct supported helpers: ' + ', '.join(MOTION_HELPERS))
    if helpers and project.get('motion') == 'none':
        raise ValueError('Selected motion helpers conflict with motion: none')
    if project is not None:
        if project.get('media') not in ('needed', 'none', 'undecided') or project.get('motion') not in ('signature', 'feedback', 'none', 'undecided'):
            raise ValueError('Project requires explicit media and motion needs; use undecided when unknown')
        # Asset-dependent concepts and choreography must be informed before selection.
        if stage in ('research', 'plan', 'prototype', 'type', 'surface', 'build', 'compare', 'review', 'refine'):
            if project['media'] != 'none': assets = True; decisions.append('Material guidance loaded before committing to image-led direction')
            if project['motion'] != 'none' and stage != 'type': motion = True; decisions.append('Motion direction available during planning')
        if stage == 'type': assets = True; decisions.append('Actual typography shortlist guidance selected')
    selected = (FOCUSED_STAGES if focused else STAGES)[stage]
    component = project is not None and project.get('scope') == 'component'
    if component:
        selected = [name for p in selected for name in COMPONENT_REPLACEMENTS.get(p,[p])]
        decisions.append('Component-specific guides replace website argument, hero and page-record guidance')
    paths = ([root / 'references/working-contract.md'] if focused else [root / 'SKILL.md']) + [root / 'references' / p for p in selected]
    paths += marketing_resources(stage, root, project)
    diagnosis_topics = [topic for topic in guide_topics if topic in ('subject-fit', 'convergence')]
    if diagnosis_topics and stage in ('plan', 'prototype', 'compare', 'review', 'refine'):
        paths += [root / 'references/quality-diagnosis.md']
        if 'subject-fit' in guide_topics and stage in ('plan', 'prototype', 'refine'):
            paths += [root / 'references' / ('component-design.md' if component else 'art-direction.md')]
        decisions.append('Selected decision guides for: ' + ', '.join(diagnosis_topics) + '; rendered lessons remain separately selected')
    if 'brand-guidelines' in guide_topics and stage in ('plan', 'type', 'prototype', 'surface', 'build', 'review', 'refine'):
        paths += [root.parent / 'seenry-branding/references/project-guidelines.md']
        decisions.append('Selected project brand guideline guidance; preserve the supplied shared decisions and use the template only when needed')
    if component and stage == 'plan':
        paths += [root / 'references/component-record.md']
        if not focused:
            paths += [root / 'references/color-decisions.md', root / 'references/studies/component-family.md']
        decisions.append('Plan the component in its host; inherited identity precedes invented color')
    if component and not focused:
        paths += [root / 'references/component-design.md']
        decisions.append('Component scope: preserve its containing context and states; do not silently expand into a landing page')
    if project is not None and project.get('scope') == 'system':
        paths += [root / 'references/system-design.md']
        decisions.append('System scope: carry shared decisions and journey context; a finished slice does not certify the whole application')
    lesson_evidence = None
    # Both profiles exclude historical screenshots; examples are explicitly selected.
    lesson_stages = ()
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
        for lesson in lesson_evidence['lessons']:
            paths += [root / resource['path'] for resource in lesson['resources']]
        decisions.append('Selected technical exercise source only; no archived reference images or human preference labels supplied')
    if stage == 'research' or (not focused and research_source in ('local', 'web')):
        paths += [root / 'references/without-mcp.md']
    if stage == 'research' and research_source in ('auto', 'mcp'):
        paths += [root / 'references/research.md', root.parent / 'seenry-assets/references/seenry-media.md']
    if stage == 'research' and research_source in ('local', 'web'):
        paths += [root / 'references/visual-decisions.md', root / 'references/hci-decisions.md']
    if focused and project and 'color' in (project.get('decisions') or []) and stage in ('plan','surface','prototype','refine'):
        paths += [root / 'references/color-decisions.md']
        decisions.append('Full color guide supplied for the explicitly unresolved color decision')
    if focused and project and 'export-feedback' in (project.get('decisions') or []) and stage in ('plan','type','surface','build','refine'):
        paths += [root / 'references/content-model.md']
        decisions.append('Content model retained for the explicitly selected duplicate-label and feedback regression')
    if motion:
        motion_root = root.parent / 'seenry-motion'
        if focused:
            paths += [motion_root / 'references/motion-contract.md']
            if stage in ('research','plan') and project and project['motion'] == 'signature':
                paths += [motion_root / 'references/worked-scores.md']
            if 'scroll' in helpers and stage in ('plan','surface','build','review','refine'):
                paths += [motion_root / 'references/scroll-choreography.md']
        else:
            paths += [motion_root / 'SKILL.md']
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
    if stage_helpers or (project and project.get('motion_patterns')):
        helper_paths, selected_helper_files = selected_motion_files(root, {**(project or {}), 'motion_helpers': stage_helpers})
        paths += helper_paths
        decisions.append('Selected helper APIs and authored source included; host must copy listed runtime files with licenses before code uses them')
    if assets:
        if not focused: paths += [root.parent / 'seenry-assets/SKILL.md']
        if stage == 'type':
            paths += [root.parent / 'seenry-assets/assets/type.example.json']
        if stage in ('research', 'plan'):
            paths += [root.parent / 'seenry-assets/assets/candidates.example.json']
        if stage in ('research','plan','surface','build','compare','review','refine'):
            paths += [root.parent / ('seenry-assets/references/object-material.md' if component else 'seenry-assets/references/material-production.md')]
    if stage in ('type','surface','build','refine'):
        paths += [root / 'references/design-continuity.md']
    paths += feedback_paths
    if selected_study:
        paths += selected_study
        decisions.append('One explicitly selected decision study with local working example; render before claiming visual inspection.')
    if feedback_paths: decisions.append('Explicit project feedback is supplied with its state and completion check; unchecked findings remain unresolved')
    # Resolve declared dependencies recursively; arbitrary prose links are progressive reading.
    pending = list(paths)
    seen = set()
    while pending:
        path = pending.pop(0)
        if path in seen: continue
        seen.add(path)
        dependencies = DEPENDENCIES.get(path.name, [])
        if focused and path.name in ('content-and-finish.md','visual-review.md'):
            dependencies = [d for d in dependencies if d == 'review-evidence.md']
        for dependency in dependencies:
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
            'guidance_size': {'resources': len(records), 'words': sum(len(r['content'].split()) for r in records),
                              'bytes': sum(len(r['content'].encode('utf-8')) for r in records),
                              'scope': 'Supplied resource bodies only; excludes project, image and host-contract payloads. No guidance was truncated.'},
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
    parser.add_argument('--research-source', choices=SOURCES, default=None, help='Explicit override; otherwise use project research_source, then auto')
    parser.add_argument('--project', type=Path, help='JSON with media and motion needs; enables automatic early support')
    parser.add_argument('--profile', choices=('complete', 'focused'), default='focused', help='Focused supplies the current decision; the host first loads SKILL.md. Complete supplies broader guidance explicitly.')
    parser.add_argument('--decision', choices=CRAFT_DECISIONS, help='Supply only this decision and its working example; requires focused profile')
    args = parser.parse_args()
    try:
        # Packet JSON is UTF-8 on every platform, including redirected Windows output.
        sys.stdout.reconfigure(encoding='utf-8')
        project = json.loads(args.project.read_text(encoding='utf-8')) if args.project else None
        print(json.dumps(compile_packet(args.stage, args.motion, args.assets, research_source=args.research_source, project=project, profile=args.profile, decision=args.decision), ensure_ascii=False, indent=2))
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, str(exc) + '\n')
