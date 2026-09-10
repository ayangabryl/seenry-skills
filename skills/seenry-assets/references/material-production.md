# Real material before the direction is locked

At planning, decide whether imagery is needed, unnecessary or unresolved. “No MCP” does not mean no browsing. If material is unresolved, test candidates before committing to an image-led direction. A grayscale box tests allocation, not photographic quality.

1. **Write the asset job:** subject, evidence/atmosphere/concept role, shape, focal point, lighting, surface and likely text placement. Search concrete subjects and conditions, not “premium image”.
2. **Scout with the layout:** use the host's image search or an exact owner/provider API. Keep a short set of candidate item pages and previews. Change the query if the collection is incoherent; don't accept the first eight attractive thumbnails.
3. **Compose an actual study:** use `scripts/asset_studio.py board candidates.json --out study.html` to compare wide/narrow crops and an original flat print mockup. The board uses real image elements and CSS; it does not modify source bitmaps. This is an internal study, not a suggested website layout.
4. **Judge the collection:** focal visibility, light direction, color temperature, resolution, visual noise, ability to sit beside the actual copy, continuity with the next section. Select or reject with a reason. A beautiful image can still be wrong for the job.
5. **Prepare production:** confirm item rights and intended use, acquire the permitted variant, record attribution/transformations, create responsive variants with authorized project tools, and inspect in the final layout. Keep a replaceable asset map so temporary material can be replaced without rebuilding structure.

## Three honest levels of material

- Blockout: blank areas solely to establish layout; cannot pass material review.
- Temporary visual: an actual licensed photograph, illustration or mockup used to test composition; marked temporary in the working manifest.
- Final: approved material, or an original self-initiated concept clearly identified as such. Do not imply that a stock photo is a client's commissioned project.

A prototype can be visually convincing with temporary material while remaining unready for production. State that distinction in the delivery. Keep provenance backstage except required attribution and a concise concept label where truth requires it. Avoid filling the visitor's page with research disclaimers.

## Mockups that add evidence

Choose a context from the work's use: a publication spread to judge editorial rhythm, packaging at believable scale, a real interface in an accurately proportioned device. Flat image placement with a coherent crop is preferable to an implausible 3D prop. Use original project artwork for the inserted design and permitted photography for the context. Check perspective, lighting and scale. A generic device frame around an empty wireframe adds no proof.

The supplied board is an intentionally flat print proof. It cannot produce realistic photography or certify a commissioned mockup. Use a permitted mockup file and its supported editing tools when realism matters. If bitmap generation/editing is available, follow the host's media tool instructions; benchmark assistance must be recorded separately. ASCII conversion still uses asciify-engine.

## Portable acquisition

The helper has an optional public-domain Met Collection search; it needs no token or MCP. Its narrow domain is art/objects, not a universal photography source. It refuses to treat non-public-domain objects as reusable images. Native search can populate the same manifest from other owners/providers. Unsplash API usage has hotlink/attribution/tracking requirements; do not silently turn those results into downloaded local assets. License text is evidence for agent review, not an automatic legal verdict.

Manifest example: `assets/candidates.example.json`. `check --production` rejects temporary, reference-only, unselected or unreviewed material. It does not validate your legal interpretation or inspect image quality.

Sources: [Met Open Access](https://www.metmuseum.org/hubs/open-access), [Met API](https://metmuseum.github.io/), [Unsplash API](https://unsplash.com/documentation), [Pexels license](https://www.pexels.com/license/).
