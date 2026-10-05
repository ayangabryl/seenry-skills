"""Render a Seenry design sheet: why this design, what was researched, how it is built, and how to keep it consistent.

Python 3.9+, standard library only. One self-contained HTML file (fonts and local images embedded), styled like
seenry.design so anyone who opens it knows where it came from.

  python3 sheet.py .seenry/sheet.json                         # writes .seenry/sheet.html
  python3 sheet.py .seenry/sheet.json --out design-sheet.html
  python3 sheet.py .seenry/sheet.json --palette "#5b5bd6"     # fill color swatches and contrast from palette.py
  python3 sheet.py --example > .seenry/sheet.json             # a filled-in starting record

The record's shape is documented in references/sheet.md. Every section is optional except project and pointOfView;
empty sections are omitted rather than padded.
"""
import argparse
import base64
import html
import importlib.util
import json
import mimetypes
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / 'assets' / 'sheet'
VERSION = '3.0.0'
MAX_IMAGE = 4_000_000


def esc(value):
    return html.escape(str(value if value is not None else ''), quote=True)


def data_uri(path, base):
    if not path:
        return ''
    if path.startswith(('http://', 'https://', 'data:')):
        return path
    file = (base / path).resolve() if not Path(path).is_absolute() else Path(path)
    if not file.is_file():
        print(f'warning: image not found, skipped: {path}', file=sys.stderr)
        return ''
    raw = file.read_bytes()
    if len(raw) > MAX_IMAGE:
        print(f'warning: {path} is {len(raw) // 1024} KB; export a smaller JPEG/WebP for the sheet', file=sys.stderr)
    mime = mimetypes.guess_type(file.name)[0] or 'image/png'
    return f'data:{mime};base64,{base64.b64encode(raw).decode()}'


def font_faces():
    faces = []
    for weight, name in ((400, 'Regular'), (500, 'Medium'), (600, 'Semibold')):
        file = ASSETS / f'runde-{name}.woff2'
        if file.is_file():
            faces.append(f"@font-face{{font-family:Runde;font-weight:{weight};font-display:swap;"
                         f"src:url(data:font/woff2;base64,{base64.b64encode(file.read_bytes()).decode()}) format('woff2')}}")
    return '\n'.join(faces)


def host(url):
    try:
        return urlparse(url).netloc.replace('www.', '') or url
    except Exception:
        return url


def link(url, text=None):
    if not url:
        return esc(text or '')
    return f'<a href="{esc(url)}" target="_blank" rel="noopener">{esc(text or host(url))}</a>'


def figure(src, alt, base, caption=None, cls='media'):
    uri = data_uri(src, base)
    if not uri:
        return ''
    cap = f'<figcaption>{esc(caption)}</figcaption>' if caption else ''
    return f'<figure class="{cls}"><img src="{uri}" alt="{esc(alt)}">{cap}</figure>'


def rows(pairs):
    out = []
    for label, value in pairs:
        if value:
            value = value if isinstance(value, str) else '; '.join(map(str, value))
            out.append(f'<div class="kv"><dt>{esc(label)}</dt><dd>{esc(value)}</dd></div>')
    return f'<dl class="kvs">{"".join(out)}</dl>' if out else ''


def section(sid, title, intro, body):
    if not body:
        return ''
    lead = f'<p class="intro">{esc(intro)}</p>' if intro else ''
    return f'<section id="{sid}"><h2>{esc(title)}</h2>{lead}{body}</section>'


# --- sections ------------------------------------------------------------------------------------------------
def result_section(r, base):
    res = r.get('result') or {}
    images = res.get('images') or []
    figs = ''.join(figure(i.get('src'), i.get('caption') or r['project'], base, i.get('caption'),
                          'media phone' if i.get('viewport') == 'phone' else 'media') for i in images)
    if not figs:
        return ''
    live = f'<p class="note">{link(res.get("url"), "Open the live page")}</p>' if res.get('url') else ''
    return f'<div class="panel result">{figs}</div>{live}'


