# Loading that preserves useful content

Use for skeleton reveal, shimmer, thinking/status indicators, matrix loaders and image-generation placeholders. These are different presentations of work, not evidence of its progress.

Reserve final geometry before loading begins. Retain useful previous content during refresh. For a skeleton-to-content reveal, keep the same occupied bounds and crossfade only when the content is ready. Error and timeout are separate states with retry. Do not endlessly shimmer after failure.

A shimmer is a moving highlight clipped to the intended material or text. Keep its contrast quiet enough for the content role. Never run multiple large filtered layers just to fill an empty panel. A matrix loader or organic orb is suitable for an expressive process, not a precise progress percentage. Provide a static readable status and stop the loop on pause, cancellation, invisibility and reduced motion.

A generation placeholder reveals an already available image; it does not generate it or report backend completion. Keep the previous image until the new image decodes. If the asset fails, retain usable content and show recovery. Do not let a decorative reveal delay access to a finished result. See [expressive effects](../expressive-effects.md) only when a shader or material treatment is required.

Working baseline: CSS opacity on a pseudo-element shimmer, enabled only inside `prefers-reduced-motion: no-preference`; business state removes it on success or failure. Use stable `aspect-ratio` for images. Do not use `transition: all` on the loaded container, since intrinsic size changes may animate accidentally.

**Counterexample:** an apparent AI “thinking” state that continues after the request is canceled or claims a percentage derived from animation time.

**Check:** cached instant response, slow response, offline/failure, cancellation, tab hidden then visible, reduced motion toggled while loading, image decode after response, repeated retry. Compare the loaded geometry with its reserved space. Persistent loops need an actual pause policy.
