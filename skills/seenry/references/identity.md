# Identity first

Studios do not lay out a page and then pick colors. They design an identity, a few parts used with total conviction, and the website is one application of it. Look at any rebrand in Seenry (Sommerro, Wise, Murray's Cheese, Transavia, Toca Boca): one truth, one type voice set large, one color as a full field, one device from the truth, one image treatment, one line in the brand's voice. The brand is recognizable with the logo covered.

Generated pages do the opposite: a correct layout with a palette applied. Clean and correct scores 6. A designed identity is what makes a 9.

## Taste is trained

- **Unseen details compound.** A 1px hairline, a concentric corner, tabular figures, a 140ms hover: none is noticed alone. Together they separate "tidy" from "expensive". Do all of them.
- **Remove before you add.** When a page feels plain, the fix is better material, scale or spacing, almost never more decoration.
- **One idea per view, carried all the way.** One dominant element, one owned detail, one signature motion moment.
- **Real over representational.** Real product UI, photography, data and copy beat any illustration of them. A deliberate medium is not an illustration: when the identity or reference is painted or rendered, keep that medium and make it convincing.
- **Motion is part of the design.** A page that does not respond feels unfinished however good the stills look.

## Write identity.md, then render it

Write `.seenry/identity.md` and render it as `.seenry/identity.html`: one screen, like the opening frames of a rebrand film. Eight parts.

### 1. Truth

One real thing the brand is or comes from: the building it occupies, the hour it opens, a timestamp that proves who said what. From the brief, never invented history.

### 2. Visual idea

How the truth becomes form, not copy. Write it so a designer could apply it to a poster with no website in sight.

| Kind | Examples |
| --- | --- |
| Typographic device | Letters cut by a rule, a stacked or split wordmark, a ligature |
| Grid | A ledger, a timetable, a contact sheet |
| Crop language | Always tight, always cut by the frame |
| Material | Paper, film grain, glass, enamel |
| Behavior | Things arrive in the order they happened |

### 3. Type voice and range

- One family, usually, chosen from the measured type of the kept references and the tiers in [art direction](art-direction.md#4-type-chosen-like-the-leaders-choose-it), tuned the way they tune it. The text face stays quiet.
- Put three candidates on the board and keep one.
- Give it range: five or six levels (display, section display, lead or pull quote, body, caption, an annotation voice such as small caps or tabular figures), plus the moves each level may make: a phrase set large in the text face, a hanging caption, a margin note, a run-in heading, a number with its unit set small.
- One treatment repeated down the page reads as monotonous, even when it is strong.

### 4. Register and color world

- Start `identity.md` with `Register: quiet premium` or `Register: loud`. The board holds a quiet page to its rules: a first screen led by a photograph or painting, three or more image moments, no saturated brand bands, no visual shown twice.
- One hero color plus ink and paper, named for where it comes from.
- Loud brands use it as a full field. Calm, premium brands may keep it restrained and let photography, type and composition carry the identity. Restraint done with conviction is an identity too.

### 5. One graphic device

- From the visual idea; it repeats across the page: a mark, a pattern, a rule system, a frame, a cut, a stamp.
- Never an asterisk, sparkle, star or flower.
- Every appearance carries information: a date, a measurement, a label, a route. A device used as a divider or filler is decoration.

### 6. Image concept and treatment

- What the imagery says, plus one surprising angle that is not the category's first picture: an unexpected scale, crop, object or staging.
- One look for every image (crop, light, grade, grain, framing), applied in code as well as in the prompt: a CSS or canvas treatment every image passes through, so the set reads as one shoot.
- At least one image works with the type or device (overlapping, masked, cut out), not only framed.
- Choose the light from the brand's truth, and say why: flat overcast, hard noon sun, on-camera flash, a studio seamless, sodium night, an archival scan. Golden hour and moody mist are the generator's defaults, and judges now see them on every AI page.

### 7. Voice line

One short line in the brand's voice that could sit alone on a poster.

### 8. Motion score

Choreograph the page like a film, not component by component. Blind studio judges scored tidy 0.5s fade-ups on every block 3 to 5 for motion while everything else scored 8.5 to 9.

Page choreography runs on its own clock (600 to 1400ms, one expo-out curve, scenes scrubbed to scroll). Interface motion stays at 140 to 280ms. Write the score in `identity.md` under `## Motion` and build all of it:

- **Entrance, done by 1.2s, in order.** The subject first, with scale: the image unmasks (`clip-path` inset to 0 over about 1s) while settling from `scale(1.06)` to 1. Then the headline by line, each rising 24 to 40px inside a mask, 80 to 120ms apart. Then the supporting line and action; the navigation last. The headline is readable by 0.8s; nothing that names the product arrives after 1.2s.
- **Pad every line mask.** `padding-block: 0.15em` with a matching negative margin. A tight display line inside `overflow: hidden` slices the tail of g and y; the board blocks clipped letters.
- **At most one held scene, and only when it explains a transformation.** One section 160 to 250vh tall with a sticky stage, while the thing that proves the idea visibly changes: layers separate, the framing moves from whole to detail, a drawing builds, a number resolves. Map it to 0 to 1 progress with a reading hold ([scroll choreography](../../seenry-motion/references/scroll-choreography.md)). Most pages need none: a pinned section that explains nothing reads as a trick, and in a still it is an empty band. Filter or opacity shifts alone are not a scene.
- **The device travels.** It draws itself in as each section reaches it (`stroke-dashoffset` or a mask on `animation-timeline: view()`).
- **Images arrive, text stays readable.** Large images reveal by mask or framing; body copy stays at full opacity.
- **One idle loop at most,** and only when it shows the product's own behavior.

Build it with the bundled [scene](../assets/scene/README.md) (`scene.css` and `scene.js`, no library), CSS scroll-driven animations, or GSAP ScrollTrigger (`https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js`). The reduced-motion version is complete: write the resting CSS as the final state, animate from the start state, and under `prefers-reduced-motion: reduce` drop pins and extra scroll height so each section closes to its natural height. The review's full-page still uses that version, so blank travel shows as empty space. Stay under a 10% CPU budget.

### Drawn layer, only if it can be drawn well

When the idea is genuinely drawable and you can draw it at an illustrator's standard: one illustration system as hand-written SVG in one stroke weight (profiles, maps, diagrams from real parts). See [building](building.md#craft-illustration-and-ambient-visuals). A crude drawing is worse than none and is the clearest sign a page was generated.

## The board

The board shows, on one screen:

- The wordmark.
- The type scale with every level in use, in one passage.
- The color world in its real proportions.
- The device, one treated image, and one drawing if the page has a drawn layer.
- The motion score as a short storyboard.
- Two posters made only from these parts: the hero, and the hardest ordinary section (pricing, FAQ, security or the team). Blind judges found pages held their idea in the hero and fell back to stock bands below it.

If a poster could belong to a competitor, the identity is not done.

Study at least one studio site first (`list_sites {q: "studio"}`); pull frames from rebrand films with `python3 ../seenry-motion/scripts/video_frames.py`. Build your own; never take another brand's mark, face or device.

## Do not repeat yourself

This applies to new identities. A page made like a named site takes that site's look; the history check does not apply to it.


- Run `node scripts/history.mjs --list` first. It prints the face, hero color and device of recent identities on this machine.
- Fit comes first. Then check it is not a copy: never the same hue family and kind of device together.
- A face may repeat when it fits. When an identity is close, change the color or the device, never downgrade the type.
- The examples in Seenry's files explain principles. They are never to be reproduced.

## Then the page applies the identity

- **The board's hero poster is the first screen.** Scale it up: the same type at the same confidence, the color field, the crop and the device, plus the navigation and one action. The critic scores a page weaker than its own board as identity 6.
- **One statement, one visual.** The display type and one image, object or product moment, owning most of the screen. Supporting copy is one line; the action is one button. Forms, facts and captions go below, unless a field is the product (a travel search).
- **The subject leads.** When the brand has a real place, object or product, show it large on the first screen. Type-only and color-field heroes are for brands with nothing to show.
- **Ordinary components are designed, not defaulted.** Judges who scored the hero 9 marked pages down for product cards, pricing, forms, tables and the footer. Design each from the device and grid: a price set like the brand's label, a form laid out like its ticket. Field labels and metadata at the [size floors](standard.md#size-floors) in full-contrast ink. One control height and radius family. Visible hover, focus and error states. A footer that is a closing poster, not four link columns.
- **The system runs to the footer.** Pricing, FAQ, testimonials and the closing band use the type voice, field and device as fully as the hero. A second half that could belong to any site is unfinished.
- **Typographic range in the middle.** Every section uses at least two levels of the scale, and neighbours lead with different moves: a pull quote, a captioned grid, a measured number, an editorial passage with a margin note. Change scale sharply inside a section rather than stepping everything down one size.
- **Sections are posters in the same system,** not a heading, a paragraph and a module. Web conventions stay only where they are controls: navigation, buttons, forms, product cards, pricing.
- **Borrow a structure, not a look.** Take one composition model from a studio site or leader you inspected and write its structure in `idea.md` from its full page: grid, type ratios, how sections alternate in scale and density, how it crops. Fill it with this identity; never copy its content, imagery or device.
- **Phone keeps the proposition and the way around.** The first phone screen shows the subject cropped to what identifies it, the headline and the action. The navigation stays reachable as a menu button.

## Seenry's own defaults are tells now

These have become recognizable as generated. Use one only when the identity makes the case, and say why in `DESIGN.md`:

- A text column on the left with a photograph filling the right half.
- A giant numeral as the hero device, unless the number is the brand's truth.
- A centered headline over a boxed product card.
- The same type everywhere with no tuning: default tracking, bold headlines.
