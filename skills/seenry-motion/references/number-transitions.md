# Numbers that keep their meaning

Animate a number when seeing its change helps someone follow the result of an action: servings, a quantity adjustment or a changed estimate. A running clock, precise scrub value or busy data table may work better with immediate updates. Do not animate fabricated progress or delay the real value until the animation completes.

Before implementation decide the supported range and format, the fixed reading edge, the units, and what happens when input arrives again. Keep units and punctuation outside a changing-width number when their position matters. For a timer, reserve separate digit columns and fixed colons. Do not animate a whole time string as a decimal number. Announce the meaningful completed action through the owning control or status; do not announce every visual frame.

## Local optional runtime

`assets/number-transition.mjs` exports `createNumberTransition({slot,value,locales,format,duration,reserveValues,align})`. The text-only `slot` should contain the usable initial value before enhancement. Keep its unit and control labels in the application. `align` defaults to `inherit`; use `start`, `end` or `center` only for the chosen reading edge inside the reserved width. `update(value)` retargets from the current visual state; `set(value)` settles immediately; `destroy()` stops enhancement and leaves the latest formatted text. Values must be finite. The adapter exposes `value` and `animationSupported`; these are not evidence of visual quality.

Use the real number renderer during the **typography checkpoint**, before selecting the composition. Its mask, line box and reserved width can move visible digits even when the outer slot stays still. Compare the visible digit edge and neighboring label/unit with the unenhanced study at actual values. A table may need an end anchor; a left-aligned summary should not acquire one from the animation helper. Exercise the control that changes this number: changing people can alter a per-person share while leaving the total unchanged.

The adapter uses the real **NumberFlow 0.6.2** engine. Copy its adjacent `number-flow/` directory, manifest and both licenses. This is a browser module with local imports, so no MCP, CDN or build tool is required. If NumberFlow is already installed, use the project's version and equivalent integration instead of registering a second copy. Inspect version APIs before switching versions.

```js
import {createNumberTransition} from './number-transition.mjs';
const amount=createNumberTransition({
  slot:document.querySelector('[data-amount]'),value:4,
  format:{maximumFractionDigits:0},reserveValues:[1,8,12],duration:280
});
// After the application's authoritative state changes:
amount.update(servings);
// On unmount:
// amount.destroy();
```

`reserveValues` measures representative formatted strings in the actual font and reserves the widest. Include sign, grouping, decimal and widest-digit cases across the real range. Endpoints alone may not be widest. This is a **minimum** width, not a clipping box; values beyond the planned capacity still render and may change the layout. Remeasure after font or container changes. Check the anchor with real values at both widths, not just a tabular-numeral declaration. For zoom or text-spacing changes, preserve reflow instead of forcing an obsolete pixel width.

The accessible text changes immediately and is separate from hidden decorative digit layers. There is no automatic live region. Reduced motion settles ongoing animation and subsequent updates remain immediate. Unsupported animation capabilities retain static output. Non-Latin numerals, RTL containers and scientific/engineering notation use static `Intl.NumberFormat` output because this pinned engine does not support them. Use static text directly if enhancement adds no useful information.

## Verify the actual sequence

Exercise 9→10, 99→100, a decrease, negative/positive transitions and decimal precision appropriate to the task. Rapidly reverse direction before settling; the latest real value must win. Inspect ordinary speed and intermediate frames, the fixed unit/colon, keyboard input, font loading and live reduced-motion changes. Test disposal during movement and retain truthful output if the module fails to load. Do not infer a smooth experience from a changing label or from a dependency name.

Sources: [NumberFlow vanilla API and limitations](https://number-flow.barvian.me/vanilla), [source and MIT license](https://github.com/barvian/number-flow), [esm-env export conditions](https://github.com/benmccann/esm-env). The reservation, accessible-text ownership and lifecycle wrapper are Seenry integration decisions; timing remains a project hypothesis to inspect.
