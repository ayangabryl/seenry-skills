# Level reference

"Design like @someone", "at this level": the person shows work for the register and level they want, not a site to copy. Their work sets floors; the layout, brand and content stay this product's own. To copy a named site, follow [named site](named-site.md).

## The example

A person showed a designer's landing-page posts. Builds briefed only with what to avoid came back correct and timid, and scored 6 to 7. The build that measured the posts first ([Waterline](../assets/examples/waterline/README.md)) took three moves from them: the image in front of the app, a metric card for each mini visual, a two-line light headline.

## Do

1. Save five or more full-size images of the work to `.seenry/level/`. Pass the images, never a description, to every agent and critic.
2. Run `canvas.mjs verify --studio`: the level images are torn down first, into `.seenry/teardown.md`.
3. Write `.seenry/level.md`:

```
Register: loud
Allow: twoToneHead, multiHue
- twoToneHead: one two-tone headline per section, as the work does
- multiHue: a second hue for status inside the product view only

Floors
- Hero image: covers 55% of the first screen, in front of the app's lower 45%
- Product view: 19 kinds of UI, at 1100px wide
- Colour fields: 2 full-width fields
- Headline: 62px, weight 300, 2 lines
- Images: one grade (#0E2A8A shadows, #DCE6FF highlights, one accent)
```

| Line | Means |
| --- | --- |
| `Register:` | Quiet or loud, from the work. It outranks the house default |
| `Allow:` | Bans the work itself uses, each with its limit. Keys: `twoToneHead`, `caps`, `multiHue`, `bigHead` |
| Floors | The work's measured moves. The build meets or exceeds each |

## Build to it

- Make the hero image for its slot: a cut-out or a full-bleed scene with an edge the UI can sit behind, never a stock scene with UI pasted on.
- Put the product's real UI beside the subject at the work's scale.
- Change the layout from the work's. Never trace one post.

## The bar it sets

| Check | Passes at |
| --- | --- |
| The first-screen image, in `photo_check.mjs` | 8, within three attempts |
| The critic's `impact` (would a design-literate person stop scrolling) | 8 |
| The critic's `execution` (product view, chart form, image and UI, motif, finish) | 8 |
| Each option beside a level image, judged blind | Not a reskin, not visibly less finished |

`check.mjs` passes `level.md` and `.seenry/level/` to the critic and reports impact and execution beside the overall score.
