"""Mix a film's music, sound effects and voiceover from one cue sheet, master it and mux it onto the picture.

    python3 mix.py film/cues.json            # writes mix.wav, mix.m4a and the final MP4 named in the cue sheet
    python3 mix.py film/cues.json --no-video # audio only

Paths in the cue sheet are relative to the cue sheet. Needs numpy and ffmpeg. See references/sound.md for the
cue-sheet fields and the reasoning behind each default.
"""
import argparse, json, os, subprocess, sys, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('cues')
ap.add_argument('--no-video', action='store_true')
args = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(args.cues))
C = json.load(open(args.cues))
SR = int(C.get('sample_rate', 48000))
DUR = float(C['duration'])
N = int(DUR * SR)
path = lambda p: p if os.path.isabs(p) else os.path.join(HERE, p)

def load(p):
    p = path(p)
    if not os.path.exists(p): sys.exit(f'Missing audio: {p}')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)

def fit(x):
    return x[:N] if len(x) >= N else np.vstack([x, np.zeros((N - len(x), 2))])

def tv_filter(x, gain_of):
    """Time-varying EQ by STFT overlap-add. gain_of(t, freqs) -> per-bin gain."""
    W, H = 4096, 1024; win = np.hanning(W)
    pad = np.vstack([np.zeros((W, 2)), x, np.zeros((W, 2))]); y = np.zeros_like(pad); norm = np.zeros(len(pad))
    f = np.fft.rfftfreq(W, 1 / SR)
    for i in range(0, len(pad) - W, H):
        g = gain_of((i - W + W / 2) / SR, f)[:, None]
        y[i:i + W] += np.fft.irfft(np.fft.rfft(pad[i:i + W] * win[:, None], axis=0) * g, n=W, axis=0) * win[:, None]
        norm[i:i + W] += win ** 2
    return (y / np.maximum(norm, 1e-6)[:, None])[W:W + len(x)]
lowpass = lambda f, fc: 1 / np.sqrt(1 + (f / fc) ** 4)
highpass = lambda f, fc: 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4)

def envelope(x, attack=.02, release=.25):
    e = np.abs(x).max(1); blk = int(.01 * SR); e = np.pad(e, (0, -len(e) % blk)).reshape(-1, blk).max(1)
    out = np.zeros_like(e); z = 0.0; ka, kr = np.exp(-.01 / attack), np.exp(-.01 / release)
    for i, v in enumerate(e): z = ka * z + (1 - ka) * v if v > z else kr * z + (1 - kr) * v; out[i] = z
    return np.repeat(out, blk)[:len(x)]

# ---------- music: source segments laid end to end on bar lines, short crossfades at each splice ----------
music = np.zeros((N, 2))
m = C.get('music')
if m:
    src = load(m['file'])
    edit = m.get('edit') or [[0, None]]
    XF = int(.012 * SR)
    segs = [(int(a * SR), len(src) if e is None else int(e * SR)) for a, e in edit]
    buf = np.zeros((sum(e - s for s, e in segs) + SR, 2)); pos = 0
    for i, (s, e) in enumerate(segs):
        n = e - s; chunk = src[s:min(len(src), e + XF)].copy()
        if i > 0: chunk[:XF] *= np.sin(np.linspace(0, np.pi / 2, XF))[:, None]
        if i < len(segs) - 1 and len(chunk) > n: chunk[n:] *= np.cos(np.linspace(0, np.pi / 2, len(chunk) - n))[:, None]
        buf[pos:pos + len(chunk)] += chunk; pos += n
    music = fit(buf) * 10 ** (m.get('gain_db', 0) / 20)
    music[:int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR))[:, None]
    fo = int(m.get('fade_out', 1.5) * SR)
    if fo: music[-fo:] *= (np.linspace(1, 0, fo) ** 2)[:, None]
    muffle = m.get('muffle')  # {"until": 10, "open_from": 8}: heard through a wall, opening into full range at "until"
    if muffle:
        until, open_from = float(muffle['until']), float(muffle.get('open_from', muffle['until'] - 2))
        def g(t, f):
            if t >= until: return np.ones_like(f)
            if t < open_from: return lowpass(f, muffle.get('cutoff', 1200))
            return lowpass(f, muffle.get('cutoff', 1200) * (18000 / muffle.get('cutoff', 1200)) ** ((t - open_from) / (until - open_from)))
        k = int((until + 1) * SR); music[:k] = tv_filter(music[:k], g)

