# Study films before directing one

Study three to six reference films that do the same job as yours (a launch, an explainer, a social cut) at a similar length. You are learning pacing and craft, not collecting shots to copy.

## Find references in Seenry

With Seenry MCP connected:

1. `search_curated_references(family="motion", min_rating=4)` for human-reviewed picks. An empty result means no current review, not no good film.
2. `search_designs(family="motion", category="Launch videos", q="<product type or topic>")`. Search matches creator captions and tags, not pictures, so keep queries short and structural ("agents", "devtools", "payments", "mobile"). Without `q`, sort by `newest` or `top_rated` and filter by length in the results' `metadata.duration`.
3. `get_design_video(id)` for each candidate: attribution, duration, size and a short-lived video link. Download it promptly; signed links expire within minutes and must not be published.
4. For real product behavior, use website recordings: `search_references(motion=true, site=...)` then `get_page_motion(id)`. These show how a product actually moves, which is often better material than a stylized reference.
5. For the material the film shows (screens, sections, apps, measurements), use the usual routes in [Seenry research](../../seenry/references/research.md): `search_sections`, `search_app_screens`, `get_tokens`, `compare_measurements`.

Without MCP, use films the user supplies or public launch videos you are permitted to view, and say the study was not drawn from Seenry.

## Watch, then measure

Watch each film twice at normal speed with sound before pulling frames. Then use the [video helper](../../seenry-motion/scripts/video_frames.py) from seenry-motion:

```sh
python3 ../seenry-motion/scripts/video_frames.py inspect ref.mp4 --source seenry:<id>
python3 ../seenry-motion/scripts/video_frames.py extract ref.mp4 --out study/<name> --times 0 1.5 3 6 12 --source seenry:<id>
```

To find the cuts, run `ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep pts_time` and read the timestamps. To find the tempo, count beats over ten seconds by ear, or check whether cuts fall on a regular grid.

## Write `study.md`

For each reference, record:

- **Source.** Title, creator, Seenry ID or URL, duration and size.
- **Structure.** Its beats with timestamps: hook, problem, proof, turn, end card. Note how long the first shot is and when the product first appears.
- **Pacing.** Median shot length, the shortest and longest shots, whether cuts land on the beat, and how long text stays up.
- **Type and picture.** Display size, weight and tracking, how text enters and leaves, camera moves (push, pan, zoom into UI), and whether the UI is real or stylized.
- **Sound.** Music style and tempo, where it drops and breaks, voice or none, which events get effects, and whether there is silence.
- **What to take and what to reject.** Name each with a reason tied to your brief.

Close with the direction: the length, tempo, number of beats, the one signature moment, and what the sound does. A reference's choices are evidence of what worked for its product, not rules. Say which relationships were only seen once and remain unverified.