def brand_section(r):
    b = r.get('brand') or {}
    head = rows([('Concept', b.get('concept')), ('Voice', b.get('voice')), ('Imagery', b.get('imagery')),
                 ('Signature', b.get('signature'))])
    rejected = ''.join(f'<div class="decision"><h3>{esc(x.get("name"))}</h3><div><p class="choice">Rejected</p>'
                       f'<p class="why">{esc(x.get("why"))}</p></div></div>' for x in b.get('rejected') or [])
    if not head and not rejected:
        return ''
    alt = f'<h3>Directions not taken</h3><div class="panel list">{rejected}</div>' if rejected else ''
    return f'<div class="panel">{head}</div>{alt}'


def decisions_section(r):
    items = r.get('decisions') or []
    if not items:
        return ''
    out = []
    for d in items:
        ev = f'<p class="evidence">Evidence: {esc(d["evidence"])}</p>' if d.get('evidence') else ''
        out.append(f'<div class="decision"><h3>{esc(d.get("topic"))}</h3><div><p class="choice">{esc(d.get("choice"))}</p>'
                   f'<p class="why">{esc(d.get("why"))}</p>{ev}</div></div>')
    return f'<div class="panel list">{"".join(out)}</div>'


def ref_card(ref, base):
    img = figure(ref.get('image'), ref.get('name'), base)
    via = ref.get('via') or ''
    tag = f'<span class="tag">{esc(via)}</span>' if via else ''
    body = rows([('Seen', ref.get('seen')), ('Measured', ref.get('measured')), ('Adopted', ref.get('adopt')), ('Avoided', ref.get('avoid'))])
    return (f'<article class="card">{img}<div class="card-body"><div class="card-head"><h3>{esc(ref.get("name"))}</h3>{tag}</div>'
            f'<p class="src">{link(ref.get("url"))}</p>{body}</div></article>')


def research_section(r, base):
    res = r.get('research') or {}
    refs = res.get('references') or []
    if not refs and not res.get('patterns'):
        return ''
    method = res.get('method') or ('Seenry MCP' if res.get('mcp') else 'Web and benchmarks')
    meta = f'<p class="note">Research through {esc(method)}. {len(refs)} reference{"s" if len(refs) != 1 else ""} inspected at real pixels.</p>'
    groups = []
    for key, title, sub in (('leader', 'Category leaders', 'Chosen before searching, for doing this job best.'),
                            ('discovered', 'Discovered while exploring', 'Found by the open category search, not known in advance.'),
                            ('inspiration', 'Inspiration', 'Outside the category; taught one specific idea.')):
        group = [x for x in refs if (x.get('role') or 'leader') == key]
        if group:
            groups.append(f'<h3 class="group">{esc(title)}</h3><p class="group-sub">{esc(sub)}</p>'
                          f'<div class="cards">{"".join(ref_card(x, base) for x in group)}</div>')
    pat = res.get('patterns') or {}
    cols = []
    for key, title in (('tableStakes', 'Everyone does'), ('edge', 'Only the best do'), ('opening', 'Our opening')):
        items = pat.get(key) or []
        if items:
            cols.append(f'<div class="col"><h3>{esc(title)}</h3><ul>{"".join(f"<li>{esc(i)}</li>" for i in items)}</ul></div>')
    patterns = f'<div class="panel cols">{"".join(cols)}</div>' if cols else ''
    return meta + ''.join(groups) + patterns


def exploration_section(r, base):
    ex = r.get('exploration') or {}
    variants = ex.get('variants') or []
    if not variants:
        return ''
    axes = f'<p class="note">Varied inside one frame on: {esc(", ".join(ex.get("axes") or []))}.</p>' if ex.get('axes') else ''
    cards = []
    for v in variants:
        chosen = (v.get('verdict') or '').lower() == 'chosen'
        cards.append(f'<article class="card{" chosen" if chosen else ""}">{figure(v.get("image"), v.get("name"), base)}<div class="card-body">'
                     f'<div class="card-head"><h3>{esc(v.get("name"))}</h3><span class="tag{" on" if chosen else ""}">{"Chosen" if chosen else "Not chosen"}</span></div>'
                     f'<p class="why">{esc(v.get("why"))}</p></div></article>')
    return axes + f'<div class="cards">{"".join(cards)}</div>'


