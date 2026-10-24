#!/usr/bin/env python3
"""Measure what is on a phone screenshot: the ground color and each element's box in points.

  python3 measure_screen.py ref.png                      list elements of one screen
  python3 measure_screen.py ref.png mine.png             compare a reference frame with your screen at the same beat
  options: --points 402 (screen width in points), --json

Elements are regions that differ from the ground, merged when they nearly touch, so a text line or a glass orb
with its contents counts as one. Use it to fill research/fidelity.md with measured sizes instead of guesses, and
to check your build against the reference: hero object, headline block and action within 15% in size.
"""
import json, sys
from collections import Counter, deque
from PIL import Image

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = lambda name, d: sys.argv[sys.argv.index(f'--{name}') + 1] if f'--{name}' in sys.argv else d
points = float(opt('points', 402))
if not args:
    print(__doc__); sys.exit(2)
args = [a for a in args if a != opt('points', None)]


def measure(path):
    im = Image.open(path).convert('RGB')
    W = 201
    s = im.resize((W, round(im.height * W / im.width)))
    H = s.height
    top, bottom = int(H * 0.07), int(H * 0.965)
    px = s.load()
    q = lambda c: tuple(v // 8 * 8 for v in c)
    ground = Counter(q(px[x, y]) for y in range(top, bottom) for x in range(W)).most_common(1)[0][0]
    far = lambda c: sum(abs(a - b) for a, b in zip(c, ground)) > 30
    mask = [[far(px[x, y]) for x in range(W)] for y in range(H)]
    seen = [[False] * W for _ in range(H)]
    boxes = []
    for y in range(top, bottom):
        for x in range(W):
            if mask[y][x] and not seen[y][x]:
                dq, b = deque([(x, y)]), [x, y, x, y, 0]
                seen[y][x] = True
                while dq:
                    cx, cy = dq.popleft()
                    b[0], b[1], b[2], b[3], b[4] = min(b[0], cx), min(b[1], cy), max(b[2], cx), max(b[3], cy), b[4] + 1
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < W and top <= ny < bottom and mask[ny][nx] and not seen[ny][nx]:
                            seen[ny][nx] = True
                            dq.append((nx, ny))
                boxes.append(b)
    gx, gy = 6, 2
    merged = True
    while merged:
        merged = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, b = boxes[i], boxes[j]
                if a[0] - gx <= b[2] and b[0] - gx <= a[2] and a[1] - gy <= b[3] and b[1] - gy <= a[3]:
                    boxes[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]), a[4] + b[4]]
                    del boxes[j]
                    merged = True
                    break
            if merged:
                break
    k = points / W
    els = []
    for x0, y0, x1, y1, n in sorted(boxes, key=lambda b: b[1]):
        w, h = (x1 - x0 + 1) * k, (y1 - y0 + 1) * k
        if w * h < 4:
            continue
        els.append({'x': round(x0 * k), 'y': round(y0 * k), 'w': round(w), 'h': round(h), 'wPct': round(w / points * 100, 1)})
    big = [e for e in els if e['w'] * e['h'] >= 400]
    return {'file': path, 'ground': '#%02x%02x%02x' % ground, 'elements': len(els), 'large': big, 'specks': len(els) - len(big)}


ms = [measure(p) for p in args[:2]]
if '--json' in sys.argv:
    print(json.dumps(ms, indent=1)); sys.exit(0)
for m in ms:
    print(f"{m['file']}: ground {m['ground']}, {len(m['large'])} large elements, {m['specks']} small specks")
    for e in m['large']:
        print(f"  y {e['y']:>4}pt  x {e['x']:>4}pt  {e['w']:>4}×{e['h']:<4}pt  ({e['wPct']}% of width)")
if len(ms) == 2:
    a, b = ms
    print('\nreference → yours (each reference element matched to the nearest one of similar shape)')
    used = set()
    cy = lambda e: e['y'] + e['h'] / 2
    for ea in sorted(a['large'], key=lambda e: -e['w'] * e['h']):
        cands = [(abs(cy(eb) - cy(ea)) + 200 * abs((eb['w'] / eb['h']) / (ea['w'] / ea['h']) - 1), j) for j, eb in enumerate(b['large']) if j not in used]
        if not cands:
            print(f"  missing in yours: {ea['w']}×{ea['h']} at y{ea['y']}"); continue
        _, j = min(cands); used.add(j); eb = b['large'][j]
        r = (eb['w'] * eb['h']) / (ea['w'] * ea['h'])
        flag = '' if 0.72 <= r <= 1.38 and abs(cy(eb) - cy(ea)) <= 40 else '  <- off'
        print(f"  {ea['w']}×{ea['h']} at y{ea['y']}  →  {eb['w']}×{eb['h']} at y{eb['y']}  area ×{r:.2f}{flag}")
    extra = len(b['large']) - len(used)
    print(f"  extra large elements in yours: {extra}" + ('  <- off' if extra > max(1, len(a['large']) // 3) else ''))
    print(f"  small specks {a['specks']} → {b['specks']}")
