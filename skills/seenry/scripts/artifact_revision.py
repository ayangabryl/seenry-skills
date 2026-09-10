"""Apply a model-authored revision to an exact source; never overwrite history.

This is mechanical application, not host design correction or validation of quality.
"""
import argparse
import hashlib
import json
from pathlib import Path


def apply_revision(source, response):
    if not isinstance(source, bytes):
        raise ValueError('Source must be exact bytes')
    if not isinstance(response, dict) or set(response) != {'source_sha256', 'edits'}:
        raise ValueError('Revision requires source_sha256 and edits only')
    source_hash = hashlib.sha256(source).hexdigest()
    if response['source_sha256'] != source_hash:
        raise ValueError('Revision does not match the supplied source hash')
    edits = response['edits']
    if not isinstance(edits, list) or not 1 <= len(edits) <= 32:
        raise ValueError('Supply one to32 ordered exact edits')
    content = source.decode('utf-8')
    records = []
    for index, edit in enumerate(edits):
        if not isinstance(edit, dict) or set(edit) != {'find', 'replace'}:
            raise ValueError(f'Edit{index}: find and replace only')
        before, after = edit['find'], edit['replace']
        if not isinstance(before, str) or not before or not isinstance(after, str):
            raise ValueError(f'Edit{index}: nonempty find and string replacement required')
        if before == after:
            raise ValueError(f'Edit{index}: unchanged replacement')
        if content.count(before) != 1:
            raise ValueError(f'Edit{index}: find must match exactly once in the current source')
        content = content.replace(before, after, 1)
        records.append({'index': index, 'find_sha256': hashlib.sha256(before.encode()).hexdigest(),
                        'replacement_sha256': hashlib.sha256(after.encode()).hexdigest()})
    result = content.encode('utf-8')
    if result == source:
        raise ValueError('Revision made no final change')
    return result, {'source_sha256': source_hash, 'result_sha256': hashlib.sha256(result).hexdigest(),
                    'edits': records, 'method': 'ordered exact unique replacements',
                    'limit': 'Mechanical model edit application; render and exercise the new artifact before review.'}


def response_schema(source_hash):
    if not isinstance(source_hash, str) or len(source_hash) != 64 or any(c not in '0123456789abcdef' for c in source_hash):
        raise ValueError('An actual lowercase SHA-256 source hash is required')
    return {'type': 'object', 'properties': {
        'source_sha256': {'type': 'string', 'enum': [source_hash]},
        'edits': {'type': 'array', 'minItems': 1, 'maxItems': 32, 'items': {
            'type': 'object', 'properties': {'find': {'type': 'string'}, 'replace': {'type': 'string'}},
            'required': ['find', 'replace'], 'additionalProperties': False}}},
        'required': ['source_sha256', 'edits'], 'additionalProperties': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--response', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    try:
        result, record = apply_revision(args.source.read_bytes(), json.loads(args.response.read_text(encoding='utf-8')))
        # Validate every operation before creating anything. x forbids replacing an
        # earlier artifact even if --out equals --source or names an existing link.
        with args.out.open('xb') as target:
            target.write(result)
        print(json.dumps({'artifact': str(args.out.resolve()), **record}, indent=2))
    except (OSError, ValueError, UnicodeError, TypeError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