def color_section(r):
    c = r.get('color') or {}
    sw = c.get('swatches') or []
    if not sw:
        return ''
    tiles = ''.join(f'<div class="swatch"><span class="chip" style="background:{esc(s.get("value"))}"></span>'
                    f'<p class="sw-name">{esc(s.get("name"))}</p><p class="sw-val">{esc(s.get("value"))}</p>'
                    f'<p class="sw-role">{esc(s.get("role"))}</p></div>' for s in sw)
    why = f'<p class="lede-s">{esc(c.get("why"))}</p>' if c.get('why') else ''
    src = f'<p class="note">Source: {esc(c.get("source"))}</p>' if c.get('source') else ''
    table = ''
    if c.get('contrast'):
        trs = ''.join(f'<tr><td>{esc(x.get("pair"))}</td><td>{esc(x.get("ratio"))}</td><td>{esc(x.get("apca"))}</td>'
                      f'<td><span class="dot {"ok" if x.get("pass") else "no"}"></span>{"Pass" if x.get("pass") else "Fail"}</td></tr>' for x in c['contrast'])
        table = f'<div class="panel"><table><thead><tr><th>Pair</th><th>WCAG</th><th>APCA Lc</th><th>Result</th></tr></thead><tbody>{trs}</tbody></table></div>'
    return why + src + f'<div class="swatches">{tiles}</div>' + table


def type_section(r):
    t = r.get('type') or {}
    if not t.get('family'):
        return ''
    load = f'@import url("{esc(t["cssUrl"])}");' if t.get('cssUrl') else ''
    fam = t.get('css') or f'"{t["family"]}", system-ui, sans-serif'
    scale = ''.join(f'<div class="scale-row"><p class="scale-meta">{esc(s.get("role"))}<span>{esc(s.get("size"))} / {esc(s.get("weight"))}'
                    f'{" · " + esc(s.get("tracking")) if s.get("tracking") else ""}</span></p>'
                    f'<p class="scale-sample" style="font-family:{esc(fam)};font-size:{esc(s.get("size"))};font-weight:{esc(s.get("weight"))};'
                    f'letter-spacing:{esc(s.get("tracking") or "normal")}">{esc(s.get("sample") or r["project"])}</p></div>' for s in t.get('scale') or [])
    info = rows([('Family', t.get('family')), ('Source', t.get('source')), ('Why', t.get('why'))])
    return (f'<style>{load}</style><div class="panel type"><p class="specimen" style="font-family:{esc(fam)}">Aa</p>{info}</div>'
            + (f'<div class="panel list">{scale}</div>' if scale else ''))


def anatomy_section(r, base):
    items = r.get('anatomy') or []
    out = []
    for a in items:
        spec = rows(list((a.get('spec') or {}).items()))
        img = figure(a.get('image'), a.get('component'), base)
        out.append(f'<article class="anatomy"><div>{img}</div><div><h3>{esc(a.get("component"))}</h3>{spec}</div></article>')
    return ''.join(out)


def guidelines_section(r, base):
    items = r.get('guidelines') or []
    out = []
    for g in items:
        do = g.get('do'); dont = g.get('dont')
        pair = ''
        if do or dont or g.get('doImage') or g.get('dontImage'):
            pair = (f'<div class="dodont"><div class="do">{figure(g.get("doImage"), "Do", base)}<p><span class="mark">Do</span>{esc(do)}</p></div>'
                    f'<div class="dont">{figure(g.get("dontImage"), "Don’t", base)}<p><span class="mark">Don’t</span>{esc(dont)}</p></div></div>')
        out.append(f'<article class="rule"><p class="area">{esc(g.get("area"))}</p><h3>{esc(g.get("rule"))}</h3>{pair}</article>')
    return ''.join(out)


def verification_section(r):
    v = r.get('verification') or {}
    checks = v.get('checks') or []
    if not checks and not v.get('notVerified'):
        return ''
    lis = ''.join(f'<li><span class="dot {"ok" if c.get("pass", True) else "no"}"></span><span>{esc(c.get("name"))}</span><span class="res">{esc(c.get("result"))}</span></li>' for c in checks)
    nv = ''.join(f'<li><span class="dot na"></span><span>{esc(x)}</span><span class="res">Not verified</span></li>' for x in v.get('notVerified') or [])
    return f'<div class="panel"><ul class="checks">{lis}{nv}</ul></div>'


