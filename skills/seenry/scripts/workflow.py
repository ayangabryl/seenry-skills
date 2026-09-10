"""Append verified artifact snapshots to a Seenry run. Not a visual judge or sandbox."""
import argparse
import hashlib
import importlib.util
import json
import math
import shutil
import time
from pathlib import Path

ORDER = ('understand', 'research', 'plan', 'wireframe', 'type', 'surface', 'compare', 'build', 'review')
ROLES = {
    'understand': {'brief': 1}, 'research': {'study': 1}, 'plan': {'concepts': 1},
    'wireframe': {'source': 1, 'render': 3}, 'type': {'source': 1, 'render': 1},
    'surface': {'source': 1, 'render': 3}, 'compare': {'judgment': 1},
    'build': {'source': 1}, 'review': {'render': 2, 'functional': 1, 'judgment': 1},
}


def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def disposition(report, root):
    spec = importlib.util.spec_from_file_location('seenry_review_disposition', Path(__file__).with_name('review_gate.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.evaluate(report, root)


def media_kind(path):
    with path.open('rb') as stream: header = stream.read(32)
    if header.startswith(b'\x89PNG\r\n\x1a\n') or header.startswith(b'\xff\xd8\xff') or (header.startswith(b'RIFF') and header[8:12] == b'WEBP'): return 'image'
    if header.startswith(b'\x1a\x45\xdf\xa3') or header[4:8] == b'ftyp': return 'recording'
    return 'other'


def load_run(root):
    data = json.loads((root / 'run.json').read_text(encoding='utf-8'))
    # A file edited after capture is invalid evidence, even if the record says pass.
    for event in data['events']:
        for item in event['evidence']:
            path = (root / item['snapshot']).resolve()
            if not path.is_relative_to(root.resolve()) or not path.is_file() or digest(path) != item['sha256']:
                raise ValueError('Changed or missing historical evidence: ' + item['snapshot'])
    return data


def initialize(root, project):
    if root.exists() and any(root.iterdir()): raise ValueError('Use a new empty run directory')
    for field in ('brief', 'model', 'research_source', 'scope', 'media', 'motion'):
        if not isinstance(project.get(field), str) or not project[field].strip(): raise ValueError('Missing project field: ' + field)
    budget = project.get('budget_seconds', 2400)
    if type(budget) not in (int, float) or not math.isfinite(budget) or budget <= 0: raise ValueError('Budget must be a positive finite duration')
    if project['media'] not in ('needed', 'none', 'undecided'): raise ValueError('Invalid media need')
    if project['motion'] not in ('signature', 'feedback', 'none', 'undecided'): raise ValueError('Invalid motion need')
    if project['research_source'] not in ('auto', 'mcp', 'web', 'local'): raise ValueError('Invalid research route')
    root.mkdir(parents=True, exist_ok=True)
    data = {'schema': 2, 'project': project, 'started': time.time(), 'events': [],
            'resets': 0, 'repairs': 0, 'status': 'in-progress',
            'limitations': ['Protocol evidence is not proof of taste, model identity or human acceptance.']}
    save(root, data)
    return data


def save(root, data):
    temporary = root / 'run.json.tmp'
    temporary.write_text(json.dumps(data, indent=2), encoding='utf-8')
    temporary.replace(root / 'run.json')


def record(root, stage, submission):
    data = load_run(root)
    if time.time() - data['started'] > data['project'].get('budget_seconds', 2400):
        data['status'] = 'incomplete-budget'; save(root, data)
        raise ValueError('Run budget exhausted; evidence remains available, start a separately labeled continuation')
    events = data['events']
    previous = events[-1]['stage'] if events else None
    expected = ORDER[ORDER.index(previous) + 1] if previous and previous != 'review' else ('understand' if previous is None else None)
    reset = previous in ('compare', 'review') and stage == 'plan'
    repair = (previous == 'review' and stage == 'build') or (previous == 'compare' and stage == 'surface' and data.get('schema', 1) >= 2)
    refresh = data.get('schema', 1) >= 2 and previous in ('compare', 'review') and stage == previous and submission.get('mode') == 'evidence-refresh'
    if refresh:
        source_event = next((e for e in reversed(events) if e['stage'] in ('surface', 'build')), None)
        sources = [e for e in source_event['evidence'] if e['role'] == 'source'] if source_event else []
        if not sources:
            raise ValueError('Evidence refresh needs a recorded source to verify')
        for source in sources:
            current = (root / source['original']).resolve()
            if not current.is_relative_to(root.resolve()) or not current.is_file() or digest(current) != source['sha256']:
                raise ValueError('Source changed; use a repair stage instead of evidence refresh')
    elif reset:
        if data['resets'] >= 1: raise ValueError('Direction reset exhausted')
    elif repair:
        if data['repairs'] >= 2: raise ValueError('Repair passes exhausted')
    elif stage != expected:
        raise ValueError(f'Expected {expected}, received {stage}')
    if data.get('schema', 1) >= 2 and previous == 'compare' and stage == 'build':
        if (events[-1].get('review_disposition') or {}).get('status') != 'ready-for-human-review':
            raise ValueError('Comparison is not cleared. Repair the surface and compare again, or use the direction reset; continue_with is not acceptance.')
    if stage not in ROLES: raise ValueError('Unknown stage')
    if not isinstance(submission.get('observation'), str) or not submission['observation'].strip():
        raise ValueError('Record the observable outcome, not only file paths')
    requirements = dict(ROLES[stage])
    project = data['project']
    if stage == 'research' and project['media'] != 'none': requirements['material'] = 1
    if stage == 'plan' and project['motion'] in ('signature', 'undecided'): requirements['score'] = 1
    if stage == 'surface' and project['media'] != 'none': requirements['crop'] = 1
    if stage == 'review' and project['motion'] == 'signature': requirements['recording'] = 1
    artifacts = submission.get('artifacts', {})
    unavailable = submission.get('unavailable', {})
    prepared = []
    for role, count in requirements.items():
        paths = artifacts.get(role, [])
        if len(paths) < count and not unavailable.get(role):
            raise ValueError(f'{stage}: {role} needs {count} artifacts or an explicit unavailable reason')
    for role, paths in artifacts.items():
        if not isinstance(paths, list): raise ValueError('Artifact roles contain path lists')
        if not role.replace('-', '').isalnum(): raise ValueError('Invalid artifact role')
        for value in paths:
            path = (root / value).resolve()
            if not path.is_relative_to(root.resolve()) or not path.is_file() or path.stat().st_size == 0:
                raise ValueError('Use an existing nonempty artifact inside this run: ' + str(value))
            if role in ('render', 'crop') and media_kind(path) != 'image':
                raise ValueError('A render/crop needs PNG, JPEG or WebP evidence, not written claims')
            if role == 'recording' and media_kind(path) != 'recording':
                raise ValueError('Recording evidence needs an MP4 or WebM file')
            prepared.append((role, path))
    if refresh:
        old_hashes = {item['sha256'] for event in events for item in event['evidence']}
        if not any(role in ('render', 'crop', 'recording', 'functional', 'evidence') and digest(path) not in old_hashes for role, path in prepared):
            raise ValueError('Evidence refresh needs a new observation artifact, not only another judgment')
    if stage == 'plan':
        concept_paths = artifacts.get('concepts', [])
        if concept_paths:
            concepts = json.loads((root / concept_paths[0]).read_text(encoding='utf-8'))
            if not isinstance(concepts, list) or len(concepts) != 3: raise ValueError('Plan needs three concept records')
            for concept in concepts:
                if any(not isinstance(concept.get(k), str) or not concept[k].strip() for k in ('id', 'idea', 'evidence', 'risk')):
                    raise ValueError('Each concept needs id, idea, evidence and risk')
            if len({c['id'] for c in concepts}) != 3: raise ValueError('Concept ids must differ')
    judged = None
    if data.get('schema', 1) >= 2 and stage in ('compare', 'review'):
        judgments = artifacts.get('judgment', [])
        if judgments:
            if len(judgments) != 1: raise ValueError('Use one canonical five-criterion judgment per comparison or review')
            judged = disposition(json.loads((root / judgments[0]).read_text(encoding='utf-8')), root)
            # Preserve the exact cited evidence as well as the review that refers to it.
            included = {path for _, path in prepared}
            for citation in judged['evidence']:
                path = (root / citation['artifact']).resolve()
                if path not in included:
                    prepared.append(('judgment-citation', path)); included.add(path)
    index = len(events)
    folder = root / 'history' / f'{index:02d}-{stage}'
    if folder.exists(): raise ValueError('Historical snapshot already exists; investigate interrupted write')
    folder.mkdir(parents=True)
    evidence = []
    try:
        for number, (role, path) in enumerate(prepared):
            target = folder / f'{number:02d}-{role}{path.suffix}'
            shutil.copyfile(path, target)
            evidence.append({'role': role, 'original': path.relative_to(root.resolve()).as_posix(),
                             'snapshot': target.relative_to(root).as_posix(), 'sha256': digest(target)})
        event = {'stage': stage, 'time': time.time(), 'observation': submission['observation'],
                 'evidence': evidence, 'unavailable': unavailable,
                 'guidance': submission.get('guidance', {'supplied': [], 'observed_loaded': [], 'applied': []}),
                 'checks': submission.get('checks', {}), 'reviewer': submission.get('reviewer', 'not-recorded')}
        if data.get('schema', 1) >= 2:
            event['review_disposition'] = judged
            if refresh: event['mode'] = 'evidence-refresh'
        events.append(event)
        data['resets'] += int(reset); data['repairs'] += int(repair)
        current_stages = {e['stage']: e for e in events}
        gaps = any(e['unavailable'] for e in (current_stages.values() if data.get('schema', 1) >= 2 else events))
        checks = event['checks']
        ready = stage == 'review' and not gaps and all(checks.get(k) == 'pass' for k in ('functional', 'visual', 'motion', 'material')) and event['reviewer'] != 'not-recorded'
        if data.get('schema', 1) >= 2:
            ready = ready and bool(judged and judged['status'] == 'ready-for-human-review')
        data['status'] = 'ready-for-human-review' if ready else ('needs-revision' if stage == 'review' else 'in-progress')
        if data.get('schema', 1) >= 2 and stage == 'compare' and (not judged or judged['status'] != 'ready-for-human-review'):
            data['status'] = 'needs-prototype-revision'
        data['elapsed_seconds'] = time.time() - data['started']
        if data['elapsed_seconds'] > project.get('budget_seconds', 2400): data['status'] = 'incomplete-budget'
        save(root, data)
    except Exception:
        shutil.rmtree(folder)
        raise
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('init', 'record', 'status'))
    parser.add_argument('root', type=Path)
    parser.add_argument('--project', type=Path); parser.add_argument('--stage', choices=ORDER); parser.add_argument('--submission', type=Path)
    args = parser.parse_args(); root = args.root.resolve()
    try:
        if args.command == 'init': result = initialize(root, json.loads(args.project.read_text(encoding='utf-8')))
        elif args.command == 'record': result = record(root, args.stage, json.loads(args.submission.read_text(encoding='utf-8')))
        else: result = load_run(root)
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, TypeError, AttributeError, KeyError) as error: parser.exit(1, str(error) + '\n')


if __name__ == '__main__': main()
