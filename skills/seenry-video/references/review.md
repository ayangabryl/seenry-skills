# Render, check, review

## Render and mix

```sh
node scripts/render.mjs --dir film/            # film.silent.mp4, deterministic, frame by frame
python3 scripts/mix.py film/cues.json          # mix.m4a and film.mp4
python3 scripts/film_check.py film/cues.json   # format, loudness, voice timing, claims
```

`render.mjs` reports page errors after rendering and exits non-zero when there are any. It encodes H.264 in TV range (`yuv420p`, BT.709), which plays correctly everywhere. A full-range `yuvj420p` file looks washed out in some players, and `film_check.py` rejects it.

Rendering a 60-second 1080p film takes a few minutes. While directing, render stills or a contact sheet (`--contact 12`) instead of the whole film.

## The truth ledger

`claims.json` lists every fact the film shows or says:

```json
[{"time": 16.5, "text": "h1 · 64px · 300 · −1.28px", "kind": "measured", "source": "get_tokens 1password.com/pricing, captured 2026-09-25"}]
```

The kinds are:
- `measured`: values from captured evidence;
- `quoted`: names, counts or text from a source;
- `copy`: approved marketing lines;
- `dramatised`: an illustration of a process, such as a simplified terminal log or a build animation.

Everything except `dramatised` needs a source. A dramatised moment must look like an illustration, never like captured product output. When the evidence changes, the film changes; do not keep a number because it fits the story.

## Blind review

Your own review of a film you directed is not evidence. Use the film critic, which is built for sequences rather than pages:

```sh
node scripts/film_critic.mjs --dir film/ --refs study/ref-a.mp4,study/ref-b.mp4
```

It renders three boards from the finished `film.mp4`:
- a storyboard on the beat grid, with the voice line being spoken under each frame;
- the film at phone-feed size (16:9 at 390pt wide), for legibility;
- full-size frames from the middle of each shot.
- motion strips: rows of frames sampled every 0.67s, so it sees what moves between stills, for the candidate and every reference.

The reference films are storyboarded the same way and set the 8–9 end of the scale. The critic also receives the brief, the script, the claims ledger and measured facts: cut times and how many land on the beat, loudness, and motion (the share of the film where the picture is moving, the longest still stretch and the mean frame difference, measured with ffmpeg for the candidate and each reference). It scores nine things:
- **claim:** one sentence a viewer would repeat;
- **proof:** real evidence at a scale that carries the argument;
- **story:** a hook, escalation, a turn and an ending;
- **pacing:** time to read, and cuts that follow the music;
- **picture:** composition, hierarchy, scale variety and craft;
- **motion:** continuous camera and object movement against the references, not slides that fade in and out;
- **legibility:** in the feed and while on screen;
- **sound and picture:** voice complements picture, and events land on beats;
- **truth:** nothing illustrated looks captured, and no unsourced numbers appear.

It reports the median of three runs.

Scoring is blind every round: the scorers never see earlier rounds, because a critic told that its advice was taken scores about a point higher for the same cut. An editor pass then writes the round's fixes from the blind verdict and the full history in `film-critic-history.json`. It may not repeat an applied fix or reverse an earlier request unless the result visibly failed, and it marks each fix `new` or `revisits round N`. Re-run after every round of changes.

Every run also scores the reference films on the same scale, as published films without paperwork, and reports the gap to the best of them. Aim to close that gap: a 9 means matching the best reference, not a number on its own. Do not score a reference film alone as the candidate; the rubric would penalize it for having no brief or ledger. When two rounds in a row do not move the blind score, stop polishing: the remaining gap is usually the concept (documents about actions instead of the actions themselves), not the layout. Report the score and what remains.

The critic's fixes are suggestions, not orders. Reject any fix that adds an element the reference grammar does not have: a label beside the interface, a source box, a tag, a chip. Each one sounds reasonable; together they bury the film. On the Seenry Video film, applying every note one by one produced a frame with a thumbnail wall, a tag, rule chips, bar labels, a waveform and a claim box at once. Rebuilt on the references' grammar (one thing per frame), it scored the same and looked like the references.

Scores are heuristic review signals, not proof that the film beats its references. The critic sees stills and measurements, not playback, so mix quality and voice delivery still need a human listen. The seenry page critic (`critic.mjs`) and motion judge are built for interfaces: they score phone layouts and read stills out of order, so do not use them to approve a film.

## Before delivering

- Watch the whole film once at normal speed with sound, on the target size: a phone for social cuts, a laptop for site films.
- Check that every line of text can be read twice while it is on screen.
- Check that the first two seconds show the claim or the product.
- Check that the end card holds for at least three seconds and names where to get the product.
- `film_check.py` passes.