CSS = """
:root{--canvas:#fafafa;--surface:#fff;--sunken:#f3f3f3;--text:#272727;--muted:#666;--faint:#8a8a8a;--line:#e8e8e8;--ring:#0000000f}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--canvas);color:var(--text);font:400 15px/24px Runde,ui-sans-serif,system-ui,sans-serif;font-synthesis:none;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:underline;text-decoration-color:#bbb;text-underline-offset:3px}a:hover{text-decoration-color:currentColor}
a:focus-visible{outline:2px solid #666;outline-offset:4px;border-radius:4px}
.wrap{width:min(100% - 48px,1240px);margin-inline:auto}
@media(min-width:900px){.wrap{width:min(100% - 96px,1240px)}}
header.top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px 0}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;text-decoration:none}
.brand i{width:16px;height:16px;border-radius:5px;background:linear-gradient(#373737,#242424);box-shadow:inset 0 1px #ffffff25}
.meta-top{display:flex;gap:8px;align-items:center;color:var(--muted);font-size:13px}
.pill{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:99px;background:var(--surface);box-shadow:0 0 0 1px var(--line);font-size:13px;color:var(--muted)}
.hero{padding:48px 0 32px;max-width:760px}
h1{margin:0;font-weight:500;font-size:clamp(32px,5vw,48px);line-height:1.08;letter-spacing:-0.025em;text-wrap:balance}
.lede{margin:16px 0 0;font-size:17px;line-height:28px;color:var(--muted);text-wrap:pretty}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
nav.toc{display:flex;flex-wrap:wrap;gap:4px 16px;padding:16px 0 8px;font-size:13px;color:var(--muted)}
nav.toc a{text-decoration:none}nav.toc a:hover{color:var(--text)}
section{padding:56px 0 8px}
h2{margin:0;font-weight:500;font-size:28px;line-height:34px;letter-spacing:-0.015em}
.intro{margin:8px 0 24px;color:var(--muted);max-width:704px}
h3{margin:0;font-weight:500;font-size:15px;line-height:22px}
.panel{background:var(--surface);border-radius:24px;box-shadow:0 0 0 1px var(--line),0 8px 24px #00000006;padding:24px;margin-top:16px}
.media{margin:0}.media img{display:block;width:100%;height:auto;border-radius:12px;outline:1px solid #0000001a;outline-offset:-1px;background:var(--sunken)}
.phone img{aspect-ratio:390/760;object-fit:cover;object-position:top}
.media figcaption{margin-top:8px;font-size:13px;color:var(--faint)}
.result{display:grid;gap:24px;align-items:start}
@media(min-width:900px){.result:has(.phone){grid-template-columns:3fr 1fr}}
.note{margin:12px 0 0;font-size:13px;line-height:20px;color:var(--faint)}
.list>*+*{border-top:1px solid var(--line);margin-top:16px;padding-top:16px}
.decision{display:grid;gap:4px 24px}
@media(min-width:760px){.decision{grid-template-columns:200px 1fr}}
.choice{margin:0;font-weight:500}.why{margin:4px 0 0;color:var(--muted)}.evidence{margin:6px 0 0;font-size:13px;line-height:20px;color:var(--faint)}
.group{margin-top:32px}.group-sub{margin:2px 0 0;color:var(--faint);font-size:13px}
.cards{display:grid;gap:16px;margin-top:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.card{background:var(--surface);border-radius:24px;box-shadow:0 0 0 1px var(--line);padding:12px;display:flex;flex-direction:column;gap:12px}
.card.chosen{box-shadow:0 0 0 1.5px #272727}
.card-body{padding:4px 8px 8px}.card-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.src{margin:2px 0 0;font-size:13px;color:var(--faint)}
.tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:99px;background:var(--sunken);font-size:12px;color:var(--muted)}
.tag.on{background:linear-gradient(#373737,#242424);color:#fff;box-shadow:inset 0 1px #ffffff25}
.kvs{margin:12px 0 0;display:grid;gap:8px}.kv{display:grid;grid-template-columns:76px 1fr;gap:8px;font-size:13px;line-height:20px}
.kv dt{color:var(--faint)}.kv dd{margin:0}
.cols{display:grid;gap:24px}@media(min-width:760px){.cols{grid-template-columns:repeat(3,1fr)}}
.col ul{margin:8px 0 0;padding-left:18px;color:var(--muted)}.col li+li{margin-top:4px}
.lede-s{margin:0 0 8px;max-width:704px}
.swatches{display:grid;gap:12px;margin-top:16px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.swatch{background:var(--surface);border-radius:24px;box-shadow:0 0 0 1px var(--line);padding:8px 8px 12px}
.chip{display:block;height:72px;border-radius:16px;box-shadow:inset 0 0 0 1px #0000000f}
.sw-name{margin:10px 8px 0;font-weight:500;font-size:13px;line-height:20px}.sw-val{margin:0 8px;font:12px/18px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted)}
.sw-role{margin:2px 8px 0;font-size:12px;line-height:18px;color:var(--faint)}
table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;font-weight:500;color:var(--faint);padding:0 0 8px}
td{padding:10px 0;border-top:1px solid var(--line);font-variant-numeric:tabular-nums}
.dot{display:inline-block;width:8px;height:8px;border-radius:99px;margin-right:8px;vertical-align:1px}.dot.ok{background:#2f9e5b}.dot.no{background:#d64545}.dot.na{background:#c4c4c4}
.type{display:grid;gap:24px;align-items:center}@media(min-width:760px){.type{grid-template-columns:160px 1fr}}
.specimen{margin:0;font-size:112px;line-height:1;letter-spacing:-0.04em}
.scale-row{display:grid;gap:4px 24px;align-items:baseline}@media(min-width:760px){.scale-row{grid-template-columns:200px 1fr}}
.scale-meta{margin:0;font-weight:500}.scale-meta span{display:block;font-weight:400;font-size:13px;color:var(--faint)}
.scale-sample{margin:0;line-height:1.2;overflow-wrap:anywhere}
.anatomy{display:grid;gap:24px;align-items:start;margin-top:16px;background:var(--surface);border-radius:24px;box-shadow:0 0 0 1px var(--line);padding:24px}
@media(min-width:900px){.anatomy{grid-template-columns:3fr 2fr}}
.rule{background:var(--surface);border-radius:24px;box-shadow:0 0 0 1px var(--line);padding:24px;margin-top:16px}
.area{margin:0 0 4px;font-size:13px;color:var(--faint)}.rule h3{font-size:17px;line-height:26px;max-width:704px}
.dodont{display:grid;gap:16px;margin-top:16px}@media(min-width:760px){.dodont{grid-template-columns:1fr 1fr}}
.do,.dont{border-radius:16px;padding:12px;background:var(--sunken)}.do p,.dont p{margin:8px 4px 4px}
.mark{display:inline-flex;align-items:center;height:22px;padding:0 8px;margin-right:8px;border-radius:99px;font-size:12px;font-weight:500;background:var(--surface);box-shadow:0 0 0 1px var(--line)}
.do .mark::before{content:"";width:6px;height:6px;border-radius:99px;background:#2f9e5b;margin-right:6px}
.dont .mark::before{content:"";width:6px;height:6px;border-radius:99px;background:#d64545;margin-right:6px}
.checks{list-style:none;margin:0;padding:0}.checks li{display:grid;grid-template-columns:16px 1fr auto;gap:8px;align-items:baseline;padding:10px 0}
.checks li+li{border-top:1px solid var(--line)}.res{color:var(--faint);font-size:13px;text-align:right}
footer.bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;padding:64px 0 40px;color:var(--faint);font-size:13px}
@media print{body{background:#fff}.panel,.card,.rule,.anatomy,.swatch{box-shadow:0 0 0 1px #ddd}section{break-inside:avoid-page}}
"""

