"""Render actual text in font shortlists. Adjust perceived size, not a premium score."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse


def render(data):
    e = html.escape
    cards, rules = [], []
    for index, font in enumerate(data['fonts']):
        name = font['name']; source = font.get('source')
        weight = re.fullmatch(r'(\d{1,4})(?:[ –-]+(\d{1,4}))?', str(font.get('weight_range', '400')))
        if not weight or any(not 1 <= int(x) <= 1000 for x in weight.groups() if x): raise ValueError('Numeric weight range required, e.g. 400 or 100 900')
        values = [int(x) for x in weight.groups() if x]
        if len(values) == 2 and values[1] < values[0]: raise ValueError('Weight range must increase')
        weight_css = ' '.join(map(str,values))
        if source in ('system-ui', 'system'): source = None
        if source:
            if urlparse(source).scheme not in ('', 'https', 'http') or any(c in source for c in "'\"\n\r\\()<>;"):
                raise ValueError('Use a plain relative or http(s) font URL')
            rules.append(f"@font-face{{font-family:study{index};src:url('{source}');font-weight:{weight_css};font-display:swap}}")
        family = f'study{index}' if source else 'system-ui'
        cards.append(f'''<article style="font-family:{family},system-ui"><header><strong>{e(name)}</strong><span>Reported coverage: {e(font.get('coverage','unverified'))}. Verify glyphs in the actual font.</span></header><label>Heading size <input type="range" min="22" max="72" value="40" oninput="this.closest('article').style.setProperty('--size',this.value+'px')"></label><h2>{e(data['heading'])}</h2><p>{e(data['body'])}</p><button style="max-width:100%;overflow-wrap:anywhere">{e(data['label'])}</button><p class="numbers">{e(data['numbers'])}</p><p>{e(data.get('long_content',''))}</p><small>{e(font.get('notes','Verify supported weights, glyphs and fallback in the actual project.'))}</small></article>''')
    return '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Typography study</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f5f3;color:#222;font:15px/1.5 system-ui}main{max-width:1300px;margin:auto;padding:32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:24px}article{min-width:0;background:white;padding:24px}header{font:14px/1.5 system-ui;display:grid;gap:4px}label{display:block;font:12px system-ui;margin:24px 0}h2{font-size:var(--size,40px);font-weight:500;line-height:1.12;overflow-wrap:anywhere}p{font-size:16px}.numbers{font-variant-numeric:tabular-nums}button{font:inherit;padding:10px 16px}small{font:12px/1.4 system-ui}''' + ''.join(rules) + '</style><main><h1>Typography study</h1><p>Match perceived size using the sliders. Inspect line breaks, labels, long content, numerals and fallback. Equal CSS sizes are only a starting point.</p><div class="grid">' + ''.join(cards) + '</div></main></html>'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('input', type=Path); parser.add_argument('--out', type=Path, required=True); args = parser.parse_args()
    try:
        document = render(json.loads(args.input.read_text(encoding='utf-8')))
        args.out.parent.mkdir(parents=True, exist_ok=True); args.out.write_text(document, encoding='utf-8')
    except (ValueError, OSError, KeyError, TypeError) as error: parser.exit(1, str(error) + '\n')
