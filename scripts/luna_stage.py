"""Explicit Codex Luna fallback for host-rendered diagnostics, never a Flash result."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


def explicit_images(manifest, allowed):
    allowed = [Path(root).resolve() for root in allowed]
    values = json.loads(manifest.read_text(encoding='utf-8'))
    if not isinstance(values, list) or len(values) > 24:
        raise ValueError('Image manifest must be a list of at most 24 paths or path/role records')
    result, seen = [], {}
    for value in values:
        role = 'unspecified'
        if isinstance(value, dict):
            if set(value) != {'path', 'role'}: raise ValueError('Image records require path and role only')
            role, value = value['role'], value['path']
        if not isinstance(value, str) or role not in ('unspecified', 'source-material', 'construction', 'candidate', 'reference', 'interaction', 'rejected-example'):
            raise ValueError('Invalid image path or evidence role')
        path = (manifest.parent / value).resolve()
        if not path.is_file() or not any(path.is_relative_to(root) for root in allowed):
            raise ValueError('Missing or out-of-scope image: ' + value)
        content = path.read_bytes()
        if not (content.startswith(b'\x89PNG\r\n\x1a\n') or content.startswith(b'\xff\xd8\xff') or (content.startswith(b'RIFF') and content[8:12] == b'WEBP')):
            raise ValueError('Actual PNG, JPEG or WebP required: ' + value)
        if path in seen and seen[path] != role: raise ValueError('Same image has conflicting evidence roles: ' + value)
        if path not in seen:
            result.append({'path': str(path), 'sha256': hashlib.sha256(content).hexdigest(), 'role': role}); seen[path] = role
    return result


def command_for(executable, out, images, ignore_user_config=False, output_schema=None, disable_shell=False):
    # The child runs inside out; a relative -o would otherwise point inside out twice.
    out = Path(out).resolve()
    command = [executable, 'exec', '-m', 'gpt-5.6-luna', '-c', 'model_reasoning_effort="high"',
               '-s', 'read-only', '--ephemeral', '--skip-git-repo-check', '--json', '-o', str(out / 'answer.md')]
    if ignore_user_config:
        command.append('--ignore-user-config')
    if disable_shell:
        command.extend(['--disable', 'shell_tool'])
    if output_schema is not None:
        command.extend(['--output-schema', str(Path(output_schema).resolve())])
    for image in images:
        command.extend(['-i', image['path']])
    return command + ['-']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--prompt', type=Path, required=True)
    parser.add_argument('--executable', default='codex')
    parser.add_argument('--timeout', type=int, default=240)
    parser.add_argument('--allow-dir', type=Path, action='append', default=[])
    parser.add_argument('--images', type=Path, help='Ordered JSON paths or {path,role} records; preferred to legacy prompt scanning')
    parser.add_argument('--ignore-user-config', action='store_true', help='Fresh-run option: skip user config; authentication and global skill metadata may remain')
    parser.add_argument('--output-schema', type=Path, help='Optional host-provided JSON response schema; does not validate judgment accuracy')
    parser.add_argument('--disable-shell', action='store_true', help='Disable the CLI shell_tool feature for packet-only stages; other tools and ambient context may remain')
    args = parser.parse_args()
    if args.timeout < 1:
        parser.error('timeout must be positive')
    executable = shutil.which(args.executable)
    if not executable:
        parser.error('Codex executable not found; no model substitution')
    args.out.mkdir(parents=True, exist_ok=False)
    prompt = args.prompt.read_text(encoding='utf-8')
    schema_record = None
    if args.output_schema:
        content = args.output_schema.read_bytes()
        value = json.loads(content)
        if not isinstance(value, dict) or value.get('type') != 'object':
            parser.error('Output schema must describe a JSON object')
        schema_path = args.out / 'response.schema.json'
        schema_path.write_bytes(content)
        schema_record = {'file': schema_path.name, 'sha256': hashlib.sha256(content).hexdigest()}
    image_inputs = []
    allowed = [p.resolve() for p in args.allow_dir]
    for match in re.finditer(r'(/[^\n"<>\[\]`]+?\.(?:png|jpe?g|webp))(?=["\s\],])', prompt):
        path = Path(match.group(1)).resolve()
        if path.is_file() and any(path.is_relative_to(root) for root in allowed) and str(path) not in [x['path'] for x in image_inputs]:
            image_inputs.append({'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    if args.images:
        image_inputs = explicit_images(args.images.resolve(), allowed)
    if image_inputs:
        prompt += '\n\nThe following actual images are attached directly, in this order. Inspect their visible pixels; distinguish observations from inference. Source-material is the original asset; construction is an intermediate study whose diagnostic treatment is not automatically the final design. An evidence role does not grant an asset license or human approval:\n' + json.dumps(image_inputs)
    (args.out / 'prompt.txt').write_bytes(prompt.encode('utf-8'))
    command = command_for(executable, args.out, image_inputs, args.ignore_user_config,
                          args.out / schema_record['file'] if schema_record else None, args.disable_shell)
    runner_hash = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    started = time.time()
    timed_out = False
    interrupted = False
    with (args.out / 'events.ndjson').open('w') as stdout, (args.out / 'stderr.txt').open('w') as stderr:
        child = subprocess.Popen(command, cwd=args.out, stdin=subprocess.PIPE, stdout=stdout, stderr=stderr, text=True, encoding='utf-8')
        try:
            child.communicate(prompt, timeout=args.timeout)
            code = child.returncode
        except (subprocess.TimeoutExpired, KeyboardInterrupt) as exc:
            interrupted = isinstance(exc, KeyboardInterrupt)
            timed_out = not interrupted
            child.terminate()
            try:
                child.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
                child.communicate(timeout=10)
            code = 130 if interrupted else 124
    usage = None
    completed = False
    for line in (args.out / 'events.ndjson').read_text(encoding='utf-8').splitlines():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if event.get('type') == 'turn.completed':
            usage = event.get('usage')
            completed = True
    answer = args.out / 'answer.md'
    if not answer.exists():
        answer.write_text('', encoding='utf-8')
    record = {
        'model_requested': 'gpt-5.6-luna', 'runtime_configured_model': 'gpt-5.6-luna',
        'reasoning_effort_requested': 'high', 'reported_model': None,
        'model_condition': 'authorized Luna fallback; not part of Flash comparison',
        'started_at': datetime.fromtimestamp(started, timezone.utc).isoformat(),
        'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest(),
        'delivery_size': {'prompt_bytes':len(prompt.encode('utf-8')), 'prompt_characters':len(prompt),
            'image_attachments':len(image_inputs),
            'external_schema_bytes':(args.out / schema_record['file']).stat().st_size if schema_record else 0,
            'token_count':None,
            'scope':'Exact frozen prompt text, including adapter additions; attachment count and external response-schema bytes are separate. Excludes provider tokenization, image tokens, ambient context and later tool traffic. Raw provider usage, when available, is authoritative after execution.'},
        'runner_sha256': runner_hash,
        'executable': executable, 'elapsed': time.time() - started, 'exit_code': code,
        'usage': usage, 'timed_out': timed_out, 'interrupted': interrupted, 'mode': 'host-rendered',
        'requested_resource_roots': [str(p.resolve()) for p in args.allow_dir],
        'direct_image_inputs': image_inputs,
        'image_selection': 'explicit manifest' if args.images else 'legacy absolute prompt-path scan',
        'output_schema': schema_record,
        'ignore_user_config': args.ignore_user_config,
        'shell_tool_disabled_requested': args.disable_shell,
        'status': 'response-produced' if completed and code == 0 and not timed_out and answer.stat().st_size else 'incomplete',
        'limits': ['Read-only execution sandbox is not a read isolation boundary.',
                   'Ambient installed skills, user configuration and project instructions may be present.',
                   'Model identity is requested through CLI; independent serving attestation is unavailable.']}
    (args.out / 'run.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(record, indent=2))


if __name__ == '__main__':
    main()
