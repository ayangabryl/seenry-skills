"""Optional: generate a film's voiceover, sound effects and score with ElevenLabs from one spec file.

    python3 elevenlabs.py film/sound.json voices          # list voices on the account (free)
    python3 elevenlabs.py film/sound.json vo              # one file per line, named by its start time
    python3 elevenlabs.py film/sound.json sfx [name ...]  # two takes per effect, to choose by ear
    python3 elevenlabs.py film/sound.json music           # one score from the composition plan

Needs ELEVENLABS_API_KEY in the environment; the key is never printed or written. Every call except `voices`
spends the account's credits, so confirm the plan with the user first. Output paths are relative to the spec.
Check the account's plan allows commercial use before publishing. Stdlib only.
"""
import json, os, sys, time, urllib.error, urllib.request

if len(sys.argv) < 3: sys.exit(__doc__)
SPEC_PATH, WHAT, ONLY = sys.argv[1], sys.argv[2], sys.argv[3:]
HERE = os.path.dirname(os.path.abspath(SPEC_PATH))
SPEC = json.load(open(SPEC_PATH))
KEY = os.environ.get('ELEVENLABS_API_KEY')
if not KEY: sys.exit('ELEVENLABS_API_KEY is not set. Use licensed audio instead (references/sound.md), or ask the user to set the key.')
path = lambda p: p if os.path.isabs(p) else os.path.join(HERE, p)

def call(api, body=None, out=None):
    for attempt in range(6):
        req = urllib.request.Request('https://api.elevenlabs.io' + api, data=json.dumps(body).encode() if body is not None else None,
                                     headers={'xi-api-key': KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' if out else 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=600) as r: data = r.read()
            break
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors='replace')[:300]
            if e.code in (429, 500, 502, 503) and attempt < 5:
                wait = 2 ** attempt * 5; print(f'{e.code}, retrying in {wait}s'); time.sleep(wait); continue
            sys.exit(f'ElevenLabs {e.code}: {detail}')
    if not out: return json.loads(data)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as f: f.write(data)
    print('wrote', os.path.relpath(out), len(data), 'bytes')

if WHAT == 'voices':
    for v in call('/v1/voices')['voices']:
        labels = ', '.join(f'{k}: {x}' for k, x in (v.get('labels') or {}).items())
        print(f"{v['voice_id']}  {v['name']}  {labels}")
elif WHAT == 'vo':
    v = SPEC['voice']; lines = v['lines']; model = v.get('model', 'eleven_v3')
    for i, l in enumerate(lines):
        if model == 'eleven_v3':  # most natural read; it takes no neighbouring-line context
            body = {'text': l['text'], 'model_id': model, 'voice_settings': {'stability': v.get('stability', .5), 'similarity_boost': .8}}
        else:  # neighbouring lines keep the read consistent across separate files
            body = {'text': l['text'], 'model_id': model, 'previous_text': lines[i - 1]['text'] if i else None,
                    'next_text': lines[i + 1]['text'] if i + 1 < len(lines) else None,
                    'voice_settings': {'stability': v.get('stability', .55), 'similarity_boost': .8, 'style': .15, 'use_speaker_boost': True, 'speed': v.get('speed', .97)}}
        call(f"/v1/text-to-speech/{v['id']}?output_format=mp3_44100_192", body, os.path.join(path(v.get('dir', 'media/vo')), f"{l['at']:06.2f}.mp3"))
elif WHAT == 'sfx':
    for name, s in SPEC['sfx'].items():
        if ONLY and name not in ONLY: continue
        for take in range(s.get('takes', 2)):
            call('/v1/sound-generation?output_format=mp3_44100_192',
                 {'text': s['prompt'], 'duration_seconds': max(.5, s.get('duration', 1.0)), 'prompt_influence': s.get('influence', .6)},
                 os.path.join(path(SPEC.get('sfx_dir', 'media/sfx')), f'{name}-{take + 1}.mp3'))
elif WHAT == 'music':
    m = SPEC['music']
    for sec in m['plan']['sections']: sec['duration_ms'] = max(3000, int(sec['duration_ms']))  # the API's minimum section length
    call('/v1/music?output_format=mp3_44100_192', {'composition_plan': m['plan'], 'model_id': m.get('model', 'music_v1')}, path(m.get('file', 'media/music.mp3')))
else:
    sys.exit(__doc__)
