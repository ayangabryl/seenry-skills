# Fluid surface reference study — September 24, 2026

Reference: https://libraries.dev/gooey.html, public preview, default Morph.
Upstream engine: liquid-gooey 0.2.2, MIT, Jakub Antalik. Exact notice bundled in skills/seenry-motion/assets/fluid/LICENSE.upstream. Package is pinned; Seenry adds an adapter, reduced-motion fallback and application examples.

## Minimal capture

One opening and one closing, each recorded within a 2.8-second capture window. Kept clips trim idle time to approximately 1.15s and 0.79s plus final hold. Frame timestamps are original CDP capture metadata. Contact sheets show actual samples. No frame interpolation. Raw screenshots were discarded after generating these bounded artifacts.

Opening recording has a 387.71ms gap among retained samples; closing has a maximum 45.04ms gap. Therefore these clips demonstrate the silhouette and endpoints, but cannot prove exact frame-by-frame opening fidelity. Capture time zero is not click time zero. Do not invent reaction latency or fitted spring constants from this record.

## Source-disclosed vs measured

Measured settled control rectangles in CSS pixels, 920px browser width:
- Trigger: x568,y411.5,w40,h40.
- Left action: x514,y377.5,w40,h40 (delta -54,-34).
- Middle action: x568,y347.5,w40,h40 (delta 0,-64).
- Right action: x622,y377.5,w40,h40 (delta +54,-34).

Public preview code discloses 550ms cubic-bezier(0.34,1.56,0.64,1), stagger 40ms. Controls disclose blur6/contrast18/waviness0. These values are adopted directly. Screenshot-derived engine parameters are not claimed. Source surface is dark with a fine highlight; Seenry uses its own shared surface token/shadow. Geometry and flow are matched by the same engine and configuration; the result is not represented as pixel-identical.

## Transfer

The authored lab includes Merge (Actions, Panel), Trail (Selection, Slider), Bend (Card, Pill), Blend (Images), and Blur (Label, Detail). Only the action fan was measured against this source. Other contexts demonstrate adapter reuse and are not reference replicas. No Pro controls or paywalled content were used.

Review scope: desktop Chromium; keyboard range input and actions; panel close/focus; mobile and reduced motion are checked in this change's final browser pass. Cross-browser fidelity remains unverified.