SECTIONS = (
    ('result', 'The result', 'What was built, at desktop and phone width.'),
    ('brand', 'Brand', 'The concept behind the design, its voice and material, and the directions it beat.'),
    ('why', 'Why this design', 'Each decision, the reason for it, and the evidence behind it.'),
    ('research', 'Research', 'Real products studied before designing, and what each one taught.'),
    ('exploration', 'Exploration', 'Compositions built inside the same frame and compared side by side.'),
    ('color', 'Color', 'The palette, what each color is for, and measured contrast.'),
    ('type', 'Typography', 'The type family and scale.'),
    ('anatomy', 'Anatomy', 'How each component is constructed: grid, safe space, keylines and type.'),
    ('guidelines', 'Guidelines', 'Rules for keeping future work consistent with this design.'),
    ('verification', 'Verification', 'What was checked, and what still needs a human or a device.'),
)


def palette_fill(record, brand):
    spec = importlib.util.spec_from_file_location('seenry_palette', HERE / 'palette.py')
    pal = importlib.util.module_from_spec(spec); spec.loader.exec_module(pal)
    accent, anchor, (L0, C0, H) = pal.ramp(brand)
    neutral, _, _ = pal.ramp(brand, neutral=True)
    light, dark = pal.semantic(accent, neutral, anchor)
    color = record.setdefault('color', {})
    color.setdefault('source', f'palette.py from brand {brand} (oklch {L0:.3f} {C0:.3f} {H:.1f})')
    roles = {'bg': 'Page background', 'bg-surface': 'Cards and panels', 'text': 'Primary text', 'text-secondary': 'Secondary text',
             'border': 'Dividers and card edges', 'accent-solid': 'Primary action', 'accent-subtle': 'Selection and tints', 'focus': 'Focus ring'}
    color.setdefault('swatches', [{'name': k, 'value': light[k], 'role': v} for k, v in roles.items()])
    rows_out = []
    for theme, name in ((light, 'Light'), (dark, 'Dark')):
        for fg, bg, kind in pal.PAIRS:
            ratio, lc = pal.wcag(theme[fg], theme[bg]), abs(pal.apca(theme[fg], theme[bg]))
            rows_out.append({'pair': f'{name}: {fg} on {bg}', 'ratio': f'{ratio:.2f}:1', 'apca': f'{lc:.0f}', 'pass': pal.passes(theme[fg], theme[bg], kind)})
    color.setdefault('contrast', rows_out)


