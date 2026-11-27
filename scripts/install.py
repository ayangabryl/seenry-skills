"""Install Seenry with shared agent links and reversible upgrades.
Default is a dry run. No network, credentials or MCP configuration changes.
With --project, also writes a short always-on Seenry index into the project's AGENTS.md.
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import shutil
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES = ('seenry', 'seenry-identity', 'seenry-canvas', 'seenry-craft', 'seenry-review', 'seenry-break', 'seenry-subtract', 'seenry-audit', 'seenry-libraries', 'seenry-assets', 'seenry-motion', 'seenry-apps', 'seenry-video')
# Merged into the skills above in 3.0; archived on --replace so stale copies stop triggering.
RETIRED = (
    'seenry-typography', 'seenry-color', 'seenry-layout', 'seenry-accessibility',
    'seenry-writing', 'seenry-polish', 'seenry-change-review', 'seenry-explain', 'seenry-stress', 'seenry-variants',
)
AGENTS = ('agents', 'codex', 'claude', 'cursor', 'antigravity')
START, END = '<!-- seenry:start -->', '<!-- seenry:end -->'
# skills/seenry-canvas/scripts/sync.mjs writes the same block (canvas.mjs library and update); keep the two identical.
INDEX = START + """
## Seenry design skills

When the person mentions Seenry, or asks for anything people see (a page, screen, form, component, styling, layout or animation), load the `seenry` skill first and run its flow without setup questions. Prefer the skill's guidance over memory.

Router: new page, screen, redesign → `seenry` | fonts, color, brand → `seenry-identity` | mockups, options → `seenry-canvas` | spacing, radius, states → `seenry-craft` | animation → `seenry-motion` | library or framework → `seenry-libraries` | photos, icons, font files → `seenry-assets` | review, accessibility → `seenry-review` | edge-case data → `seenry-break` | too busy → `seenry-subtract` | whole-app audit → `seenry-audit` | native mobile → `seenry-apps` | product film → `seenry-video`

Pick between options on the Seenry canvas, then build the pick in the project's code; skip the canvas when the person says just build it. Pick the stack with `seenry-libraries`.

