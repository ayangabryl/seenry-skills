"""Find, download and generate license-clear assets, and record provenance.

Python 3.9+, standard library only. Every command appends to <out>/manifest.json.

  images   Openverse search (CC0 / public domain by default), downloads files
  icons    Iconify search restricted to permissively licensed sets, downloads SVGs
  icon     Download named icons, e.g. lucide:play ph:pause-fill
  generate Text-to-image through OpenAI or Gemini when an API key is set
  sheet    Write contact.html showing every asset in the manifest for side-by-side review

Examples:
  python3 assets.py images "vinyl record studio" --count 6 --out assets/raw
  python3 assets.py icons "calendar" --set lucide --count 4 --out assets/icons
  python3 assets.py icon lucide:play lucide:pause --out assets/icons
  python3 assets.py generate "..." --provider openai --size 1536x1024 --out assets/gen
  python3 assets.py sheet --out assets/raw
"""
import argparse
import base64
import html
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) SeenryAssets/3.0'}
OPENVERSE = 'https://api.openverse.org/v1/images/'
ICONIFY = 'https://api.iconify.design'
# Icon sets whose licenses allow commercial use without attribution in the UI.
ICON_SETS = {
    'lucide': 'ISC', 'ph': 'MIT', 'tabler': 'MIT', 'heroicons': 'MIT', 'iconoir': 'MIT',
    'radix-icons': 'MIT', 'mingcute': 'Apache-2.0', 'solar': 'CC-BY-4.0', 'ri': 'Apache-2.0',
    'material-symbols': 'Apache-2.0', 'simple-icons': 'CC0-1.0 (brand marks remain trademarks)',
}
LICENSE_URLS = {'cc0': 'https://creativecommons.org/publicdomain/zero/1.0/',
                'pdm': 'https://creativecommons.org/publicdomain/mark/1.0/'}


def fetch(url, data=None, headers=None, limit=40_000_000):
    request = Request(url, data=data, headers={**UA, **(headers or {})})
    with urlopen(request, timeout=90) as response:
        return response.read(limit), response.headers.get('Content-Type', '')


def slug(text, size=48):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:size] or 'asset'


def manifest_path(out):
    return Path(out) / 'manifest.json'


def record(out, entries):
    path = manifest_path(out)
    existing = json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
    known = {e['file'] for e in existing}
    existing += [e for e in entries if e['file'] not in known]
    path.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return path


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def ext_for(content_type, url):
    for key, ext in (('png', '.png'), ('webp', '.webp'), ('svg', '.svg'), ('gif', '.gif')):
        if key in content_type or url.lower().split('?')[0].endswith(ext):
            return ext
    return '.jpg'


def cmd_images(args):
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    params = {'q': args.query, 'license': args.license, 'page_size': min(args.count * 3, 40), 'mature': 'false'}
    if args.orientation:
        params['aspect_ratio'] = {'landscape': 'wide', 'portrait': 'tall', 'square': 'square'}[args.orientation]
    if args.category:
        params['category'] = args.category
    data, _ = fetch(OPENVERSE + '?' + urlencode(params))
    results = json.loads(data).get('results', [])
    entries = []
    for item in results:
        if len(entries) >= args.count:
            break
        if (item.get('width') or 0) < args.min_width:
            continue
        url = item.get('url')
        try:
            body, ctype = fetch(url)
        except Exception as error:  # a dead source is common; keep scouting
            print(f'skip {url}: {error}', file=sys.stderr)
            continue
        name = f"{slug(item.get('title') or args.query)}-{item['id'][:8]}{ext_for(ctype, url)}"
        (out / name).write_bytes(body)
        license_code = item.get('license', '')
        entries.append({
            'file': name, 'kind': 'photo' if item.get('category') == 'photograph' else 'image',
            'title': item.get('title'), 'creator': item.get('creator'), 'creator_url': item.get('creator_url'),
            'source_page': item.get('foreign_landing_url'), 'source_file': url, 'provider': item.get('provider'),
            'license': f"{license_code.upper()} {item.get('license_version') or ''}".strip(),
            'license_url': item.get('license_url') or LICENSE_URLS.get(license_code),
            'attribution': item.get('attribution'), 'width': item.get('width'), 'height': item.get('height'),
            'query': args.query, 'retrieved': now(),
            'notes': 'Verify the source page still shows this license before shipping.',
        })
        print(f"{name}  {item.get('width')}x{item.get('height')}  {license_code}  {item.get('foreign_landing_url')}")
    path = record(out, entries)
    print(f'{len(entries)} image(s) → {path}')
    if not entries:
        print('Nothing usable. Openverse search is literal: use 1–2 concrete nouns ("vinyl", "portrait"), drop filters, '
              'lower --min-width, or allow attribution licenses with --license cc0,pdm,by.', file=sys.stderr)


