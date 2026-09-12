# Carry the selected design into implementation

A written plan is provisional. A selected type/surface study is a concrete artifact with actual copy, dimensions and state. Carry its source and wide/narrow captures into the next stage; do not ask a model to reconstruct it from a flattering style description.

Reconcile the selected study with existing project brand guidelines and authoritative tokens/components as well as DESIGN.md. Record the guideline version and any intended exception. When a shared rule changes, update its actual source and documentation together, then inspect affected representative uses; a matching prose description cannot establish implementation consistency.

Before retaining it, compare its actual typography and emphasis with DESIGN.md. If the plan says Inter at 22–26px but the study renders another family at 44px, resolve that discrepancy now. Either deliberately revise the plan with rendered evidence or correct the study. Do not silently call the difference polish. A declared family is not proof of a loaded font: inspect loaded font resources and real glyphs as well.

Choose a few consequential relationships to retain, such as the title and field alignment, image-to-control gap, common action height, or the unit's anchor when a quantity changes. Avoid freezing every pixel or copying a successful component's dimensions into an unrelated brief. Keep one record per viewport and important state. A useful responsive change should update the selected evidence and rationale, not be forced back to an obsolete measurement.

The optional browser module `scripts/design_continuity.mjs` exports `captureDesignContinuity(spec, metadata)` and `compareDesignContinuity(record)`. Read its small source before use. The host supplies the selected artifact's actual SHA-256, selectors and explicit CSS properties. Record after fonts and transitions settle. It compares computed declarations and selected edge/center relationships at the same viewport and device scale; it does not grade appearance, test accessibility or select a font.

```js
const spec={
  targets:[
    {id:'title',selector:'.component h2',styles:['font-family','font-size','font-weight','line-height']},
    {id:'field',selector:'[data-first-field]',styles:[]},
    {id:'action',selector:'[data-primary-action]',styles:['border-radius']}
  ],
  relations:[
    {id:'content alignment',from:'title',fromEdge:'left',to:'field',toEdge:'left',tolerance:1},
    {id:'action inset',from:'field',fromEdge:'left',to:'action',toEdge:'left',tolerance:1}
  ]
};
// Run in the actual rendered page. sourceSha256 comes from the host's file digest.
const record=captureDesignContinuity(spec,{sourceSha256,selectionNote:'The retained type study aligns title, fields and action.'});
// On the finished artifact, at the same width/state:
const comparison=compareDesignContinuity(record);
```

`changed` means investigate and compare, not automatically reject. `unverified` covers absent/ambiguous targets, a different viewport or loading fonts. Never count either as retained. Root scroll is compensated for normal document layout; fixed/sticky elements and nested scrollers need a controlled matching state. Use the separate transition recorder to study movement between settled states.

Keep the chosen record, later comparison, any deliberate revision and the reason together. This makes a discrepancy inspectable. It cannot guarantee that the first selection was a good design.

For a changing plain-text action label, measure its actual strings before reserving space. The same module exports `measureLabelStates(selector, ['Copy summary', 'Copied'], {sourceSha256})`. Run it in the settled page after fonts load. It measures a temporary hidden text probe using the label's computed typography, removes it, and reports each string's intrinsic width against the current label space. It makes no product source edits. Mixed text/icon elements and transformed or vertical text require their own appropriate renderer; select the plain label span.

Use the measurements to inform a layout decision, then inspect the complete action again. Reserving the outer button can still move its icon or text; reserving too little label space can introduce a new line break. Test ordinary and text-spacing states separately, including the longest relevant translation. These supplied strings do not establish a universal width, and legitimate reflow must remain available. Keep the control bounds, internal anchors and label presentation consistent with the selected design together.
