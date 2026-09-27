"""Flag author-provided names on generic HTML div/span containers.

Usage: python3 semantic_names.py index.html [other.html ...]
This intentionally narrow source check does not replace a browser axe audit.
"""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path


class Names(HTMLParser):
    def __init__(self):
        super().__init__()
        self.findings = []

    def handle_starttag(self, tag, attrs):
        if tag not in {'div', 'span'}:
            return
        attributes = dict(attrs)
        named = [name for name in ('aria-label', 'aria-labelledby') if name in attributes]
        if not named:
            return
        role = (attributes.get('role') or '').split(' ', 1)[0].lower()
        if role and role not in {'generic', 'none', 'presentation'}:
            return
        line, column = self.getpos()
        self.findings.append({'line': line, 'column': column + 1, 'tag': tag,
                              'attributes': named, 'role': role or 'implicit generic',
                              'id': attributes.get('id'), 'class': attributes.get('class')})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+', type=Path)
    args = parser.parse_args()
    findings = []
    for path in args.files:
        try:
            markup = path.read_text(encoding='utf-8')
        except OSError as error:
            parser.exit(1, f'{error}\n')
        checker = Names()
        checker.feed(markup)
        findings.extend({'file': str(path), **item} for item in checker.findings)
    print(json.dumps({'scope': 'aria-label/aria-labelledby on generic div/span only; browser semantics still need review',
                      'findings': findings}, indent=2))
    if findings:
        parser.exit(2, 'Generic containers cannot receive an accessible name without an appropriate role.\n')


if __name__ == '__main__':
    main()
