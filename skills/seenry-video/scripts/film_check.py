"""Check a finished film before delivery: picture format, loudness, voice timing and the truth ledger.

    python3 film_check.py film/cues.json [--claims film/claims.json]

Exits 1 with every failure listed. It does not judge taste: pair it with the blind critic on stills
(references/review.md). Needs ffmpeg and ffprobe.
"""
import argparse, json, os, re, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument('cues')
ap.add_argument('--claims')
a = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(a.cues))
C = json.load(open(a.cues))
path = lambda p: p if os.path.isabs(p) else os.path.join(HERE, p)
fails, notes = [], []

film = path(C.get('out', 'film.mp4'))
if not os.path.exists(film): sys.exit(f'Missing {film}: render and mix first.')
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', film], capture_output=True, check=True).stdout)
v = next((s for s in probe['streams'] if s['codec_type'] == 'video'), None)
au = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
dur = float(probe['format']['duration'])
if abs(dur - C['duration']) > .1: fails.append(f'duration {dur:.2f}s, cue sheet says {C["duration"]}s')
if not v: fails.append('no video stream')
else:
    num, den = map(int, v['r_frame_rate'].split('/')); fps = num / den
    notes.append(f"picture {v['width']}×{v['height']} {v['codec_name']} {v.get('pix_fmt')} {fps:g}fps")
    if v['codec_name'] != 'h264' or v.get('pix_fmt') != 'yuv420p': fails.append('picture must be H.264 yuv420p to play everywhere')
    if fps < 24: fails.append(f'{fps:g}fps is below 24')
if not au: fails.append('no audio stream (silent films still need the mix step, or say they are silent on purpose)')
else:
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', film, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    summary = r[r.rfind('Summary:'):]
    lufs = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1))
    peak = float(re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summary).group(1))
    target, tp = C.get('loudness', {}).get('lufs', -14), C.get('loudness', {}).get('true_peak', -1.5)
    notes.append(f'loudness {lufs:.1f} LUFS, true peak {peak:.1f} dBTP (target {target}, ≤ {tp})')
    if abs(lufs - target) > 1: fails.append(f'loudness {lufs:.1f} LUFS is more than 1 LU from {target}')
    if peak > tp + .5: fails.append(f'true peak {peak:.1f} dBTP exceeds {tp}')

voice = C.get('voice') or {}
lines = voice.get('lines')
if not lines and voice.get('dir') and os.path.isdir(path(voice['dir'])):
    d = path(voice['dir']); lines = [{'at': float(os.path.splitext(f)[0]), 'file': os.path.join(d, f)} for f in sorted(os.listdir(d)) if f[0].isdigit()]
for i, l in enumerate(sorted(lines or [], key=lambda l: l['at'])):
    f = path(l['file']); end = None
    if os.path.exists(f):
        end = l['at'] + float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
    nxt = sorted(lines, key=lambda l: l['at'])[i + 1]['at'] if i + 1 < len(lines) else C['duration']
    if end and end - nxt > .35: fails.append(f'voice line at {l["at"]}s runs {end - nxt:.2f}s into the next cue and will be cut')

claims_path = a.claims or path('claims.json')
if not os.path.exists(claims_path): fails.append('no claims.json: list every on-screen fact, number and product behavior with its source')
else:
    claims = json.load(open(claims_path))
    bad = [c for c in claims if c.get('kind') != 'dramatised' and not c.get('source')]
    for c in bad: fails.append(f'unsourced claim at {c.get("time", "?")}s: {c.get("text")}')
    kinds = {}
    for c in claims: kinds[c.get('kind', 'unspecified')] = kinds.get(c.get('kind', 'unspecified'), 0) + 1
    notes.append('claims ' + ', '.join(f'{n} {k}' for k, n in kinds.items()))
    if any(c.get('kind') == 'dramatised' for c in claims): notes.append('dramatised moments must read as illustration, never as captured product output')

for n in notes: print(n)
if fails:
    print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
print('PASS: format, loudness, voice timing and sourced claims. Taste is not checked here; run the blind critic on stills.')
