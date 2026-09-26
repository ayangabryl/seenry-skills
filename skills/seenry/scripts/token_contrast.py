"""Audit likely small-text pairs from opaque :root CSS tokens without a browser.

Usage: python3 token_contrast.py index.html [styles.css ...]
This checks text tokens actually used as CSS `color` against the body's root
background. It cannot resolve nested surfaces, alpha, gradients, images or themes.
"""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re

from color_lab import color, contrast


class Styles(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag == 'style':
            self.inside = True

    def handle_endtag(self, tag):
        if tag == 'style':
            self.inside = False

    def handle_data(self, data):
        if self.inside:
            self.blocks.append(data)


def source_css(path):
    source = path.read_text(encoding='utf-8')
    if path.suffix.lower() not in ('.html', '.htm'):
        return source
    parser = Styles()
    parser.feed(source)
    return '\n'.join(parser.blocks)


def token_roles(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    roots = re.findall(r':root\s*\{([^{}]*)\}', css, flags=re.I)
    values = {}
    for root in roots:
        for name, value in re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+)', root):
            values.setdefault(name.lower(), value.strip())
    body = re.search(r'\bbody\s*\{([^{}]*)\}', css, flags=re.I)
    background = None
    if body:
        declaration = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', body.group(1), flags=re.I)
        if declaration:
            value = declaration.group(1).strip()
            reference = re.fullmatch(r'var\(\s*(--[\w-]+)\s*\)', value)
            background = (reference.group(1).lower(), values.get(reference.group(1).lower())) if reference else ('body', value)
    used = set(re.findall(r'(?:^|[;{])\s*color\s*:\s*var\(\s*(--[\w-]+)\s*\)', css, flags=re.I))
    text_roles = {'ink', 'text', 'muted', 'secondary', 'subtle', 'caption', 'label',
                  'body-text', 'copy-text', 'text-primary', 'text-secondary',
                  'text-muted', 'text-subtle', 'text-caption', 'text-label'}
    foregrounds = {name.lower():values[name.lower()] for name in used
                   if name.lower() in values and name.lower()[2:] in text_roles}
    return background, foregrounds


def audit(paths):
    checks = []
    limitations = []
    for path in paths:
        background, foregrounds = token_roles(source_css(path))
        if not background:
            limitations.append(f'{path}: body background not found')
            continue
        try:
            bg = color(background[1])
        except ValueError:
            limitations.append(f'{path}: body background {background[0]} is not opaque hex')
            continue
        for name, value in sorted(foregrounds.items()):
            try:
                fg = color(value)
            except ValueError:
                limitations.append(f'{path}: {name} is not opaque hex')
                continue
            ratio = contrast(fg, bg)
            checks.append({'file': str(path), 'textToken': name, 'backgroundToken': background[0],
                           'foreground': fg, 'background': bg, 'ratio': round(ratio, 3),
                           'minimum': 4.5, 'pass': ratio >= 4.5})
    return {'scope': 'Likely small-text root-token pairs on the body background only; not a DOM contrast audit',
            'checks': checks, 'limitations': limitations}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+', type=Path)
    args = parser.parse_args()
    try:
        report = audit(args.files)
    except OSError as error:
        parser.exit(1, f'{error}\n')
    print(json.dumps(report, indent=2))
    if not report['checks']:
        parser.exit(1, 'No measurable root text/body pairs; inspect CSS or pass explicit pairs to contrast_check.py.\n')
    if any(not item['pass'] for item in report['checks']):
        parser.exit(2, 'Review required: a likely text/background pair failed.\n')


if __name__ == '__main__':
    main()
