"""Audit likely small-text pairs from opaque CSS colors without a browser.

Usage: python3 token_contrast.py index.html [styles.css ...]
This checks text tokens and direct hex `color` declarations against an explicit
rule background or the page's root background. It is a conservative source
review, not a DOM audit; nested surfaces, alpha, gradients and themes need a
rendered check.
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
    background = None
    body = re.search(r'\bbody\s*\{([^{}]*)\}', css, flags=re.I)
    root = re.search(r':root\s*\{([^{}]*)\}', css, flags=re.I)
    for rule in (body, root):
        if not rule:
            continue
        declaration = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', rule.group(1), flags=re.I)
        if declaration:
            value = declaration.group(1).strip()
            reference = re.fullmatch(r'var\(\s*(--[\w-]+)\s*\)', value)
            background = (reference.group(1).lower(), values.get(reference.group(1).lower())) if reference else ('body' if rule is body else ':root', value)
            break
    used = set(re.findall(r'(?:^|[;{])\s*color\s*:\s*var\(\s*(--[\w-]+)\s*\)', css, flags=re.I))
    text_roles = {'ink', 'text', 'muted', 'secondary', 'subtle', 'caption', 'label',
                  'body-text', 'copy-text', 'text-primary', 'text-secondary',
                  'text-muted', 'text-subtle', 'text-caption', 'text-label'}
    foregrounds = {name.lower():values[name.lower()] for name in used
                   if name.lower() in values and name.lower()[2:] in text_roles}
    return background, foregrounds, values


def direct_colors(css, background, values):
    """Flag literal text colors with a measurable local or page background."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    checks = []
    for selector, declarations in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
        foreground = re.search(r'(?:^|;)\s*color\s*:\s*([^;{}]+)', declarations, flags=re.I)
        if not foreground:
            continue
        try:
            fg = color(foreground.group(1).strip())
        except ValueError:
            continue
        local = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', declarations, flags=re.I)
        chosen = background
        scope = 'page background approximation'
        if local:
            value = local.group(1).strip()
            reference = re.fullmatch(r'var\(\s*(--[\w-]+)\s*\)', value)
            if reference:
                value = values.get(reference.group(1).lower())
            try:
                color(value)
                chosen = ('same rule', value)
                scope = 'same rule'
            except (TypeError, ValueError):
                pass
        try:
            bg = color(chosen[1])
        except (TypeError, ValueError):
            continue
        ratio = contrast(fg, bg)
        checks.append({'selector': selector.strip(), 'foreground': fg, 'background': bg,
                       'backgroundScope': scope, 'ratio': round(ratio, 3),
                       'minimum': 4.5, 'pass': ratio >= 4.5})
    return checks


def audit(paths):
    checks = []
    direct_checks = []
    limitations = []
    for path in paths:
        css = source_css(path)
        background, foregrounds, values = token_roles(css)
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
        for item in direct_colors(css, background, values):
            direct_checks.append({'file': str(path), **item})
    return {'scope': 'Likely small-text token and direct-hex pairs; nested surfaces and typography need rendered review',
            'checks': checks, 'directChecks': direct_checks, 'limitations': limitations}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files', nargs='+', type=Path)
    args = parser.parse_args()
    try:
        report = audit(args.files)
    except OSError as error:
        parser.exit(1, f'{error}\n')
    print(json.dumps(report, indent=2))
    if not report['checks'] and not report['directChecks']:
        parser.exit(1, 'No measurable text/background pairs; inspect CSS or pass explicit pairs to contrast_check.py.\n')
    if any(not item['pass'] for item in report['checks'] + report['directChecks']):
        parser.exit(2, 'Review required: a likely text/background pair failed.\n')


if __name__ == '__main__':
    main()
