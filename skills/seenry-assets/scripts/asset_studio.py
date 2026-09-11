"""Search public-domain Met objects, validate manifests, render real crop studies.

Python 3.10+, standard library. Native image search can supply the same manifest.
No image is downloaded by search or board. Source text is untrusted data.
"""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

API = 'https://collectionapi.metmuseum.org/public/collection/v1/'


def request_json(url):
    with urlopen(Request(url, headers={'User-Agent': 'SeenryAssetStudy/2.0'}), timeout=25) as response:
        return json.loads(response.read(4_000_000))


def search_met(query, limit=8, title_only=False):
    # v1 search retires October 2026; retain v1 for individual object records.
    parameters = {'q': query, 'hasImages': 'true', 'limit': min(24, limit * 3), 'offset': 0}
    if title_only: parameters['title'] = 'true'
    result = request_json(API.replace('/v1/', '/v1.1/') + 'search?' + urlencode(parameters))
    candidates, errors = [], []
    # Bounded scouting, not a complete scrape of the collection.
    for identity in (result.get('objectIDs') or [])[:min(24, limit * 3)]:
        try:
            item = request_json(API + 'objects/' + str(int(identity)))
            if not item.get('isPublicDomain') or not item.get('primaryImageSmall'):
                continue
            candidates.append({'id': str(identity), 'title': item['title'],
                'source': item['objectURL'], 'author': item.get('artistDisplayName') or item.get('culture') or 'Not recorded',
                'preview': item['primaryImageSmall'], 'production_candidate': item.get('primaryImage') or None, 'license': 'CC0',
                'rights_url': 'https://www.metmuseum.org/hubs/open-access',
                'rights_reviewed': False, 'role': 'unassigned', 'status': 'temporary',
                'selected': False, 'alt': item['title'], 'position': [50, 50],
                'reason': '', 'modifications': 'none', 'source_public_domain': True})
            if len(candidates) >= limit:
                break
        except (OSError, ValueError, KeyError) as error:
            errors.append({'id': identity, 'error': str(error)})
    return {'schema': 1, 'query': query, 'provider': 'Met Collection',
            'limits': 'Art/objects only; selection and intended-use review remain pending.',
            'errors': errors, 'assets': candidates}


def safe_url(value, local=False):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('Nonempty source or preview required')
    parsed = urlparse(value)
    if parsed.scheme in ('http', 'https') and parsed.netloc:
        return value
    if local and not parsed.scheme and not parsed.netloc and not value.startswith('//') and '\\' not in value:
        return value
    raise ValueError('Use an http(s) URL or a relative local preview')


def validate(data, production=False):
    assets = data.get('assets')
    if not isinstance(assets, list) or not assets:
        raise ValueError('A nonempty assets list is required')
    identities, pending = set(), []
    for asset in assets:
        identity = asset.get('id')
        if not isinstance(identity, str) or not identity or identity in identities:
            raise ValueError('Asset ids must be nonempty unique strings')
        identities.add(identity)
        for field in ('title', 'author', 'license', 'role', 'status', 'alt'):
            if not isinstance(asset.get(field), str) or not asset[field].strip():
                raise ValueError(f'{identity}: missing {field}')
        for field in ('source', 'rights_url'):
            safe_url(asset.get(field))
        safe_url(asset.get('preview'), local=True)
        if asset.get('production_candidate') is not None:
            safe_url(asset['production_candidate'])
        if asset['status'] not in ('temporary', 'final', 'reference-only'):
            raise ValueError(f'{identity}: invalid status')
        position = asset.get('position', [50, 50])
        if len(position) != 2 or any(type(x) not in (int, float) or not 0 <= x <= 100 for x in position):
            raise ValueError(f'{identity}: crop position must contain two percentages')
        if not (asset.get('selected') is True and asset.get('rights_reviewed') is True
                and asset['status'] == 'final' and asset.get('reason') and asset['role'] != 'unassigned'):
            pending.append(identity)
        elif re.search(r'pending|unverified|replace with', asset['license'], re.I) or urlparse(asset['source']).hostname in ('example.com', 'www.example.com'):
            pending.append(identity)
    if production and pending:
        raise ValueError('Not production material: ' + ', '.join(pending))
    return {'assets': len(assets), 'pending': pending, 'limit': 'Metadata checked; imagery and rights interpretation need review.'}