def render(record, base):
    for key in ('project', 'pointOfView'):
        if not record.get(key):
            raise SystemExit(f'sheet record needs "{key}"')
    parts = {
        'result': result_section(record, base), 'brand': brand_section(record), 'why': decisions_section(record), 'research': research_section(record, base),
        'exploration': exploration_section(record, base), 'color': color_section(record), 'type': type_section(record),
        'anatomy': anatomy_section(record, base), 'guidelines': guidelines_section(record, base), 'verification': verification_section(record),
    }
    body = ''.join(section(sid, title, intro, parts[sid]) for sid, title, intro in SECTIONS)
    toc = ''.join(f'<a href="#{sid}">{esc(title)}</a>' for sid, title, _ in SECTIONS if parts[sid])
    res = record.get('research') or {}
    refs = res.get('references') or []
    facts = [f'{len(refs)} references'] if refs else []
    if res.get('mcp'):
        facts.append('Seenry MCP')
    if (record.get('exploration') or {}).get('variants'):
        facts.append(f'{len(record["exploration"]["variants"])} variants explored')
    if record.get('stack'):
        facts.append(record['stack'])
    fact_html = ''.join(f'<span class="pill">{esc(f)}</span>' for f in facts)
    day = record.get('date') or date.today().isoformat()
    brief = f'<p class="lede">{esc(record["pointOfView"])}</p>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(record['project'])} · Seenry design sheet</title>
