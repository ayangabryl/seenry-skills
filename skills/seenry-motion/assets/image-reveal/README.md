# Decoded image reveal

This original Seenry asset reveals a **real, decoded image** as a short mosaic-to-clear transition. It does not generate images or claim progress for a backend operation. The previous image stays visible while the next URL loads; a failed URL leaves it intact. Rapid requests make the latest request authoritative. The canvas is decorative, while the settled `<img>` carries the meaningful alternative text. These source files are original to Seenry under the [repository's MIT license](../../../../LICENSE); retain that notice when copying the source. Do not attach licenses for unrelated adapters or motion research to them.

Copy `image-reveal.mjs` and `image-reveal.css`. Use one host with one image:

```html
<link rel="stylesheet" href="./image-reveal.css">
<div class="seenry-image-reveal"><img src="first.jpg" alt="First result"></div>
<script type="module">
  import { createImageReveal } from './image-reveal.mjs';
  const reveal = createImageReveal(document.querySelector('.seenry-image-reveal img'));
  // Call only when an actual resource URL is available.
  const result = await reveal.show('/results/second.jpg', 'Second result');
  // result: 'shown', 'error', or 'superseded'. Call reveal.destroy() on unmount.
</script>
```

The host must have a stable size and use `object-fit: cover` with centered cropping. The image and canvas share that crop. The controller uses a capped 2D canvas resolution, pauses work after settling, and commits immediately under reduced motion, including when the preference changes during a reveal. It uses native `<img>` decoding and has no package dependency. If canvas is unavailable, leave the plain image visible and use an ordinary image swap. Application code owns loading, failure, retry, and source URLs; avoid starting a decorative countdown to suggest real progress. Same-origin or CORS-enabled images are easiest to verify.

[Demo](demo.html) and [browser checks](../../../../tests/image-reveal.browser.mjs) are included. Check the actual crop, large and small viewports, rapid replacements, failure, keyboard controls, reduced motion and cleanup in the host product.
