"""Audit likely small-text pairs from opaque CSS colors without a browser.

Usage: python3 token_contrast.py index.html [styles.css ...]
This checks text tokens, direct hex colors and variable text on resolvable
same-rule or simple selector-ancestor fills against an explicit rule or page
background. It is a conservative source review, not a DOM audit; inherited
surfaces, alpha, gradients and themes need a rendered check.
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


class Elements(HTMLParser):
    """Keep just enough ancestry to identify simple opaque CSS surfaces."""

    void = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__()
        self.nodes = []
        self.stack = []

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs),
                'parent': self.stack[-1] if self.stack else None}
        self.nodes.append(node)
        if tag not in self.void:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs),
                'parent': self.stack[-1] if self.stack else None}
        self.nodes.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack)-1, -1, -1):
            if self.stack[index]['tag'] == tag:
                del self.stack[index:]
                return


def matches_selector(node, selector):
    """Match type, class, ID and descendant selectors; reject complex CSS."""
    if any(mark in selector for mark in (',', '>', '+', '~', '[', ':')):
        return False
    parts = selector.split()
    if not parts:
        return False

    def matches_token(element, token):
        pieces = re.findall(r'[#.]?[\w-]+', token)
        if not pieces or ''.join(pieces) != token:
            return False
        classes = set((element['attrs'].get('class') or '').split())
        for piece in pieces:
            if piece.startswith('.') and piece[1:] not in classes:
                return False
            if piece.startswith('#') and piece[1:] != element['attrs'].get('id'):
                return False
            if not piece.startswith(('.', '#')) and piece.lower() != element['tag']:
                return False
        return True

    if not matches_token(node, parts[-1]):
        return False
    current = node['parent']
    for part in reversed(parts[:-1]):
        while current and not matches_token(current, part):
            current = current['parent']
        if current is None:
            return False
        current = current['parent']
    return True


def dom_background(selector, nodes, fills):
    matched = [node for node in nodes if matches_selector(node, selector)]
    if not matched:
        return None
    surfaces = set()
    for node in matched:
        current = node
        while current:
            fill = next((value for rule, value in reversed(list(fills.items()))
                         if matches_selector(current, rule)), None)
            if fill:
                surfaces.add(fill)
                break
            current = current['parent']
        else:
            return None
    return next(iter(surfaces)) if len(surfaces) == 1 else None


def source_css(path):
    source = path.read_text(encoding='utf-8')
    if path.suffix.lower() not in ('.html', '.htm'):
        return source
    parser = Styles()
    parser.feed(source)
    return '\n'.join(parser.blocks)


def opaque_hex(value, values):
    reference = re.fullmatch(r'var\(\s*(--[\w-]+)\s*\)', value.strip(), flags=re.I)
    if reference:
        value = values.get(reference.group(1).lower(), '')
    try:
        return color(value)
    except ValueError:
        return None


def token_roles(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    roots = re.findall(r':root\s*\{([^{}]*)\}', css, flags=re.I)
    values = {}
    for root in roots:
        for name, value in re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+)', root):
            values.setdefault(name.lower(), value.strip())
    background = None
    body = re.search(r'\bbody\s*\{([^{}]*)\}', css, flags=re.I)
    html = re.search(r'\bhtml\s*\{([^{}]*)\}', css, flags=re.I)
    root = re.search(r':root\s*\{([^{}]*)\}', css, flags=re.I)
    for rule in (body, html, root):
        if not rule:
            continue
        declaration = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', rule.group(1), flags=re.I)
        if declaration:
            value = declaration.group(1).strip()
            reference = re.fullmatch(r'var\(\s*(--[\w-]+)\s*\)', value)
            background = (reference.group(1).lower(), values.get(reference.group(1).lower())) if reference else ('body' if rule is body else 'html' if rule is html else ':root', value)
            break
    used = set()
    for selector, declarations in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
        foreground = re.search(r'(?:^|;)\s*color\s*:\s*var\(\s*(--[\w-]+)\s*\)', declarations, flags=re.I)
        if not foreground:
            continue
        local = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', declarations, flags=re.I)
        page_rule = bool(re.search(r'\b(?:html|body)\b|:root', selector, flags=re.I))
        if page_rule or not local or opaque_hex(local.group(1), values) is None:
            used.add(foreground.group(1))
    text_roles = {'ink', 'text', 'muted', 'secondary', 'subtle', 'caption', 'label',
                  'body-text', 'copy-text', 'text-primary', 'text-secondary',
                  'text-muted', 'text-subtle', 'text-caption', 'text-label'}
    foregrounds = {name.lower():values[name.lower()] for name in used
                   if name.lower() in values and name.lower()[2:] in text_roles}
    return background, foregrounds, values


def direct_colors(css, background, values, nodes=None):
    """Flag resolvable text colors with a measurable local or likely background."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    checks = []
    rules = [(selector.strip(), declarations) for selector, declarations
             in re.findall(r'([^{}]+)\{([^{}]*)\}', css)]
    fills = {}
    for selector, declarations in rules:
        local = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', declarations, flags=re.I)
        if local:
            resolved = opaque_hex(local.group(1).strip(), values)
            if resolved is not None:
                fills[selector] = resolved
    for selector, declarations in rules:
        foreground = re.search(r'(?:^|;)\s*color\s*:\s*([^;{}]+)', declarations, flags=re.I)
        if not foreground:
            continue
        raw_foreground = foreground.group(1).strip()
        foreground_reference = re.fullmatch(r'var\(\s*(--[\w-]+)\s*\)', raw_foreground, flags=re.I)
        fg = opaque_hex(raw_foreground, values)
        if fg is None:
            continue
        local = re.search(r'(?:^|;)\s*background(?:-color)?\s*:\s*([^;{}]+)', declarations, flags=re.I)
        chosen = background
        scope = 'page background approximation'
        if local:
            value = local.group(1).strip()
            resolved = opaque_hex(value, values)
            if resolved is not None:
                chosen = ('same rule', resolved)
                scope = 'same rule'
        if scope != 'same rule':
            parts = selector.split()
            for length in range(len(parts)-1, 0, -1):
                ancestor = ' '.join(parts[:length])
                if ancestor in fills:
                    chosen = (ancestor, fills[ancestor])
                    scope = 'selector ancestor approximation'
                    break
        if scope == 'page background approximation' and nodes:
            resolved = dom_background(selector, nodes, fills)
            if resolved is not None:
                chosen = ('DOM ancestor', resolved)
                scope = 'DOM ancestor approximation'
        # --on-* tokens usually belong to a surface expressed elsewhere;
        # guessing the page canvas for them creates distracting false alarms.
        if foreground_reference and foreground_reference.group(1).lower().startswith('--on-') and scope == 'page background approximation':
            continue
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
        elements = None
        if path.suffix.lower() in ('.html', '.htm'):
            parser = Elements()
            parser.feed(path.read_text(encoding='utf-8'))
            elements = parser.nodes
        background, foregrounds, values = token_roles(css)
        if not background:
            limitations.append(f'{path}: page background not found')
            continue
        try:
            bg = color(background[1])
        except ValueError:
            limitations.append(f'{path}: page background {background[0]} is not opaque hex')
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
        for item in direct_colors(css, background, values, elements):
            direct_checks.append({'file': str(path), **item})
    return {'scope': 'Likely small-text token, variable and direct-hex pairs; unresolved surfaces and typography need rendered review',
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
