# Design practices

Short rules learned from pages that people sent back. Each one is checkable on the rendered page. The [bans](bans.md) list what never to do; these say what to do instead.

## Colour and images

- **One hue per page.** One accent hue carries every link, button, chart and highlight; the rest is neutrals. A second hue appears only when it means something different (an error, a status).
- **No colour field behind a picture or video.** A photo or film sits on the page's own background, never on a tinted panel or a gradient box. The picture is the colour.
- **Text on a photo passes contrast.** Measure it over the busiest part it covers. If it fails, move the text to a calm area of the image, or crop so it falls there; a scrim (a gradient darkening under the text only) is the last resort, never a flat grey veil over the whole image.

## Motion in content

- **A swap changes only the content.** When a word, picture or number changes, the box around it, its size and its neighbours stay still. Measure the longest value and reserve its room.
- **Only the words that change blur.** In a rotating headline, the fixed words stay sharp and still; the blur or fade runs on the changing word alone.

## What a page shows

- **One headline and one picture per screen.** Each viewport has one thing to read first and one image to look at. A second headline or a second hero image on the same screen splits attention.
- **Little text on marketing pages.** A headline, one short line under it, and labels. Anything longer goes to a page someone chose to open.
- **Example work is clean.** A screenshot, portfolio piece or template shown on the page is held to the same bar as the page itself: real copy, no placeholder, no default styling. A messy example makes the product look messy.
- **Real proof only.** No invented customers, quotes, logos, figures or reviews ([bans](bans.md)). With no proof yet, show the product working instead.
- **No full-width lines between sections.** Sections part with space or a tone change. A full-bleed rule belongs only at a structural edge: app chrome, a table's head and foot, a card's header. A marketing header gets its line only once content scrolls under it ([lines](../../seenry-craft/references/lines.md)).
- **⌘K only where people move by name.** A command menu fits an app people live in or docs with dozens of pages, opened from the shortcut and a visible search button, listing actions as well as places. A landing page, portfolio or small site has none; a shop or content site gets a plain search field. Never a shortcut hint on a phone, and Ctrl K on Windows.
- **Official marks on sign-in buttons.** "Continue with Google", Apple, GitHub and the rest use that company's own logo, colours and wording from its brand guidelines, never a redrawn icon or a monochrome guess.

## Hover and press

- **Hover changes colour, nothing else.** No drop shadow that appears on hover, no card or picture that lifts, grows or tilts, no decorative hover animation. Hover is a tint or opacity change in about 120ms, only on devices with a fine pointer. Add more only when the person asks for it.
- **No grey box on tap.** Phones draw a dark tap highlight over every link and button unless the page turns it off: set `-webkit-tap-highlight-color: transparent` on `html`, and let the control's own press and `:focus-visible` ring give the feedback.
- **Press is a small scale on real controls.** Buttons and controls scale to 0.97 for about 100ms; cards, rows and text do not. No heavy pressed styles, no ripple.

## Before showing it

- **Three widths.** Render at 1440, about 1057 (a laptop with a side panel open) and 390. The middle width is where grids break, text wraps badly and nav overflows.
- **Dark mode, looked at.** Render every screen in dark mode and look: images with white edges, shadows that vanish, borders that glow, a logo that disappears on the dark background.
