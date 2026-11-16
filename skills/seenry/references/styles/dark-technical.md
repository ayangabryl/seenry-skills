# Dark technical

## Identity

A developer tool on a near-black ground: one event of light crosses the dark, and the product's real surfaces (a list, a diff, a command bar) sit in it at working size. Everything on the page could be typed or run.

## Type

- Headline: two lines, 56–64px at 1440, weight 400–600, line-height 1.0–1.1, tracking −2 to −3.5%. Geist or Inter Display; fallback system-ui.
- Body 16px, interface 13–14px. Geist Mono or JetBrains Mono for code, paths and keys only.

## Colour roles

- Ground: near-black carrying a hue, never pure black; surfaces step up twice.
- Lines: 1px at about 8% white, in place of shadows.
- Signal: one hue, in the light and on the live state.
- Syntax colours exist only inside code.
- Images: duotone into ground and signal.

## Imagery

```json
[{"out": ".seenry/canvas/img/<direction>.jpg", "ratio": "16:9",
  "subject": "<what the product makes faster> as ribbed glass bars in darkness, lit hard from one side, running diagonally",
  "concept": "<the idea line: the one signal that cuts through>",
  "palette": {"shadows": "<ground hex>", "highlights": "<ink hex>", "accent": "<signal hex>"},
  "grade": "duotone", "light": "one hard raking light", "light_reason": "a single source reads as a signal",
  "texture": "fine grain", "texture_reason": "it holds dark gradients together",
  "placement": {"slot": "behind the headline, full-bleed", "field": "the centre, dimmed, for two lines of type", "mode": "bleed"},
  "prop": "the lit edge of each bar", "exclude": "text, logos, people, devices, a second hue"},
 {"out": ".seenry/canvas/img/<direction>-arc.jpg", "extends": "hero",
  "subject": "the same light as one thin horizon arc over <the product's dark field>",
  "placement": {"slot": "the top edge of one lower band", "field": "everything under the arc, black", "mode": "bleed"}}]
```

## How image and interface meet

The light passes behind the headline and under the product window, which spans 90% of the page, is edged in hairlines and fades into the ground at its bottom.

## Below the hero

- **Key field**: four short claims set as keycaps inside a faded keyboard.
- **List and diff**: a real issue list overlapped by a code diff with a true file path.
- **Horizon cells**: five cells divided by hairlines under the arc.
- **Extension shelf**: tall tiles behind a segmented control, a different live mini interface in each.
- **Shipped log**: dated entries in mono, the newest open.
- **Closing command**: a two-line statement with the install command.

## Phone

Headline 36–40px. Code keeps 13px and scrolls inside its own pane. The key field crops to four keys; the shelf shows one tile; the diff drops its second column.

## Never

- Purple-to-blue glow blobs.
- Mono as texture on captions and labels.
- Pure black with pure white.
- Terminal green on black.
- Syntax colour outside code.
- A fake terminal that runs nothing.

## Seen in

Linear `51936621b48340b3af54ddd41d9496c7`; Raycast `f303204a97564b5ebacbb6c483693be8`; Attio `f73e4f74639e472a8eb81c1757d74891`.
