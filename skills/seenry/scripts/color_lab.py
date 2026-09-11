"""Render an offline, same-content palette comparison; audit opaque sRGB role pairs.

No network, browser, package or MCP dependency. Contrast is not a beauty score.
"""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path

ROLES = ('canvas', 'surface', 'text', 'muted', 'controlBorder', 'action',
         'onAction', 'actionHover', 'focus', 'error', 'errorSurface',
         'selected', 'onSelected')
COPY = ('title', 'body', 'label', 'value', 'action', 'selected', 'error', 'confirmation')
PAIRS = (
    ('Text on canvas', 'text', 'canvas', 4.5),
    ('Text on surface', 'text', 'surface', 4.5),
    ('Secondary text', 'muted', 'surface', 4.5),
    ('Action label', 'onAction', 'action', 4.5),
    ('Hovered action label', 'onAction', 'actionHover', 4.5),
    ('Selected label', 'onSelected', 'selected', 4.5),
    ('Error explanation', 'error', 'errorSurface', 4.5),
    ('Input boundary', 'controlBorder', 'surface', 3.0),
    ('Focus on surface', 'focus', 'surface', 3.0),
)


def color(value):
    if not isinstance(value, str) or not re.fullmatch(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?', value):
        raise ValueError(f'Expected opaque #RGB or #RRGGBB sRGB color, received {value!r}')
    if len(value) == 4:
        value = '#' + ''.join(c * 2 for c in value[1:])
    return value.upper()


def luminance(value):
    value = color(value)
    channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(c * w for c, w in zip(linear, (.2126, .7152, .0722)))


def contrast(foreground, background):
    a, b = sorted((luminance(foreground), luminance(background)))
    return (b + .05) / (a + .05)


def normalize(data):
    if not isinstance(data, dict) or not isinstance(data.get('copy'), dict):
        raise ValueError('Input needs a copy object and a palettes list.')
    copy = {}
    for key in COPY:
        value = data['copy'].get(key)
        if not isinstance(value, str) or not value.strip() or len(value) > 2000:
            raise ValueError(f'copy.{key} must contain 1–2000 characters.')
        copy[key] = value
    palettes = data.get('palettes')
    if not isinstance(palettes, list) or not 2 <= len(palettes) <= 6:
        raise ValueError('Compare 2–6 palettes on the same content.')
    normalized = []
    for palette in palettes:
        if not isinstance(palette, dict) or not isinstance(palette.get('roles'), dict):
            raise ValueError('Each palette needs a roles object.')
        item = {}
        for key in ('name', 'intent', 'counterexample'):
            value = palette.get(key)
            if not isinstance(value, str) or not value.strip() or len(value) > 1000:
                raise ValueError(f'Each palette needs {key} (1–1000 characters).')
            item[key] = value
        missing = set(ROLES) - set(palette['roles'])
        unknown = set(palette['roles']) - set(ROLES)
        if missing or unknown:
            raise ValueError(f'Palette roles: missing={sorted(missing)}, unknown={sorted(unknown)}')
        item['roles'] = {role: color(palette['roles'][role]) for role in ROLES}
        normalized.append(item)
    return {'copy': copy, 'palettes': normalized}


def audit(data, achromatic_roles=()):
    unknown = set(achromatic_roles) - set(ROLES)
    if unknown:
        raise ValueError(f'Unknown achromatic roles: {sorted(unknown)}')
    results = []
    for palette in data['palettes']:
        roles = palette['roles']
        checks = []
        for label, foreground, background, minimum in PAIRS:
            ratio = contrast(roles[foreground], roles[background])
            checks.append({'label': label, 'foreground': foreground, 'background': background,
                           'ratio': ratio, 'minimum': minimum, 'pass': ratio >= minimum})
        constraints = []
        for role in dict.fromkeys(achromatic_roles):
            value = roles[role]
            constraints.append({'role': role, 'required': 'achromatic', 'value': value,
                                'pass': value[1:3] == value[3:5] == value[5:7]})
        results.append({'name': palette['name'], 'checks': checks,
                        'role_pairs_pass': all(c['pass'] for c in checks),
                        'brief_constraints': constraints,
                        'brief_constraints_pass': all(c['pass'] for c in constraints) if constraints else None})
    return {'schema': 1, 'scope': 'Opaque sRGB role pairs in this comparison shell only',
            'limitations': ['Not full WCAG conformance or an aesthetic score.',
                            'No image, gradient, alpha, wide-gamut or color-vision simulation.',
                            'Use final browser-resolved pairs and inspect the actual project.'],
            'achromatic_roles': list(dict.fromkeys(achromatic_roles)), 'palettes': results}


CSS = '''
*{box-sizing:border-box}body{margin:0;background:#f6f6f6;color:#202020;font:16px/1.5 system-ui,sans-serif}
main{max-width:1320px;margin:auto;padding:clamp(16px,4vw,56px)}h1{font-size:clamp(28px,4vw,44px);line-height:1.12;letter-spacing:-.035em;margin:0 0 16px}
.intro{max-width:72ch;margin-bottom:32px}.studies{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:32px}
.study{min-width:0;overflow-wrap:anywhere}pre{white-space:pre-wrap}.context{font-size:14px;margin:16px 0}.context p{margin:8px 0}.context h2{font-size:18px;margin:0}
.canvas{padding:clamp(16px,3vw,40px);background:var(--canvas);color:var(--text);border-radius:24px}
.specimen{padding:clamp(20px,3vw,32px);background:var(--surface);border-radius:16px;min-width:0}
.specimen h3{font-size:24px;line-height:1.2;letter-spacing:-.02em;margin:0 0 12px;overflow-wrap:anywhere}
.body{color:var(--muted);margin:0 0 24px;overflow-wrap:anywhere}.field{display:grid;gap:8px;font-size:14px}
input{font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--controlBorder);border-radius:8px;padding:12px;width:100%;min-width:0}
.selection{margin:20px 0;padding:12px 16px;border-radius:8px;background:var(--selected);color:var(--onSelected);font-size:14px;overflow-wrap:anywhere}
button{font:inherit;cursor:pointer}.action{border:0;border-radius:8px;background:var(--action);color:var(--onAction);padding:12px 18px;min-height:44px;max-width:100%;overflow-wrap:anywhere}
.action:hover{background:var(--actionHover)}.specimen :focus-visible{outline:2px solid var(--focus);outline-offset:4px}
.confirmation{margin:12px 0 0;min-height:3em;font-size:14px;overflow-wrap:anywhere}.error{background:var(--errorSurface);color:var(--error);border-radius:8px;padding:12px 16px;font-size:14px;margin:20px 0 0;overflow-wrap:anywhere}
details{margin-top:16px;font-size:14px}summary{cursor:pointer;min-height:32px}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
td,th{text-align:left;padding:6px 4px;vertical-align:top;border-bottom:1px solid #d0d0d0}th{font-weight:600}caption{text-align:left;margin-bottom:8px}code{overflow-wrap:anywhere}
@media(prefers-reduced-motion:no-preference){.action{transition:background-color 120ms linear}}
'''


def render(data, report):
    esc = html.escape
    c = {key: esc(value, quote=True) for key, value in data['copy'].items()}
    studies = []
    for index, (palette, result) in enumerate(zip(data['palettes'], report['palettes'])):
        style = ';'.join(f'--{key}:{value}' for key, value in palette['roles'].items())
        rows = ''.join(f'<tr><td>{esc(check["label"])}</td><td>{check["ratio"]:.3f}:1</td>'
                       f'<td>{"Pass" if check["pass"] else "Revise"} (≥{check["minimum"]}:1)</td></tr>'
                       for check in result['checks'])
        tokens = esc(json.dumps(palette['roles'], ensure_ascii=False, indent=2))
        constraint_note = ''
        if result['brief_constraints']:
            failures = [c['role'] for c in result['brief_constraints'] if not c['pass']]
            constraint_note = ('<p><strong>Brief constraint: ' +
                               ('Revise. These roles must be achromatic: ' + esc(', '.join(failures))
                                if failures else 'Pass. Specified roles are achromatic.') + '</strong></p>')
        studies.append(f'''<section class="study" aria-labelledby="name-{index}">
<div class="canvas" style="{style}"><article class="specimen">
<h3>{c['title']}</h3><p class="body">{c['body']}</p>
<label class="field" for="field-{index}">{c['label']}<input id="field-{index}" value="{c['value']}" autocomplete="off"></label>
<p class="selection">{c['selected']}</p><button class="action" type="button" data-confirm="{c['confirmation']}">{c['action']}</button>
<p class="confirmation" role="status" aria-live="polite"></p>
<p class="error">{c['error']}</p></article></div>
<div class="context"><h2 id="name-{index}">{esc(palette['name'])}</h2>
<p>{esc(palette['intent'])}</p><p><strong>Where it can fail:</strong> {esc(palette['counterexample'])}</p></div>
{constraint_note}<details><summary>Inspect role pairs and tokens</summary><table><caption>Ratios are displayed rounded; pass uses the unrounded result.</caption>
<thead><tr><th>Pair</th><th>Contrast</th><th>Check</th></tr></thead><tbody>{rows}</tbody></table><pre><code>{tokens}</code></pre></details></section>''')
    return '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seenry · Color comparison</title><style>''' + CSS + '''</style><main><header class="intro">
<h1>Same content. Different color decisions.</h1><p>A local study surface. Compare emphasis, readability and subject fit before choosing a palette. These examples are not a finished product layout.</p>
<p>Use Tab to inspect focus, hover the actions and edit the fields. Edits and confirmations stay synchronized across palettes. The action confirms this preview only; it does not save data. The error example stays visible for comparison.</p></header><div class="studies">''' + ''.join(studies) + '''</div></main>
<script>document.querySelectorAll('.action').forEach(button=>button.addEventListener('click',()=>{
document.querySelectorAll('.confirmation').forEach(status=>status.textContent=button.dataset.confirm);
}));document.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{
document.querySelectorAll('input').forEach(field=>field.value=input.value);
document.querySelectorAll('.confirmation').forEach(status=>status.textContent='');
}));</script></html>'''


def build(source, destination, achromatic_roles=()):
    raw = source.read_bytes()
    data = normalize(json.loads(raw.decode('utf-8')))
    report = audit(data, achromatic_roles)
    report['input_sha256'] = hashlib.sha256(raw).hexdigest()
    document = render(data, report)
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'index.html').write_text(document, encoding='utf-8')
    (destination / 'audit.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--achromatic-roles', nargs='+', choices=ROLES, default=[],
                        help='Only for an explicitly achromatic brief: roles that must have equal RGB channels.')
    args = parser.parse_args()
    try:
        result = build(args.input, args.out, args.achromatic_roles)
    except (ValueError, OSError) as exc:
        parser.exit(1, f'{exc}\n')
    print(json.dumps({'output': str(args.out.resolve()), 'palettes': len(result['palettes']),
                      'scope': result['scope']}, indent=2))
    if any(not p['role_pairs_pass'] or p['brief_constraints_pass'] is False for p in result['palettes']):
        parser.exit(2, 'Review required: at least one role-pair or declared brief constraint failed. Artifacts retained.\n')
