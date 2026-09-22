# Text, icons and values through a state change

Use for label replacement, glyph swaps, numeric updates, line reveals, status sequences and streamed text.

**Label or icon replacement.** Reserve enough space for the real labels. Place outgoing and incoming visual layers in the same slot; keep one current accessible value. Crossfade or translate independently without scaling the text. A blur is optional evidence, never a default. Use [icon swap](../../assets/icon-swap.mjs) for separate glyphs or [morph adapter](../adapters.md) only when the paths actually correspond. A plus-to-close morph can rotate matching strokes; unrelated glyphs often need a swap.

**Numbers.** Keep signs, units and decimal alignment stable. Choose digit roll when place-value continuity matters, a brief entry for a newly introduced value, or an immediate update while dragging. Use [number transitions](../number-transitions.md) for the pinned runtime and its licenses. A countdown must display true elapsed time; a pleasant easing curve must not falsify it.

**Text reveal.** Segment by stable words or lines only after fonts and available width are known. Reflow changes line segmentation. Avoid leaving per-letter elements in the accessible reading order. An opacity mask over a single semantic paragraph often preserves selection and accessibility better than reconstructing every character.

**Streaming and status sequences.** Render real arrived text, batch visual updates, and preserve the reader's scroll position unless they remain at the bottom. Do not keep pulling someone downward after they scroll up. Announce a coherent status rather than every token. A displayed reasoning stream must be actual product-provided content, never fabricated internal reasoning. Cancel, retry and completion stop the loading presentation.

**Counterexample:** a button grows every time “Copy” changes to “Copied,” moving the next action, or a counter spins through invented values after the request failed.

**Check:** longest label, repeated updates before settlement, negative numbers, localized formatting, font fallback, reflow during reveal, cancellation, reduced motion. For a replica compare actual baseline, line breaks and first-visible content frame separately from the background shell.
