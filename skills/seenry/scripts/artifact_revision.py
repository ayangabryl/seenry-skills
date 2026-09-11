"""Apply a model-authored revision to an exact source; never overwrite history.

This is mechanical application, not host design correction or validation of quality.
"""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
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
        raise ValueError('Supply one to 32 ordered exact edits')
    content = source.decode('utf-8')
    records = []
    for index, edit in enumerate(edits):
        if not isinstance(edit, dict) or set(edit) != {'find', 'replace'}:
            raise ValueError(f'Edit {index}: find and replace only')
        before, after = edit['find'], edit['replace']
        if not isinstance(before, str) or not before or not isinstance(after, str):
            raise ValueError(f'Edit {index}: nonempty find and string replacement required')
        if before == after:
            raise ValueError(f'Edit {index}: unchanged replacement')
        if content.count(before) != 1:
            raise ValueError(f'Edit {index}: find must match exactly once in the current source')
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


def inline_blocks(source):
    """Locate real inline style/script bodies without reserializing the document."""
    text = source.decode('utf-8')
    offsets = [0] + [match.end() for match in re.finditer('\n', text)]
    class Blocks(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.active = None
            self.blocks = []
            self.counts = {'style': 0, 'script': 0}
        def position(self):
            line, column = self.getpos()
            return offsets[line - 1] + column
        def handle_starttag(self, tag, attrs):
            if tag in self.counts and not (tag == 'script' and 'src' in dict(attrs)):
                identity = f'{tag}-{self.counts[tag]}'
                self.counts[tag] += 1
                self.active = {'id': identity, 'tag': tag, 'attributes': dict(attrs),
                               'start': self.position() + len(self.get_starttag_text())}
        def handle_endtag(self, tag):
            if self.active and self.active['tag'] == tag:
                item = {**self.active, 'end': self.position()}
                item['content_sha256'] = hashlib.sha256(text[item['start']:item['end']].encode()).hexdigest()
                self.blocks.append(item)
                self.active = None
    parser = Blocks()
    parser.feed(text)
    parser.close()
    if parser.active: raise ValueError('Unclosed editable style/script block')
    if not parser.blocks: raise ValueError('No inline style/script blocks available')
    return parser.blocks


def selected_blocks(source, allowed_ids=None):
    blocks = inline_blocks(source)
    if allowed_ids is not None:
        if not isinstance(allowed_ids, list) or not allowed_ids or any(not isinstance(x, str) for x in allowed_ids) or len(set(allowed_ids)) != len(allowed_ids) or not set(allowed_ids).issubset({b['id'] for b in blocks}):
            raise ValueError('Allowed blocks must be distinct existing IDs')
        blocks = [b for b in blocks if b['id'] in allowed_ids]
    return blocks


def block_response_schema(source, allowed_ids=None):
    source_hash = hashlib.sha256(source).hexdigest()
    blocks = selected_blocks(source, allowed_ids)
    return {'type': 'object', 'properties': {
        'source_sha256': {'type': 'string', 'enum': [source_hash]},
        'blocks': {'type': 'array', 'minItems': 1, 'maxItems': min(32, len(blocks)), 'items': {
            'type': 'object', 'properties': {'id': {'type': 'string', 'enum': [b['id'] for b in blocks]}, 'content': {'type': 'string'}},
            'required': ['id', 'content'], 'additionalProperties': False}}},
        'required': ['source_sha256', 'blocks'], 'additionalProperties': False}


def apply_blocks(source, response, allowed_ids=None):
    if not isinstance(source, bytes) or not isinstance(response, dict) or set(response) != {'source_sha256', 'blocks'}:
        raise ValueError('Block revision requires exact source bytes, source_sha256 and blocks')
    source_hash = hashlib.sha256(source).hexdigest()
    if response['source_sha256'] != source_hash: raise ValueError('Block revision does not match source hash')
    available = {b['id']: b for b in selected_blocks(source, allowed_ids)}
    if not isinstance(response['blocks'], list) or not 1 <= len(response['blocks']) <= min(32, len(available)):
        raise ValueError('Supply a bounded nonempty list of existing blocks')
    content = source.decode('utf-8'); changes = []; seen = set()
    for item in response['blocks']:
        if not isinstance(item, dict) or set(item) != {'id', 'content'} or not isinstance(item['id'], str) or item['id'] not in available or item['id'] in seen or not isinstance(item['content'], str):
            raise ValueError('Use unique existing block IDs and replacement content')
        seen.add(item['id']); block = available[item['id']]
        if re.search(r'</\s*' + block['tag'] + r'\b', item['content'], re.I):
            raise ValueError('Replacement must not close its containing element')
        if content[block['start']:block['end']] == item['content']: raise ValueError('Unchanged block replacement')
        changes.append({**block, 'replacement': item['content']})
    for item in sorted(changes, key=lambda x: x['start'], reverse=True):
        content = content[:item['start']] + item['replacement'] + content[item['end']:]
    result = content.encode('utf-8')
    return result, {'source_sha256': source_hash, 'result_sha256': hashlib.sha256(result).hexdigest(),
                    'method': 'model-authored whole inline blocks; surrounding source preserved byte-for-byte',
                    'blocks': [{'id': b['id'], 'before_sha256': b['content_sha256'], 'after_sha256': hashlib.sha256(b['replacement'].encode()).hexdigest()} for b in changes],
                    'limit': 'This transport preserves source outside chosen blocks; it does not validate the replacement behavior or design.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--response', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--mode', choices=('exact', 'blocks'), default='exact')
    parser.add_argument('--block-ids', nargs='+', help='Restrict block-mode changes to these source IDs')
    args = parser.parse_args()
    try:
        source, response = args.source.read_bytes(), json.loads(args.response.read_text(encoding='utf-8'))
        if args.mode == 'blocks': result, record = apply_blocks(source, response, args.block_ids)
        else:
            if args.block_ids: raise ValueError('Block IDs require block mode')
            result, record = apply_revision(source, response)
        # Validate every operation before creating anything. x forbids replacing an
        # earlier artifact even if --out equals --source or names an existing link.
        with args.out.open('xb') as target:
            target.write(result)
        print(json.dumps({'artifact': str(args.out.resolve()), **record}, indent=2))
    except (OSError, ValueError, UnicodeError, TypeError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