def board(data, source_dir, out):
    validate(data)
    e = html.escape
    cards = []
    for asset in data['assets']:
        src = asset['preview']
        if not urlparse(src).scheme:
            import os
            src = Path(os.path.relpath((source_dir / src).resolve(), out.parent.resolve())).as_posix()
        x, y = asset.get('position', [50, 50])
        picture = f'<img src="{e(src, quote=True)}" alt="{e(asset["alt"], quote=True)}" style="object-position:{x}% {y}%">'
        cards.append(f'''<article><header><h2>{e(asset['title'])}</h2><p>{e(asset['role'])} · {e(asset['status'])}</p></header>
<div class="views"><figure class="wide">{picture}<figcaption>Wide crop</figcaption></figure><figure class="narrow">{picture}<figcaption>Narrow crop</figcaption></figure><figure class="proof"><div class="sheet">{picture}</div><figcaption>Flat print proof</figcaption></figure></div>
<p>{e(asset.get('reason') or 'Selection and crop judgment pending.')}</p><p><a href="{e(asset['source'], quote=True)}">Source: {e(asset['author'])}</a> · <a href="{e(asset['rights_url'], quote=True)}">{e(asset['license'])}</a></p></article>''')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Material study</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f3;color:#222;font:15px/1.5 system-ui}main{max-width:1200px;margin:auto;padding:32px}h1{font-size:26px}h2{font-size:19px;margin:0}p{max-width:75ch}article{padding:32px 0;border-top:1px solid #ccc}.views{display:grid;grid-template-columns:2fr 1fr 1.3fr;gap:20px;align-items:start}figure{margin:12px 0}img{display:block;width:100%;height:100%;object-fit:cover}.wide img{aspect-ratio:16/9}.narrow img{aspect-ratio:3/4}.proof .sheet{aspect-ratio:4/5;background:white;padding:18px 18px 44px;transform:rotate(-3deg)}.proof img{object-fit:contain}.proof{padding:12px 20px;background:#dfdfda}figcaption{font-size:12px;margin-top:12px}a{color:inherit} @media(max-width:680px){main{padding:20px}.views{grid-template-columns:1fr 1fr}.wide{grid-column:1/-1}}
</style><main><h1>Material study</h1><p>Compare the actual image across crops and a flat application. This board is internal research; it does not approve rights or prescribe a website layout.</p>''' + ''.join(cards) + '</main></html>', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    search = sub.add_parser('search-met'); search.add_argument('query'); search.add_argument('--limit', type=int, default=8); search.add_argument('--out', type=Path, required=True); search.add_argument('--title-only', action='store_true', help='Match object titles when broad metadata returns irrelevant material')
    for command in ('board', 'check'):
        child = sub.add_parser(command); child.add_argument('manifest', type=Path)
        if command == 'board': child.add_argument('--out', type=Path, required=True)
        else: child.add_argument('--production', action='store_true')
    args = parser.parse_args()
    try:
        if args.command == 'search-met':
            if not 1 <= args.limit <= 12: raise ValueError('Use 1–12 candidates')
            data = search_met(args.query, args.limit, args.title_only)
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(json.dumps(data, indent=2), encoding='utf-8')
            print(json.dumps({'candidates': len(data['assets']), 'errors': data['errors'], 'out': str(args.out)}))
        else:
            data = json.loads(args.manifest.read_text(encoding='utf-8'))
            if args.command == 'board': board(data, args.manifest.parent, args.out)
            print(json.dumps(validate(data, production=getattr(args, 'production', False))))
    except (ValueError, OSError, TypeError, KeyError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__': main()
