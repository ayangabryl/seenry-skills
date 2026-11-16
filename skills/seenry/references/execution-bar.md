# The execution bar

The measured difference between a page at its references' level and one that only has the idea. Worked example: [Waterline](../assets/examples/waterline/README.md).

## Look, then sketch

Open the three references in `.seenry/canvas/refs/` at full size: how much product is shown, how image and interface meet, what returns below the hero. Then sketch; the person judges the sketches, and this bar is what the finished page is held to. With `--studio`, `canvas.mjs verify` also writes `.seenry/teardown.md` with a blank (`__`) per count to fill in.

## The bar

Every page, of any kind (product, studio, portfolio, shop, clinic, editorial):

| Part | Floor |
| --- | --- |
| Real material | The product, the work, the goods or the place itself, at real size and art-directed. Never thumbnails in equal cards |
| Image and layout | Meet in depth, as your image allows: the image in front, the UI or type melting into it, cards fanned with connectors. Never a panel on a picture |
| Every section | One moment in each section below the hero: the hero image in a new crop or role, a product or work moment, or one measured number. The image may return as a ground (behind the section, bled or masked into it) in a new crop each time; two pictures of it in flow, or one crop in sibling tiles, are blocked. Pricing, questions and closing use the page's device, not default cards |
| One grid | Every block shares the page's left and right edges, is centred inside them, or bleeds. Any other width carries `data-seenry-inset="<reason>"`: every width difference has a stated reason |
| One hue system | One saturated hue outside the images; a state is a weight, a fill or the one highlight |
| Headline | Two lines, 60 to 76px at 1440, light or regular weight |
| Motion | Every movement has a row in `MOTION.md` with the change it explains; one signature moment carries the idea; at most one idle loop; body text never arrives late (`seenry-motion`) |
| Finish | Logos are marks in one colour; buttons and tabs are designed controls; one radius family |
| Not a reskin | Layout, palette and image subject never all come from one reference, the Waterline example included |

Only when the page shows a product view (marked `data-seenry-product`):

| Part | Floor |
| --- | --- |
| Product view | 12 or more kinds of UI: navigation, a top bar, avatars or a status, two actions, metric cards, a tooltip or selected state. 2 or more kinds of visualisation |
| Chart form | A designed object (sticks with a mirrored row, stacked blocks, a filled curve), in the page hue with one highlight |

A level reference that does otherwise sets its own floor: add `multiHue` or `bigHead` to the `Allow:` line in `.seenry/level.md`.

## How it is checked

| Command | Blocks on | Warns on |
| --- | --- | --- |
| `canvas.mjs verify` | A sketch with no idea line or no real image in its hero; a full page whose hero image or motif never returns below the hero; a product view under 12 kinds of UI or 2 of visualisation; one crop in 3 sibling tiles; a block off the grid with no reason | A second hue; a headline over 2 lines or 80px; a section of only equal cards |
| `check.mjs` | The same on the built page; a page that moves with no `MOTION.md` reasons or no reduced-motion CSS | |
| Either, with `--studio` or unattended | A teardown with blanks (studio); a reskin or a visibly less finished screen (blind judge); the blind critic's `execution` under 8 | |

Each message names the number it measured and the number it needs.
