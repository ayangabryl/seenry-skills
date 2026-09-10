"""Apply exact model-authored replacements to a frozen source; never guess context."""
import argparse
import hashlib
import json
from pathlib import Path

def apply(source, response):
    if response.get('source_sha256') != hashlib.sha256(source.encode()).hexdigest():
        raise ValueError('Source changed since the model request')
    edits = response.get('edits')
    if not isinstance(edits, list) or not 1 <= len(edits) <= 20:
        raise ValueError('Expected 1–20 exact replacements')
    result = source
    for edit in edits:
        old, new = edit.get('old'), edit.get('new')
        if not isinstance(old, str) or not old or not isinstance(new, str):
            raise ValueError('Each edit needs nonempty old and string new')
        if result.count(old) != 1:
            raise ValueError('Replacement context must occur exactly once; no fuzzy application')
        result = result.replace(old, new, 1)
    return result

def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('source', type=Path)
    cli.add_argument('response', type=Path)
    cli.add_argument('output', type=Path)
    args = cli.parse_args()
    try:
        if args.output.exists(): raise ValueError('Choose a new output path; preserve earlier source')
        source = args.source.read_text(encoding='utf-8')
        result = apply(source, json.loads(args.response.read_text(encoding='utf-8')))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result, encoding='utf-8')
        print(json.dumps({'code_authorship': 'replacement text supplied by calling model',
                          'output_sha256': hashlib.sha256(result.encode()).hexdigest(),
                          'limit': 'Exact application checked; render and test the changed artifact'}))
    except (OSError, ValueError, TypeError) as error: cli.exit(1, str(error) + '\n')

if __name__ == '__main__': main()
