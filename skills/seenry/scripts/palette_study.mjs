/** Compare authored color tokens on the actual page. No palette selection or beauty score. */
export function validatePaletteStudy(spec) {
  if (!spec || typeof spec.scope !== 'string' || !spec.scope.trim()) throw new TypeError('An explicit, unique token scope is required');
  if (!Array.isArray(spec.targets) || !spec.targets.length || spec.targets.length > 16) throw new TypeError('Use 1–16 measured targets');
  const targetIds = new Set();
  for (const target of spec.targets) {
    if (!target.id || targetIds.has(target.id) || typeof target.selector !== 'string' || !target.selector.trim()) throw new TypeError('Targets need unique IDs and selectors');
    targetIds.add(target.id);
  }
  if (!Array.isArray(spec.palettes) || spec.palettes.length < 2 || spec.palettes.length > 6) throw new TypeError('Compare 2–6 authored palettes');
  const ids = new Set(); let keys;
  for (const palette of spec.palettes) {
    if (typeof palette.id !== 'string' || !palette.id.trim() || ids.has(palette.id)) throw new TypeError('Palette IDs must be unique');
    ids.add(palette.id);
    if (!palette.variables || Array.isArray(palette.variables) || typeof palette.variables !== 'object') throw new TypeError('Palette variables must be an object');
    const names = Object.keys(palette.variables).sort();
    if (!names.length || names.length > 40 || names.some(name => !/^--[a-zA-Z][\w-]*$/.test(name))) throw new TypeError('Use 1–40 named CSS custom properties');
    if (keys && JSON.stringify(keys) !== JSON.stringify(names)) throw new TypeError('Every palette must supply the same properties');
    keys = names;
    for (const value of Object.values(palette.variables)) {
      if (typeof value !== 'string' || !value.trim() || value.length > 200 || /var\s*\(|\b(?:currentcolor|inherit|initial|unset|revert(?:-layer)?)\b/i.test(value)) throw new TypeError('Use explicit CSS color values, not inherited or variable references');
    }
  }
  return spec;
}

export async function studyPalettes(page, spec, {sourceSha256, onPalette} = {}) {
  validatePaletteStudy(spec);
  if (!/^[a-f0-9]{64}$/.test(sourceSha256 || '')) throw new TypeError('Supply the unchanged source SHA-256');
  if (onPalette !== undefined && typeof onPalette !== 'function') throw new TypeError('onPalette must be a host capture callback');
  const key = '__seenryPaletteStudy';
  // Validate every selector/color before making any temporary mutation.
  await page.evaluate(async ({spec, key}) => {
    if (window[key]) throw new Error('A palette study is already active');
    const one = selector => {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length !== 1) throw new Error(`Expected one target for ${selector}; found ${nodes.length}`);
      return nodes[0];
    };
    const scope = one(spec.scope);
    for (const target of spec.targets) one(target.selector);
    for (const palette of spec.palettes) for (const value of Object.values(palette.variables)) {
      if (!CSS.supports('color', value)) throw new Error(`Unsupported explicit color: ${value}`);
    }
    await document.fonts?.ready;
    const names = Object.keys(spec.palettes[0].variables);
    const original = names.map(name => ({name, value: scope.style.getPropertyValue(name), priority: scope.style.getPropertyPriority(name)}));
    // Disable color-transition interpolation for this static comparison only.
    const style = document.createElement('style');
    style.textContent = '*,*::before,*::after{transition:none!important}';
    document.head.append(style);
    window[key] = {scope, original, style};
  }, {spec, key});
  const captures = [];
  try {
    for (const palette of spec.palettes) {
      const observed = await page.evaluate(async ({palette, targets, key}) => {
        const session = window[key];
        if (!session?.scope.isConnected) throw new Error('The palette scope was removed');
        for (const [name, value] of Object.entries(palette.variables)) session.scope.style.setProperty(name, value, 'important');
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const result = targets.map(target => {
          const nodes = document.querySelectorAll(target.selector);
          if (nodes.length !== 1) throw new Error(`Target changed: ${target.selector}`);
          const node = nodes[0], style = getComputedStyle(node), rect = node.getBoundingClientRect();
          if (!node.getClientRects().length || style.visibility === 'hidden') throw new Error(`Target is not rendered: ${target.selector}`);
          return {id: target.id, text: node.textContent, rect: {x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height},
            colors: {foreground: style.color, background: style.backgroundColor, borderTop: style.borderTopColor, outline: style.outlineColor},
            backgroundImage: style.backgroundImage, opacity: style.opacity};
        });
        return {viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio}, targets: result};
      }, {palette, targets: spec.targets, key});
      const first = captures[0]?.observed;
      const sameGeometry = !first || (JSON.stringify(first.viewport) === JSON.stringify(observed.viewport) && observed.targets.every((target, i) =>
        target.text === first.targets[i].text && Object.keys(target.rect).every(name => Math.abs(target.rect[name] - first.targets[i].rect[name]) <= 0.5)));
      const capture = {id: palette.id, variables: palette.variables, observed, sameMeasuredContentAndGeometry: sameGeometry};
      if (onPalette) capture.evidence = await onPalette(capture);
      captures.push(capture);
    }
  } finally {
    // Restore only properties owned by this study, including original !important.
    await page.evaluate(key => {
      const session = window[key]; if (!session) return;
      for (const {name, value, priority} of session.original) {
        if (value) session.scope.style.setProperty(name, value, priority);
        else session.scope.style.removeProperty(name);
      }
      session.style.remove(); delete window[key];
    }, key);
  }
  return {schema: 1, sourceSha256, status: captures.every(item => item.sameMeasuredContentAndGeometry) ? 'captured' : 'unverified-comparison', captures,
    limits: ['Temporary token overrides; original product source is unchanged.',
      'Only declared targets are checked for content/geometry continuity. Use a settled state; keyframe animation is not frozen.',
      'A named token may be unused or shadowed. Inspect actual computed colors and pixels before claiming a visual difference.',
      'Colors are browser-resolved observations, not composited contrast, accessibility certification or aesthetic selection.',
      'The host owns screenshots, viewport coverage, variant selection and preservation of the authored palette proposal.']};
}
