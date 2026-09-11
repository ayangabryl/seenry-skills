"""Validate a single raw HTML response before writing an artifact. No code repair."""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.starts = []
        self.ends = []
    def handle_starttag(self, tag, attrs): self.starts.append(tag)
    def handle_endtag(self, tag): self.ends.append(tag)


def extract(text):
    html = text.strip()
    if html.startswith('```'):
        match = re.fullmatch(r'```(?:html)?\s*\n([\s\S]*?)\n```', html)
        if not match: raise ValueError('Expected one HTML artifact, without surrounding prose')
        html = match.group(1).strip()
    if not re.match(r'(?is)<!doctype\s+html\s*>\s*<html\b', html):
        raise ValueError('Expected a raw HTML document, not JSON or a partial code fragment')
    if not re.search(r'(?is)</body>\s*</html>\s*$', html):
        raise ValueError('Incomplete HTML document; preserve the response and request the complete file')
    parsed = Document()
    parsed.feed(html)
    parsed.close()
    for tag in ('html', 'head', 'body'):
        if parsed.starts.count(tag) != 1 or parsed.ends.count(tag) != 1:
            raise ValueError('Expected exactly one complete ' + tag + ' element')
    for tag in ('script', 'style'):
        if parsed.starts.count(tag) != parsed.ends.count(tag):
            raise ValueError('Unclosed ' + tag + ' element')
    return html


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('response', type=Path)
    cli.add_argument('output', type=Path)
    args = cli.parse_args()
    try:
        raw = args.response.read_text(encoding='utf-8')
        html = extract(raw)
        if args.output.exists(): raise ValueError('Preserve existing artifacts; choose a new output path')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(html, encoding='utf-8')
        print(json.dumps({'response_sha256': hashlib.sha256(raw.encode()).hexdigest(),
                          'artifact_sha256': hashlib.sha256(html.encode()).hexdigest(),
                          'code_repaired': False, 'status': 'structurally-complete',
                          'limit': 'Does not validate JavaScript, task behavior or visual quality'}))
    except (OSError, ValueError) as error:
        cli.exit(1, str(error) + '\n')


if __name__ == '__main__': main()
