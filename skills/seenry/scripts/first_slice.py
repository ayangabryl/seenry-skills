"""Append-only first-slice checkpoint for original Seenry work.

Supply captures made by a browser tool or browser_evidence.mjs. Each stage freezes
its inputs before asking the existing independent gates for a verdict. A missing
reviewer, malformed report, or changed source is Unverified, never a pass.
For slice, point --source-root at the smallest tree containing the rendered UI:
recognized source and asset files count, while generated and review evidence does
not. A broad monorepo root may exceed the explicit source-file limit.
"""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIRECTION_GATE = HERE / 'direction_study_gate.py'
FIRST_SCREEN_GATE = HERE / 'independent_review_gate.py'
IMAGES = {'.png', '.jpg', '.jpeg', '.webp'}
STUDIES = ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile')
SOURCE_SUFFIXES = {'.html', '.css', '.scss', '.sass', '.less', '.js', '.jsx', '.mjs',
                   '.cjs', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.json', '.md',
                   '.mdx', '.py', '.php', '.rb', '.go', '.rs', '.liquid', '.njk', '.hbs',
                   '.yaml', '.yml', '.toml', '.xml', '.svg', '.png', '.jpg', '.jpeg',
                   '.webp', '.gif', '.avif', '.woff', '.woff2', '.ttf', '.otf'}
EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
                 'coverage', '.cache', '.turbo', 'out', 'target', '__pycache__',
                 '.venv', 'venv', 'vendor', 'test-results', 'playwright-report'}
ROOT_EXCLUDED_DIRS = {'evidence', 'studies', 'captures', 'reviews', 'review',
                      'reports', 'report', 'gate-reports', 'evaluation', 'evaluations',
                      'tests', 'test', '__tests__'}
EXCLUDED_FILES = {'evaluation.md'}
MAX_SOURCE_FILES = 4096
MAX_SOURCE_FILE_BYTES = 32 * 1024 * 1024


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(run, record):
    temporary = run / 'manifest.json.tmp'
    temporary.write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    temporary.replace(run / 'manifest.json')


def load(run):
    path = run / 'manifest.json'
    if not path.is_file():
        raise ValueError(f'No checkpoint at {run}; run init first')
    return json.loads(path.read_text(encoding='utf-8'))


def freeze(source, target, image=False):
    source = source.resolve()
    if not source.is_file():
        raise ValueError(f'Missing input: {source}')
    if image and source.suffix.lower() not in IMAGES:
        raise ValueError(f'Expected PNG, JPEG or WebP image: {source}')
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return {'source': str(source), 'copy': str(target), 'sha256': digest(target)}


def check(items):
    for name, item in items.items():
        for key in ('copy', 'source'):
            path = Path(item[key])
            if not path.is_file() or digest(path) != item['sha256']:
                raise ValueError(f'Stale or missing {name} {key}: {path}')


def source_snapshot(root, run):
    """Hash a bounded, portable set of UI source and local asset files."""
    root = root.resolve()
    if not root.is_dir():
        raise ValueError(f'Missing source root: {root}')
    files = []
    for current, directories, names in os.walk(root, followlinks=False):
        current_path = Path(current)
        directories[:] = sorted(name for name in directories
                                if name.lower() not in EXCLUDED_DIRS
                                and not (current_path == root and name.lower() in ROOT_EXCLUDED_DIRS)
                                and not (current_path / name).is_symlink()
                                and not (current_path / name).resolve().is_relative_to(run))
        for name in sorted(names):
            path = current_path / name
            if name.lower() in EXCLUDED_FILES or path.suffix.lower() not in SOURCE_SUFFIXES or path.is_symlink():
                continue
            if path.resolve().is_relative_to(run):
                continue
            size = path.stat().st_size
            if size > MAX_SOURCE_FILE_BYTES:
                raise ValueError(f'Source file exceeds {MAX_SOURCE_FILE_BYTES} bytes: {path}')
            files.append({'path': path.relative_to(root).as_posix(), 'size': size,
                          'sha256': digest(path)})
            if len(files) > MAX_SOURCE_FILES:
                raise ValueError(f'Source scope exceeds {MAX_SOURCE_FILES} files; choose a narrower --source-root')
    if not files:
        raise ValueError(f'No UI source files found under {root}')
    files.sort(key=lambda item: item['path'])
    return {'root': str(root), 'scope': 'UI source and local assets by suffix',
            'included_suffixes': sorted(SOURCE_SUFFIXES),
            'excluded_directories': sorted(EXCLUDED_DIRS),
            'excluded_root_directories': sorted(ROOT_EXCLUDED_DIRS),
            'excluded_files': sorted(EXCLUDED_FILES),
            'max_files': MAX_SOURCE_FILES, 'max_file_bytes': MAX_SOURCE_FILE_BYTES,
            'files': files}