def collection_license(prefix):
    try:
        data, _ = fetch(f'{ICONIFY}/collection?prefix={quote(prefix)}&info=true')
        info = json.loads(data).get('info', {})
        return (info.get('license') or {}).get('spdx') or ICON_SETS.get(prefix, 'unknown'), info.get('name', prefix)
    except Exception:
        return ICON_SETS.get(prefix, 'unknown'), prefix


def save_icons(names, out, size, color):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    entries, licenses = [], {}
    for full in names:
        prefix, _, name = full.partition(':')
        if prefix not in ICON_SETS:
            print(f'skip {full}: set "{prefix}" is not in the permissive allowlist {sorted(ICON_SETS)}', file=sys.stderr)
            continue
        query = {'height': size} if size else {}
        if color:
            query['color'] = color
        svg, _ = fetch(f'{ICONIFY}/{prefix}/{name}.svg' + ('?' + urlencode(query) if query else ''))
        file = f'{prefix}-{name}.svg'
        (out / file).write_bytes(svg)
        if prefix not in licenses:
            licenses[prefix] = collection_license(prefix)
        spdx, set_name = licenses[prefix]
        entries.append({'file': file, 'kind': 'icon', 'title': full, 'creator': set_name,
                        'source_page': f'https://icon-sets.iconify.design/{prefix}/{name}/',
                        'license': spdx, 'retrieved': now()})
        print(f'{file}  {spdx}')
    return record(out, entries), len(entries)


def cmd_icons(args):
    sets = [args.set] if args.set else ['lucide', 'ph', 'tabler']
    params = {'query': args.query, 'limit': max(32, args.count), 'prefixes': ','.join(sets)}
    data, _ = fetch(f'{ICONIFY}/search?' + urlencode(params))
    found = json.loads(data).get('icons', [])[:args.count]
    if not found:
        print('No icons found; try a simpler noun or another set.'); return
    path, count = save_icons(found, args.out, args.size, args.color)
    print(f'{count} icon(s) → {path}')


def cmd_icon(args):
    path, count = save_icons(args.names, args.out, args.size, args.color)
    print(f'{count} icon(s) → {path}')