Skills live in `{skills}/<name>/SKILL.md`.
""" + END
CLAUDE_IMPORT = re.compile(r'^@(\./)?AGENTS\.md\s*$', re.M)

def exists(path):
    return path.exists() or path.is_symlink()

def link_signature(path):
    # Windows readlink may expose an extended-path prefix. Compare destinations,
    # not the platform-specific spelling; archive moves preserve the raw link.
    return {'link': os.path.normcase(os.path.realpath(path))}

def signature(path):
    if path.is_symlink():
        return link_signature(path)
    if not path.is_dir():
        raise ValueError(f'Expected a skill directory: {path}')
    digest = hashlib.sha256()
    for child in sorted(path.rglob('*')):
        rel = child.relative_to(path).as_posix()
        if '__pycache__' in child.relative_to(path).parts or child.name == '.DS_Store' or child.suffix in ('.pyc', '.pyo'):
            continue
        if child.is_symlink():
            data = b'link:' + os.fsencode(os.readlink(child))
        elif child.is_file():
            data = child.read_bytes()
        else:
            data = b'directory'
        digest.update(rel.encode() + b'\0' + data + b'\0')
    return {'sha256': digest.hexdigest()}

def remove(path):
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)

def save(manifest, path):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)

def plan(home, source=ROOT, replace=False, link_mode='symlink'):
    home, source = Path(home).absolute(), Path(source).resolve()
    new, old = [], []
    for name in NAMES:
        origin = source / 'skills' / name
        if not (origin / 'SKILL.md').is_file():
            raise ValueError(f'Missing source skill: {origin}')
        canonical = home / '.agents/skills' / name
        for agent in AGENTS:
            target = home / f'.{agent}/skills' / name
            wanted = signature(origin) if agent == 'agents' or link_mode == 'copy' else link_signature(canonical)
            new.append({'path': str(target), 'source': str(origin), 'canonical': str(canonical),
                        'kind': 'copy' if agent == 'agents' or link_mode == 'copy' else 'symlink', 'signature': wanted})
    retired = [home / f'.{agent}/skills' / name for name in RETIRED for agent in AGENTS if exists(home / f'.{agent}/skills' / name)]
    unchanged = not retired and all(exists(Path(x['path'])) and signature(Path(x['path'])) == x['signature'] for x in new)
    if retired and not replace:
        raise ValueError(f'Retired Seenry skill at {retired[0]}; use --replace to archive it and upgrade.')
    for target in retired:
        old.append({'path': str(target), 'backup': f'entries/{target.parents[1].name[1:]}/{target.name}'})
    if not unchanged:
        for item in new:
            target = Path(item['path'])
            if exists(target):
                if not replace:
                    raise ValueError(f'Existing Seenry install at {target}; use --replace to archive and upgrade it.')
                old.append({'path': str(target), 'backup': f'entries/{target.parents[1].name[1:]}/{target.name}'})
    return {'schema': 1, 'home': str(home), 'source': str(source), 'link_mode': link_mode,
            'status': 'unchanged' if unchanged else 'planned',
            'new': new, 'old': old, 'installed': [], 'moved': []}

def undo(manifest, folder, check_edits=True):
    # Preflight the whole rollback before deleting a single installed entry.
    if check_edits:
        for entry in manifest['installed']:
            path = Path(entry['path'])
            if not exists(path) or signature(path) != entry['signature']:
                raise ValueError(f'Rollback stopped: installed content changed at {path}. Preserve or move it first.')
        new_paths = {entry['path'] for entry in manifest['installed']}
        for entry in manifest['moved']:
            if not exists(folder / entry['backup']):
                raise ValueError(f'Missing archive: {entry["backup"]}')
            if entry['path'] not in new_paths and exists(Path(entry['path'])):
                raise ValueError(f'Rollback collision: {entry["path"]}')
    for entry in reversed(manifest['installed']):
        remove(Path(entry['path']))
    for entry in reversed(manifest['moved']):
        target, backup = Path(entry['path']), folder / entry['backup']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(backup), str(target))
    manifest['status'] = 'rolled-back'
    save(manifest, folder / 'manifest.json')

def apply(manifest):
    if manifest['status'] == 'unchanged':
        return None
    folder = Path(manifest['home']) / '.local/share/seenry/installs' / (
        datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8])
    folder.mkdir(parents=True)
    journal = folder / 'manifest.json'
    manifest['status'] = 'installing'
    save(manifest, journal)
    try:
        for entry in manifest['old']:
            backup = folder / entry['backup']
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(entry['path'], str(backup))
            manifest['moved'].append(entry)
            save(manifest, journal)
        for entry in manifest['new']:
            target = Path(entry['path'])
            target.parent.mkdir(parents=True, exist_ok=True)
            if exists(target):
                raise ValueError(f'Concurrent install collision: {target}')
            manifest['installed'].append(entry)
            if entry['kind'] == 'copy':
                shutil.copytree(entry['source'], target, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '*.pyo', '.DS_Store'))
            else:
                target.symlink_to(entry['canonical'], target_is_directory=True)
            save(manifest, journal)
        for entry in manifest['new']:
            if signature(Path(entry['path'])) != entry['signature']:
                raise ValueError(f'Installed content differs: {entry["path"]}')
        manifest['status'] = 'installed'
        save(manifest, journal)
    except Exception:
        undo(manifest, folder, check_edits=False)
        raise
    return journal

def index_block(skills):
    return INDEX.replace('{skills}', skills)

def skills_label(home):
    home = Path(home).absolute()
    return '~/.agents/skills' if home == Path.home().absolute() else (home / '.agents/skills').as_posix()

def _span(text):
    start, end = text.find(START), text.find(END)
    if start < 0 and end < 0:
        return None
    if start < 0 or end < start or text.count(START) > 1 or text.count(END) > 1:
        raise ValueError('Unbalanced or repeated Seenry markers; fix them by hand first.')
    return start, end + len(END)

def upsert_block(text, block):
    span = _span(text)
    if span:
        return text[:span[0]] + block + text[span[1]:]
    if not text.strip():
        return block + '\n'
    return text.rstrip('\n') + '\n\n' + block + '\n'

def remove_block(text):
    span = _span(text)
    if not span:
        return text
    before, after = text[:span[0]].rstrip('\n'), text[span[1]:].lstrip('\n')
    if not before:
        return after
    return before + '\n' + ('\n' + after if after else '')

def _imports_agents(text):
    span = _span(text)
    return bool(CLAUDE_IMPORT.search(text[:span[0]] + text[span[1]:] if span else text))

def instruction_targets(project=None, home=None, remove=False):
    # Claude Code reads AGENTS.md itself only when no CLAUDE.md exists, so a CLAUDE.md that
    # does not already import @AGENTS.md gets its own copy; Codex and Cursor read AGENTS.md.
    targets = []
    if project:
        project = Path(project)
        targets.append((project / 'AGENTS.md', 'upsert'))
        claude = project / 'CLAUDE.md'
        if claude.exists() or (project / 'CLAUDE.local.md').exists():
            text = claude.read_text(encoding='utf-8') if claude.exists() else ''
            targets.append((claude, 'remove' if _imports_agents(text) else 'upsert'))
    if home:
        targets += [(Path(home) / '.codex/AGENTS.md', 'upsert'), (Path(home) / '.claude/CLAUDE.md', 'upsert')]
    return [(file, 'remove' if remove else action) for file, action in targets]

def plan_instructions(targets, block):
    changes = []
    for file, action in targets:
        old = file.read_text(encoding='utf-8') if file.exists() else None
        if action == 'remove' and old is None:
            continue
        new = remove_block(old) if action == 'remove' else upsert_block(old or '', block)
        if new != old:
            changes.append({'path': file, 'old': old, 'new': new})
    return changes

def diff_instructions(changes):
    out = []
    for change in changes:
        name = str(change['path'])
        old = (change['old'] or '').splitlines(keepends=True)
        out += difflib.unified_diff(old, change['new'].splitlines(keepends=True),
                                    '/dev/null' if change['old'] is None else name, name)
    return ''.join(out)

def write_instructions(changes):
    for change in changes:
        path = change['path']
        if not change['new'].strip() and change['old'] is not None:
            path.unlink()
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + '.seenry-tmp')
        temporary.write_text(change['new'], encoding='utf-8')
        temporary.replace(path)

def ask(question):
    try:
        return input(question + ' [Y/n] ').strip().lower() in ('', 'y', 'yes')
    except EOFError:
        return True

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home', type=Path, default=Path.home())
    parser.add_argument('--source', type=Path, default=ROOT)
    parser.add_argument('--replace', action='store_true', help='Archive an existing Seenry install before upgrading.')
    parser.add_argument('--link-mode', choices=['symlink', 'copy'], default='symlink')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--rollback', type=Path, help='Restore one trusted local install manifest; no --apply needed.')
    parser.add_argument('--project', type=Path, help="Project whose AGENTS.md (and CLAUDE.md, when it has one) gets the Seenry index.")
    parser.add_argument('--instructions', action=argparse.BooleanOptionalAction, default=None,
                        help='Write the Seenry index into the project files (default yes with --project; asks when interactive).')
    parser.add_argument('--global-instructions', action='store_true',
                        help='Also write the index into ~/.codex/AGENTS.md and ~/.claude/CLAUDE.md.')
    parser.add_argument('--instructions-only', action='store_true', help='Skip installing skills; only write or remove the index.')
    parser.add_argument('--remove-instructions', action='store_true', help='Remove the Seenry index from the project (and global files with --global-instructions).')
    args = parser.parse_args()
    try:
        if args.rollback:
            file = args.rollback.resolve()
            manifest = json.loads(file.read_text(encoding='utf-8'))
            if manifest['status'] != 'installed':
                raise ValueError('Only a completed install can be rolled back by this command.')
            undo(manifest, file.parent)
            print(json.dumps({'status': 'rolled-back', 'manifest': str(file)}))
            return
        home = args.home if args.global_instructions else None
        if args.remove_instructions:
            changes = plan_instructions(instruction_targets(args.project, home, remove=True), None)
            sys.stderr.write(diff_instructions(changes))
            if args.apply:
                write_instructions(changes)
            print(json.dumps({'status': 'removed' if args.apply else 'planned',
                              'instructions': [str(c['path']) for c in changes]}, indent=2))
            return
        want = args.instructions
        if args.project and want is None:
            want = ask(f'Add the Seenry index to the agent instructions in {args.project}?') if args.apply and sys.stdin.isatty() else True
        changes = plan_instructions(instruction_targets(args.project if want else None, home),
                                    index_block(skills_label(args.home)))
        report = {}
        if not args.instructions_only:
            result = plan(args.home, args.source, args.replace, args.link_mode)
            if args.apply:
                manifest = apply(result)
                report = {'status': result['status'], 'manifest': str(manifest) if manifest else None}
            else:
                report = {'status': result['status'], 'install': [x['path'] for x in result['new']],
                          'archive': [x['path'] for x in result['old']], 'link_mode': args.link_mode}
        if args.apply:
            write_instructions(changes)
        else:
            sys.stderr.write(diff_instructions(changes))
        report['instructions'] = [str(c['path']) for c in changes]
        print(json.dumps(report, indent=2))
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, str(exc) + '\n')

if __name__ == '__main__':
    main()