# ---------- effects: each cue places its loudest moment on "at" ----------
sfx = np.zeros((N, 2)); cache = {}
for cue in C.get('sfx', []):
    sig = cache.get(cue['file'])
    if sig is None:
        sig = load(cue['file']); sig = sig / (np.abs(sig).max() + 1e-9)
        if cue.get('highpass'): sig = tv_filter(sig, lambda t, f, hp=cue['highpass']: highpass(f, hp))
        cache[cue['file']] = sig
    peak = cue.get('peak', float(np.abs(sig).max(1).argmax()) / SR)
    times = [cue['at'] + k * cue.get('step', 0) for k in range(cue.get('count', 1))]
    for t in times:
        a = int(cue.get('from', 0) * SR); seg = sig[a:] if cue.get('length') is None else sig[a:a + int(cue['length'] * SR)]
        seg = seg.copy(); f = min(int(cue.get('fade', .02) * SR), len(seg) // 2)
        if f: seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int((t - (peak - cue.get('from', 0))) * SR)
        if i < 0: seg = seg[-i:]; i = 0
        j = min(N, i + len(seg)); sfx[i:j] += seg[:j - i] * cue.get('gain', .3)

se = envelope(sfx)
duck = 1 - (1 - 10 ** (-C.get('sfx_duck_db', 2) / 20)) * np.clip(se / (se.max() + 1e-9) * 3, 0, 1)

# ---------- voiceover: one file per line, starting at its cue; lines never run into the next ----------
vo = np.zeros((N, 2)); v = C.get('voice')
if v:
    lines = v.get('lines')
    if not lines:  # a folder of files named by start time, e.g. 006.50.mp3
        d = path(v['dir']); lines = [{'at': float(os.path.splitext(f)[0]), 'file': os.path.join(d, f)} for f in sorted(os.listdir(d)) if f[0].isdigit()]
    lines = sorted(lines, key=lambda l: l['at'])
    for i, l in enumerate(lines):
        line = tv_filter(load(l['file']), lambda t, f: highpass(f, 90))
        room = (lines[i + 1]['at'] if i + 1 < len(lines) else DUR) - l['at'] - .05
        line = line[:int(room * SR)]
        k = min(int(.06 * SR), len(line)); line[-k:] *= np.linspace(1, 0, k)[:, None]
        a = int(l['at'] * SR); b = min(N, a + len(line)); vo[a:b] += line[:b - a]
    voiced = np.abs(vo).max(1) > 1e-3
    if voiced.any():
        vo *= .5 / (np.percentile(np.abs(vo[voiced]), 99) + 1e-9)
        ve = envelope(vo, .03, .35); ve = np.clip(ve / (np.percentile(ve[ve > 1e-4], 90) + 1e-9) * 2, 0, 1)
        duck = duck * (1 - (1 - 10 ** (-v.get('duck_db', 7) / 20)) * ve)
        sfx *= (1 - .35 * ve)[:, None]

mix = music * duck[:, None] + sfx + vo
if np.abs(mix).max() < 1e-6: sys.exit('The mix is silent: add music, effects or voice to the cue sheet.')
mix = mix / np.abs(mix).max() * .89

# ---------- master: integrated loudness and true peak for streaming and social ----------
L = C.get('loudness', {}); lufs, tp = L.get('lufs', -14), L.get('true_peak', -1.5)
wav = path(C.get('mix', 'mix.wav')); m4a = os.path.splitext(wav)[0] + '.m4a'
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
# two passes: one-pass loudnorm runs dynamic and overshoots films that open quietly
ln = f'loudnorm=I={lufs}:TP={tp}:LRA=11'
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', ln + ':print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
m = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
ln += f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', ln, '-ar', str(SR), '-c:a', 'aac', '-b:a', '256k', m4a], check=True)
print(f'mix -> {os.path.relpath(m4a)} (target {lufs} LUFS, {tp} dBTP)')
video = C.get('video')
if video and not args.no_video:
    if not os.path.exists(path(video)): sys.exit(f'No picture yet: render {path(video)} first, or pass --no-video.')
    out = path(C.get('out', 'film.mp4'))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path(video), '-i', m4a, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-shortest', out], check=True)
    print(f'film -> {os.path.relpath(out)}')