def generate_openai(prompt, size, model, quality, background):
    key = os.environ.get('OPENAI_API_KEY')
    if not key:
        raise SystemExit('OPENAI_API_KEY is not set.')
    body = {'model': model or 'gpt-image-1', 'prompt': prompt, 'size': size, 'n': 1}
    if quality:
        body['quality'] = quality
    if background:
        body['background'] = background
    data, _ = fetch('https://api.openai.com/v1/images/generations', json.dumps(body).encode(),
                    {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    item = json.loads(data)['data'][0]
    if 'b64_json' in item:
        return base64.b64decode(item['b64_json']), '.png', body['model']
    return fetch(item['url'])[0], '.png', body['model']


def generate_gemini(prompt, size, model, quality, background):
    key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not key:
        raise SystemExit('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set.')
    model = model or 'gemini-2.5-flash-image'
    hint = f' Aspect ratio {size}.' if size else ''
    body = {'contents': [{'parts': [{'text': prompt + hint}]}]}
    data, _ = fetch(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                    json.dumps(body).encode(), {'x-goog-api-key': key, 'Content-Type': 'application/json'})
    for candidate in json.loads(data).get('candidates', []):
        for part in candidate.get('content', {}).get('parts', []):
            inline = part.get('inlineData') or part.get('inline_data')
            if inline:
                mime = inline.get('mimeType') or inline.get('mime_type') or 'image/png'
                return base64.b64decode(inline['data']), '.' + mime.split('/')[-1].replace('jpeg', 'jpg'), model
    raise SystemExit('Gemini returned no image; check the model name and prompt policy.')


def cmd_generate(args):
    provider = args.provider or ('openai' if os.environ.get('OPENAI_API_KEY') else
                                 'gemini' if os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') else None)
    if not provider:
        raise SystemExit('No image provider key found (OPENAI_API_KEY or GEMINI_API_KEY). Use the host image tool if it has one, '
                         'or source a license-free image with the images command.')
    if args.dry_run:
        print(json.dumps({'provider': provider, 'prompt': args.prompt, 'size': args.size, 'model': args.model}, indent=2)); return
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    make = generate_openai if provider == 'openai' else generate_gemini
    image, ext, model = make(args.prompt, args.size, args.model, args.quality, args.background)
    name = f'{args.name or slug(args.prompt)}{ext}'
    (out / name).write_bytes(image)
    path = record(out, [{'file': name, 'kind': 'generated', 'provider': provider, 'model': model, 'prompt': args.prompt,
                         'size': args.size, 'license': 'Generated; check the provider terms for commercial use',
                         'retrieved': now()}])
    print(f'{name} → {path}')


def cmd_sheet(args):
    out = Path(args.out)
    entries = json.loads(manifest_path(out).read_text(encoding='utf-8'))
    cells = []
    for e in entries:
        meta = ' · '.join(str(x) for x in (e.get('kind'), e.get('license'), e.get('creator')) if x)
        cells.append(f'<figure><img src="{html.escape(e["file"])}" loading="lazy"><figcaption><b>{html.escape(e["file"])}</b>'
                     f'<span>{html.escape(meta)}</span></figcaption></figure>')
    page = ('<!doctype html><meta charset="utf-8"><title>Asset candidates</title><style>'
            'body{margin:24px;font:13px/20px system-ui;background:#f6f6f7;color:#1a1a1a}'
            'main{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}'
            'figure{margin:0;background:#fff;border-radius:12px;padding:8px;box-shadow:0 0 0 1px #0000000f}'
            'img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#eee;border-radius:6px;display:block}'
            'figcaption{display:grid;gap:2px;padding:8px 4px 4px}span{color:#666}</style><main>' + ''.join(cells) + '</main>')
    target = out / 'contact.html'
    target.write_text(page, encoding='utf-8')
    print(target)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('images'); p.add_argument('query'); p.add_argument('--count', type=int, default=6)
    p.add_argument('--license', default='cc0,pdm', help='Openverse license codes, e.g. cc0,pdm or cc0,pdm,by')
    p.add_argument('--orientation', choices=['landscape', 'portrait', 'square']); p.add_argument('--category', choices=['photograph', 'illustration', 'digitized_artwork'])
    p.add_argument('--min-width', type=int, default=800); p.add_argument('--out', default='assets/raw'); p.set_defaults(run=cmd_images)
    p = sub.add_parser('icons'); p.add_argument('query'); p.add_argument('--set', choices=sorted(ICON_SETS)); p.add_argument('--count', type=int, default=6)
    p.add_argument('--size', type=int); p.add_argument('--color'); p.add_argument('--out', default='assets/icons'); p.set_defaults(run=cmd_icons)
    p = sub.add_parser('icon'); p.add_argument('names', nargs='+'); p.add_argument('--size', type=int); p.add_argument('--color')
    p.add_argument('--out', default='assets/icons'); p.set_defaults(run=cmd_icon)
    p = sub.add_parser('generate'); p.add_argument('prompt'); p.add_argument('--provider', choices=['openai', 'gemini'])
    p.add_argument('--model'); p.add_argument('--size', default='1536x1024'); p.add_argument('--quality', choices=['low', 'medium', 'high'])
    p.add_argument('--background', choices=['transparent', 'opaque', 'auto']); p.add_argument('--name'); p.add_argument('--out', default='assets/gen')
    p.add_argument('--dry-run', action='store_true'); p.set_defaults(run=cmd_generate)
    p = sub.add_parser('sheet'); p.add_argument('--out', default='assets/raw'); p.set_defaults(run=cmd_sheet)
    args = parser.parse_args(argv)
    args.run(args)


if __name__ == '__main__':
    main()