def source_digest(snapshot):
    return hashlib.sha256(json.dumps(snapshot, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def verify_slice(run, record, attempt):
    try:
        if attempt['selection']['study_attempt'] != len(record['studies']):
            raise ValueError('A newer direction study superseded this slice')
        if record['selection'] != attempt['selection']:
            raise ValueError('Study selection changed since slice capture')
        check(record['inputs'])
        check(record['studies'][attempt['selection']['study_attempt'] - 1]['captures'])
        check(attempt['captures'])
        source = attempt['source']
        saved = json.loads(Path(source['manifest']).read_text(encoding='utf-8'))
        if source_digest(saved) != source['sha256']:
            raise ValueError('Source manifest changed')
        current = source_snapshot(Path(source['root']), run)
        if source_digest(current) != source['sha256']:
            raise ValueError('Project source changed since slice capture')
    except (OSError, ValueError, KeyError, IndexError) as exc:
        attempt['status'] = 'Stale'
        attempt['reason'] = str(exc)
    else:
        attempt['status'] = attempt['gate_status']
        attempt['reason'] = attempt.get('gate_reason', '')
    attempt['verified_utc'] = datetime.now(timezone.utc).isoformat()
    return attempt['status']


def next_attempt(run, kind):
    root = run / kind
    root.mkdir(exist_ok=True)
    index = len(list(root.glob('[0-9][0-9][0-9]'))) + 1
    folder = root / f'{index:03d}'
    folder.mkdir()
    return folder


def gate_result(command, output, expected):
    completed = subprocess.run(command, text=True, capture_output=True, check=False)
    (output.parent / 'gate.stdout.log').write_text(completed.stdout, encoding='utf-8')
    (output.parent / 'gate.stderr.log').write_text(completed.stderr, encoding='utf-8')
    summary_file = output / 'summary.json'
    status = 'Unverified'
    reason = f'Gate exited {completed.returncode} without a valid Keep summary'
    if summary_file.is_file():
        try:
            summary = json.loads(summary_file.read_text(encoding='utf-8'))
            actual = summary['input_sha256']
            if any(actual.get(name) != value for name, value in expected.items()):
                reason = 'Gate summary does not match frozen inputs'
            elif completed.returncode == 0 and summary.get('status') == 'Keep':
                status, reason = 'Keep', ''
            else:
                status = summary.get('status', 'Unverified')
                if status not in {'Revise', 'Reset', 'Unverified'}:
                    status = 'Unverified'
                reason = 'Gate did not return Keep'
        except (ValueError, KeyError, TypeError):
            reason = 'Gate summary is invalid'
    return status, reason


def init(args):
    run = args.run.resolve()
    if run.exists():
        raise ValueError(f'Run already exists: {run}')
    run.mkdir(parents=True)
    if not args.decision.strip():
        raise ValueError('Decision must be nonempty')
    inputs = {'brief': freeze(args.brief, run / 'frozen' / 'brief.md')}
    decision = run / 'frozen' / 'decision.md'
    decision.write_text(args.decision.strip() + '\n', encoding='utf-8')
    inputs['decision'] = {'source': str(decision), 'copy': str(decision), 'sha256': digest(decision)}
    if args.reference:
        inputs['reference'] = freeze(args.reference, run / 'frozen' / 'reference.md')
    if args.craft_reference_image:
        image = args.craft_reference_image
        inputs['craft-reference-image'] = freeze(
            image, run / 'frozen' / f'craft-reference{image.suffix.lower()}', image=True)
    record = {'version': 1, 'created_utc': datetime.now(timezone.utc).isoformat(),
              'inputs': inputs, 'studies': [], 'selection': None, 'slices': []}
    save(run, record)
    print(json.dumps({'status': 'Initialized', 'manifest': str(run / 'manifest.json')}))
    return 0


def studies(args):
    run = args.run.resolve()
    record = load(run)
    check(record['inputs'])
    folder = next_attempt(run, 'studies')
    captures = {name: freeze(getattr(args, name.replace('-', '_')),
                             folder / 'inputs' / f'{name}{getattr(args, name.replace("-", "_")).suffix.lower()}',
                             image=True) for name in STUDIES}
    attempt = {'status': 'Unverified', 'captures': captures, 'gate': str(folder / 'gate')}
    record['studies'].append(attempt)
    record['selection'] = None
    save(run, record)
    cmd = [sys.executable, str(DIRECTION_GATE), '--brief', record['inputs']['brief']['copy'],
           '--decision', Path(record['inputs']['decision']['copy']).read_text(encoding='utf-8').strip(),
           '--out', attempt['gate'], '--codex-bin', args.codex_bin]
    for name, item in captures.items():
        cmd += [f'--{name}', item['copy']]
    if 'reference' in record['inputs']:
        cmd += ['--reference', record['inputs']['reference']['copy']]
    if 'craft-reference-image' in record['inputs']:
        cmd += ['--craft-reference-image', record['inputs']['craft-reference-image']['copy']]
    expected = {'brief': record['inputs']['brief']['sha256'],
                'decision': record['inputs']['decision']['sha256'],
                **{name: item['sha256'] for name, item in captures.items()}}
    if 'reference' in record['inputs']:
        expected['reference'] = record['inputs']['reference']['sha256']
    if 'craft-reference-image' in record['inputs']:
        expected['craft-reference-image'] = record['inputs']['craft-reference-image']['sha256']
    attempt['status'], attempt['reason'] = gate_result(cmd, Path(attempt['gate']), expected)
    save(run, record)
    print(json.dumps({'status': attempt['status'], 'attempt': str(folder), 'reason': attempt['reason']}))
    return 0 if attempt['status'] == 'Keep' else 2


def select(args):
    run = args.run.resolve()
    record = load(run)
    check(record['inputs'])
    if not record['studies'] or record['studies'][-1]['status'] != 'Keep':
        raise ValueError('Latest direction study must have Keep before selection')
    check(record['studies'][-1]['captures'])
    if not args.task_anchor.strip():
        raise ValueError('Task anchor must be nonempty')
    if record['selection']:
        raise ValueError('Selection already recorded; submit a new study to change it')
    record['selection'] = {'study': args.study, 'task_anchor': args.task_anchor.strip(),
                           'study_attempt': len(record['studies']),
                           'selected_utc': datetime.now(timezone.utc).isoformat()}
    save(run, record)
    print(json.dumps({'status': 'Selected', **record['selection']}))
    return 0


def slice_review(args):
    run = args.run.resolve()
    record = load(run)
    check(record['inputs'])
    selection = record['selection']
    if not selection or selection['study_attempt'] != len(record['studies']):
        raise ValueError('Select a study after its Keep direction verdict before the slice')
    study = record['studies'][-1]
    if study['status'] != 'Keep':
        raise ValueError('Direction review is not Keep')
    check(study['captures'])
    project_source = source_snapshot(args.source_root, run)
    folder = next_attempt(run, 'slices')
    captures = {}
    for name in ('desktop', 'mobile'):
        source = getattr(args, name)
        captures[name] = freeze(source, folder / 'inputs' / f'{name}{source.suffix.lower()}', image=True)
    for value in args.state:
        name, sep, raw = value.partition('=')
        if not sep or not name or not all(c.islower() or c.isdigit() or c in '_-' for c in name):
            raise ValueError(f'Expected --state name=path: {value}')
        key = f'state.{name}'
        if key in captures:
            raise ValueError(f'Duplicate state: {name}')
        source = Path(raw)
        captures[key] = freeze(source, folder / 'inputs' / f'{name}{source.suffix.lower()}', image=True)
    attempt = {'status': 'Unverified', 'captures': captures, 'gate': str(folder / 'gate'),
               'selection': dict(selection)}
    source_file = folder / 'inputs' / 'source-manifest.json'
    source_file.write_text(json.dumps(project_source, indent=2) + '\n', encoding='utf-8')
    attempt['source'] = {'root': project_source['root'], 'manifest': str(source_file),
                         'sha256': source_digest(project_source), 'file_count': len(project_source['files'])}
    record['slices'].append(attempt)
    save(run, record)
    help_result = subprocess.run([sys.executable, str(FIRST_SCREEN_GATE), '--help'],
                                 text=True, capture_output=True, check=False)
    if help_result.returncode != 0 or not all(flag in help_result.stdout for flag in ('--selected-study', '--task-anchor')):
        attempt['reason'] = 'First-screen gate lacks selected-study or task-anchor support'
    else:
        selected = study['captures'][selection['study'].lower() + '-mobile']['copy']
        cmd = [sys.executable, str(FIRST_SCREEN_GATE), '--scope', 'first-screen',
               '--brief', record['inputs']['brief']['copy'], '--desktop', captures['desktop']['copy'],
               '--mobile', captures['mobile']['copy'], '--selected-study', selected,
               '--task-anchor', selection['task_anchor'], '--out', attempt['gate'],
               '--codex-bin', args.codex_bin]
        if 'reference' in record['inputs']:
            cmd += ['--reference', record['inputs']['reference']['copy']]
        for key, item in captures.items():
            if key.startswith('state.'):
                cmd += ['--state', f'{key[6:]}={item["copy"]}']
        expected = {'brief': record['inputs']['brief']['sha256'],
                    'desktop': captures['desktop']['sha256'], 'mobile': captures['mobile']['sha256'],
                    'selected-study': digest(Path(selected)),
                    **{key: item['sha256'] for key, item in captures.items() if key.startswith('state.')}}
        if 'reference' in record['inputs']:
            expected['reference'] = record['inputs']['reference']['sha256']
        attempt['status'], attempt['reason'] = gate_result(cmd, Path(attempt['gate']), expected)
    attempt['gate_status'], attempt['gate_reason'] = attempt['status'], attempt['reason']
    verify_slice(run, record, attempt)
    save(run, record)
    print(json.dumps({'status': attempt['status'], 'attempt': str(folder), 'reason': attempt['reason']}))
    return 0 if attempt['status'] == 'Keep' else 2


def verify(args):
    run = args.run.resolve()
    record = load(run)
    if not record['slices']:
        raise ValueError('No finished slice to verify')
    attempt = record['slices'][-1]
    status = verify_slice(run, record, attempt)
    save(run, record)
    print(json.dumps({'status': status, 'attempt': attempt['gate'],
                      'source_sha256': attempt['source']['sha256'], 'reason': attempt['reason']}))
    return 0 if status == 'Keep' else 2


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    p = commands.add_parser('init', help='Freeze brief and decision')
    p.add_argument('--run', type=Path, required=True)
    p.add_argument('--brief', type=Path, required=True)
    p.add_argument('--decision', required=True)
    p.add_argument('--reference', type=Path)
    p.add_argument('--craft-reference-image', type=Path,
                   help='Optional image used as a craft reference in direction review')
    p.set_defaults(action=init)
    p = commands.add_parser('studies', help='Freeze four studies and run direction gate')
    p.add_argument('--run', type=Path, required=True)
    for name in STUDIES:
        p.add_argument(f'--{name}', type=Path, required=True)
    p.add_argument('--codex-bin', default='codex')
    p.set_defaults(action=studies)
    p = commands.add_parser('select', help='Select A or B after a Keep direction review')
    p.add_argument('--run', type=Path, required=True)
    p.add_argument('--study', choices=('A', 'B'), required=True)
    p.add_argument('--task-anchor', required=True, help='Decisive object or changing state to inspect')
    p.set_defaults(action=select)
    p = commands.add_parser('slice', help='Freeze finished first screen and run independent review')
    p.add_argument('--run', type=Path, required=True)
    p.add_argument('--desktop', type=Path, required=True)
    p.add_argument('--mobile', type=Path, required=True)
    p.add_argument('--source-root', type=Path, required=True,
                   help='Smallest project tree containing the rendered UI; excludes generated/review evidence')
    p.add_argument('--state', action='append', default=[])
    p.add_argument('--codex-bin', default='codex')
    p.set_defaults(action=slice_review)
    p = commands.add_parser('verify', help='Check the latest slice against frozen captures and project source')
    p.add_argument('--run', type=Path, required=True)
    p.set_defaults(action=verify)
    args = parser.parse_args(argv)
    try:
        return args.action(args)
    except (OSError, ValueError, KeyError) as exc:
        print(f'first-slice: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
