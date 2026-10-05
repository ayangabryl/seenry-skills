# Directing: story, shot list, script

## The story

Write three lines before anything else:

- **Claim.** The sentence the viewer repeats afterwards ("It measures real pages before it builds").
- **Proof.** What the viewer sees that makes the claim undeniable (seven real pricing pages measured, the shared ranges, the page built from them).
- **Turn.** The moment the proof lands, which becomes the signature shot (the pips landing and the shared range lighting up).

Most product films fit one of three shapes:

| Shape | Beats | Good for |
| --- | --- | --- |
| Ask → work → result | the request, the product doing the work visibly, the outcome | agents, tools, automation |
| Before → after | the familiar pain, the change, the new normal | redesigns, speed, simplification |
| Many → one | the size of the problem or library, the focus on one case, the general rule | data, libraries, research |

Show the claim or the product within two seconds. End on the product name, one line and where to get it; hold the end card for at least three seconds.

## The bar grid

Choose the tempo first and put every scene start on a bar line. At 120 BPM one 4/4 bar is 2s, a beat is 0.5s and an eighth note is 0.25s. Scenes are usually 2–6 bars; a 56-second film at 120 BPM is 28 bars.

Write the shot list as a table:

| Time | Bars | Picture | Motion | Voice | Sound |
| --- | --- | --- | --- | --- | --- |
| 0:00–0:10 | 1–5 | The ask typed into the agent; tool calls stream in | each call lands on a beat | "Ask your agent for a pricing page." | muffled intro, typing |
| 0:10–0:16 | 6–8 | 40 real pricing captures flood the frame; the count rolls to 362 | tiles land in columns, 50ms stagger | "Three hundred and sixty-two real pricing pages." | the drop, impact, counter |

Plan the energy: a quiet start, the drop on the first proof, a breather before the turn, the biggest moment on the turn, and a calm end card.

## Picture rules

- **One focal point per shot.** If two things move, one leads and the other follows by at least 100ms.
- **Real material at real scale.** Show captures and UI large enough to read; push in on the region that matters rather than shrinking whole pages into a grid you cannot read.
- **Measured annotations.** Boxes and labels sit on the pixels they describe and carry the real value ("h1 · 64px · 300"). Put the source under the shot.
- **Easing.** Use strong ease-out (cubic or quintic) for things arriving, ease-in-out for camera moves, and no linear motion except counters and scrolling. Entrances take 0.3–0.6s; camera pushes 1.5–3s.
- **Hold.** After motion settles, hold long enough to read: about 0.3s per word plus 1s.
- **Type.** Display type 72–120px at 1080p, labels at least 28px, one family plus a mono for code and data. Sentence case.
- **Transitions.** Prefer a cut on the beat. Use a move-through (a zoom into one tile becoming the next scene) only when it carries meaning. Avoid wipes, spins and flashes.
- **Frame safety.** Keep text inside the central 90% of the frame. For 9:16, keep it clear of the top 12% and bottom 20%, where platform UI sits.

## Voiceover

- One short sentence per beat, written to be heard: concrete nouns, present tense, no adjectives the picture already shows.
- About 2.5 words per second at a natural read. A 2-bar beat at 120 BPM holds 8–10 words.
- Start each line just after a scene start (0.3–0.5s), not on it, so the picture lands first.
- Read the script aloud against the stills before generating or recording anything.
- The voice and the picture say different things: the picture shows, the voice explains why it matters.

## Storyboard before animation

Build three or four key frames as static scenes first (the hook, the proof, the turn, the end card), export them with `render.mjs --stills`, and check them at full size. If a still is not strong on its own, animation will not save it.
