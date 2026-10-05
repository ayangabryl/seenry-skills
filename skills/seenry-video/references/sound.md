# Sound: music, effects, voice, mix

Sound decides whether a film feels made or generated. Treat it as part of the direction, not a finish.

## Sources

Use one of these, and record the source and license of every file in `sound-credits.md`:

- **Generated with ElevenLabs** (`scripts/elevenlabs.py`, optional). Voice (`vo`), effects (`sfx`, two takes each to choose by ear) and a score from a composition plan (`music`). It needs `ELEVENLABS_API_KEY` and spends the user's credits, so confirm the plan first. Check that their plan allows commercial use.
- **Licensed libraries.** Use music and effects whose license allows the use without attribution or with stated attribution, from a library the user approves. Keep the license page URL and the download date.
- **Recorded.** Real keyboard, trackpad and room sound recorded for the film.

Never use music you cannot license, and never ask the user to paste an API key into chat. The key belongs in their shell environment.

## Music

- Choose or compose at the film's tempo. Generated music rarely follows a section plan exactly, so listen, find where its energy changes, and re-cut it on bar lines with the cue sheet's `music.edit`. This is a list of `[source start, source end]` segments laid end to end, with short crossfades at each splice. All edits must be whole bars.
- The drop lands on the first proof shot. A breakdown leaves room for the turn. The composed ending carries the end card.
- `music.muffle` filters the intro as if heard through a wall, then opens it into full range at the drop. It is useful when the film opens on a quiet product moment.
- Music sits about 7 dB under the voice (`voice.duck_db`) and about 2 dB under effects (`sfx_duck_db`). Ducking follows the voice's envelope, so the music returns between lines.

For ElevenLabs, sections must be at least 3 seconds long. Global styles that work for product films: "modern minimal electronic, product film score, 120 BPM, 4/4, precise and clean, instrumental". Negative styles: "vocals, cheesy corporate, epic orchestral, tempo changes".

## Effects

- Mark real events only: a value landing, a page arriving, a tool call returning, the end card. A film with an effect on every cut sounds like a template.
- Each cue places the file's loudest moment on `at`, so a whoosh peaks exactly on the cut. Use `count` and `step` for a run of ticks, `from` and `length` to use part of a file, and `gain` (0–1) for its level relative to the others.
- Keep a small kit of 6–10 sounds with one character: soft clicks, ticks, one impact, one riser or swell, one chime for the end. Typing and trackpad sounds make an agent or tool demo feel physical.
- Leave silence before the biggest moment.

## Voice

- Choose a voice by listening to the same line in three or four voices. The most natural voices have audible breath, slight pitch movement and no over-precise consonants. With ElevenLabs, `eleven_v3` reads most naturally.
- Generate or record one file per line, named by its start time (`006.50.mp3`). The mixer trims each line before the next one starts; `film_check.py` flags lines that run more than 0.35s into the next.
- Low-cut the voice at 90 Hz (the mixer does this). Do not add reverb.

## Master

`mix.py` normalizes to −14 LUFS integrated and −1.5 dBTP true peak in two passes (measure, then a linear gain, so films that open quietly do not overshoot), the targets most streaming and social platforms use, and writes an AAC track at 256 kbps. `film_check.py` measures the result. Listen on laptop speakers and on headphones: the voice must be clear on both, and the low end must not boom on headphones.

## Cue sheet fields

```json
{
  "duration": 56, "bpm": 120, "video": "film.silent.mp4", "out": "film.mp4",
  "music": {"file": "media/music.mp3", "edit": [[6, 16], [16, 48], [48, null]], "muffle": {"until": 10, "open_from": 8}, "fade_out": 1.5, "gain_db": 0},
  "sfx": [{"file": "media/sfx/tick-1.mp3", "at": 16.5, "gain": 0.5, "count": 5, "step": 1.0}],
  "sfx_duck_db": 2,
  "voice": {"dir": "media/vo", "duck_db": 7},
  "loudness": {"lufs": -14, "true_peak": -1.5}
}
```

`voice` also accepts `"lines": [{"at": 0.5, "file": "media/vo/a.mp3"}]` in place of a folder.