<meta name="generator" content="Seenry {VERSION}">
<style>{font_faces()}{CSS}</style></head>
<body><div class="wrap">
<header class="top"><a class="brand" href="https://seenry.design" target="_blank" rel="noopener"><i></i>Seenry</a>
<div class="meta-top"><span class="pill">Design sheet</span><span>{esc(day)}</span></div></header>
<div class="hero"><h1>{esc(record['project'])}</h1>{brief}{f'<p class="note">{esc(record["brief"])}</p>' if record.get('brief') else ''}<div class="facts">{fact_html}</div></div>
<nav class="toc" aria-label="Sheet sections">{toc}</nav>
<main>{body}</main>
<footer class="bottom"><span>Made with Seenry {VERSION}. Keep this sheet with the project; update it when a decision changes.</span><a href="https://seenry.design" target="_blank" rel="noopener">seenry.design</a></footer>
</div></body></html>
"""


EXAMPLE = {
    'project': 'Hearth pricing',
    'date': '2026-09-29',
    'pointOfView': 'A calm, tool-like pricing section where the price is the loudest thing and the recommended plan is obvious without shouting.',
    'brief': 'Three plans for a developer platform; web, light and dark; must work at 390px.',
    'stack': 'HTML + CSS',
    'result': {'images': [{'src': 'shots/pricing-1440.png', 'caption': 'Desktop, 1440'}, {'src': 'shots/pricing-390.png', 'caption': 'Phone, 390', 'viewport': 'phone'}]},
    'decisions': [
        {'topic': 'Tier container', 'choice': 'One container divided by hairlines', 'why': 'Reads as one comparison instead of three competing cards; the leaders all do it.', 'evidence': 'Vercel and Linear pricing (Seenry MCP)'},
        {'topic': 'Emphasis', 'choice': 'Only the recommended button is filled', 'why': 'One primary action per view; the badge marks it without scaling the card.'},
    ],
    'research': {'mcp': True, 'method': 'Seenry MCP', 'references': [
        {'name': 'Vercel pricing', 'url': 'https://vercel.com/pricing', 'role': 'leader', 'via': 'MCP', 'seen': 'Three tiers in one bordered container',
         'measured': 'price 40/500, plan name 13/500, pill CTAs', 'adopt': 'shared container, inheritance lines', 'avoid': 'icon per feature'},
        {'name': 'Linear pricing', 'url': 'https://linear.app/pricing', 'role': 'leader', 'via': 'MCP', 'seen': 'Hairline columns on dark', 'adopt': 'CTAs aligned across columns'},
        {'name': 'Acme Cloud', 'url': 'https://example.com', 'role': 'discovered', 'via': 'MCP', 'seen': 'Usage slider above tiers', 'adopt': 'nothing yet; noted for a usage-based plan'},
    ], 'patterns': {'tableStakes': ['Monthly/annual toggle', '3 tiers'], 'edge': ['Aligned rows across tiers'], 'opening': ['Show per-seat math inline']}},
    'exploration': {'axes': ['container', 'emphasis'], 'variants': [
        {'name': 'A. Shared container', 'verdict': 'chosen', 'why': 'Rows align across tiers; the price leads.'},
        {'name': 'B. Floating cards', 'verdict': 'rejected', 'why': 'Three shadows compete; misaligned buttons with long copy.'}]},
    'type': {'family': 'Inter', 'source': 'Google Fonts (OFL)', 'why': 'Neutral tool voice; tuned with cv11/ss01.',
             'css': '"Inter", system-ui, sans-serif', 'cssUrl': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
             'scale': [{'role': 'Price', 'size': '40px', 'weight': '500', 'tracking': '-0.02em', 'sample': '$16'},
                       {'role': 'Section title', 'size': '36px', 'weight': '600', 'tracking': '-0.02em', 'sample': 'Start free. Pay per seat.'},
                       {'role': 'Body', 'size': '14px', 'weight': '400', 'sample': 'For professionals shipping every week.'}]},
    'anatomy': [{'component': 'Pricing tier', 'image': 'shots/tier-anatomy.png',
                 'spec': {'Grid': '4px · inset 24 · container r16', 'Rows': 'subgrid: plan, price, description, button, features',
                          'Type': '14/500 · 40/500 tabular · 14/400', 'Color': 'one filled button on the recommended tier'}}],
    'guidelines': [
        {'area': 'Layout', 'rule': 'Plans share one container; never float tiers as separate shadowed cards.', 'do': 'Hairline dividers, aligned rows', 'dont': 'Three cards with drop shadows'},
        {'area': 'Color', 'rule': 'Only the recommended plan gets the filled accent button.', 'do': 'One filled, others outlined', 'dont': 'Every button filled'},
    ],
    'verification': {'checks': [{'name': 'System and optical audit, 1440 and 390', 'result': '0 findings', 'pass': True},
                                {'name': 'Contrast, light and dark', 'result': 'all pairs pass', 'pass': True}],
                     'notVerified': ['Screen reader pass', 'Real payment flow']},
}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('record', nargs='?')
    p.add_argument('--out')
    p.add_argument('--palette', metavar='HEX', help='fill color swatches and contrast from palette.py for this brand color')
    p.add_argument('--example', action='store_true', help='print an example record')
    a = p.parse_args(argv)
    if a.example:
        print(json.dumps(EXAMPLE, indent=2, ensure_ascii=False)); return 0
    if not a.record:
        p.error('give a sheet record (JSON), or --example')
    path = Path(a.record)
    record = json.loads(path.read_text(encoding='utf-8'))
    if a.palette:
        palette_fill(record, a.palette)
    out = Path(a.out) if a.out else path.with_suffix('.html')
    out.write_text(render(record, path.parent), encoding='utf-8')
    print(out)
    return 0


if __name__ == '__main__':
    sys.exit(main())
