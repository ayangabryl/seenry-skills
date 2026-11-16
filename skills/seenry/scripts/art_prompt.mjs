/** Art-directed image jobs: the fields every generated image must decide before it is generated, and the prompt built
 *  from them. A brief that only names a subject and a setting produces a stock picture; this refuses it.
 *
 *  Job fields (image.mjs --batch entries, or the same keys as image.mjs flags):
 *    subject     what is in the frame, doing what, from which distance
 *    concept     the idea the image carries, not the literal scene ("the moment a lawyer finds the one clause that matters")
 *    palette     {shadows, highlights, accent} as hex, taken from the page's tokens
 *    grade       monochrome | duotone | desaturated-one-accent | full-color (full-color needs grade_reason)
 *    light       one light, and light_reason: why this light belongs to the brand
 *    texture     grain | halftone | torn paper | collage | none, and texture_reason
 *    placement   {slot, field, mode}: where it sits on the page, which area stays empty for type or UI, and
 *                cutout (transparent background), tile (cropped into a frame) or bleed (full-bleed behind content)
 *    prop        the brand colour or mark inside the frame
 *    ratio, exclude   optional */

export const GRADES = ['monochrome', 'duotone', 'desaturated-one-accent', 'full-color'];
export const MODES = ['cutout', 'tile', 'bleed'];
const HEX = /^#[0-9a-f]{6}$/i;

const STOCK = [
  [/\bsmil(e|es|ing)\b/i, 'smiling'],
  [/\b(happy|cheerful|confident(ly)?)\b/i, 'a mood adjective instead of a moment'],
  [/\b(modern|bright|busy|open[- ]plan) (office|workspace|kitchen)\b/i, 'a generic modern setting'],
  [/\b(business ?(man|woman|people|person)|professionals?|diverse team|team of)\b/i, 'generic business people'],
  [/\b(pointing at|looking at) (a |the )?(laptop|screen|camera)\b/i, 'pointing or looking at a screen'],
  [/\b(shaking hands|handshake|thumbs up|high[- ]five)\b/i, 'a stock gesture'],
  [/\bstock (photo|image)\b/i, 'asks for stock'],
];
const DIRECTION = /#[0-9a-f]{6}|\bgrade[ds]?\b|\bgrain\b|\bhalftone\b|\bmonochrome\b|\bduotone\b|\bnegative space\b|\bempty (field|area|left|right|top)\b|\btransparent background\b/i;

/** Stock tells in a free-text brief. Direction words (hex colours, a grade, grain, an empty field) excuse none of them
 *  but a brief that has neither tells nor direction is still reported as undirected by validateJob. */
export function stockTells(text = '') {
  // "no corporate smile" and "not looking at the camera" direct away from the tell, so they are not one.
  const negated = (m) => /\b(no|not|never|without|avoid|avoids|neither|nor)\b[^.;:]{0,24}$/i.test(text.slice(Math.max(0, m.index - 28), m.index));
  return STOCK.filter(([re]) => [...text.matchAll(new RegExp(re.source, 'gi'))].some(m => !negated(m))).map(([, why]) => why);
}

const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;

export function normalize(job = {}) {
  const pal = job.palette || {};
  const place = job.placement || {};
  return {
    ...job,
    palette: typeof pal === 'string'
      ? Object.fromEntries(['shadows', 'highlights', 'accent'].map((k, i) => [k, pal.split(',').map(s => s.trim())[i]]))
      : pal,
    placement: typeof place === 'string' ? {slot: place, field: job.field, mode: job.mode} : place,
  };
}

/** Every reason the job is not art-directed yet. An empty list means it can be generated. */
export function validateJob(raw) {
  const job = normalize(raw), errors = [];
  const need = (k, v, hint) => { if (!v || !String(v).trim()) errors.push(`${k}: missing (${hint})`); };
  need('subject', job.subject, 'what is in the frame');
  need('concept', job.concept, 'the idea the image carries, not the scene');
  if (job.concept && words(job.concept) < 4) errors.push('concept: too short to carry an idea; write the metaphor in a sentence');
  if (job.concept && job.subject && job.concept.trim().toLowerCase() === job.subject.trim().toLowerCase()) errors.push('concept: repeats the subject; name what the image means, not what it shows');
  for (const k of ['shadows', 'highlights', 'accent']) {
    const v = job.palette?.[k];
    if (!v) errors.push(`palette.${k}: missing (hex from the page tokens)`);
    else if (!HEX.test(v)) errors.push(`palette.${k}: "${v}" is not a #rrggbb hex`);
  }
  if (!job.grade) errors.push(`grade: missing (${GRADES.join(' | ')})`);
  else if (!GRADES.includes(job.grade)) errors.push(`grade: "${job.grade}" is not one of ${GRADES.join(', ')}`);
  else if (job.grade === 'full-color' && !job.grade_reason) errors.push('grade_reason: full-color needs a reason; otherwise grade it to the page palette');
  need('light', job.light, 'one light source');
  need('light_reason', job.light_reason, 'why this light belongs to the brand');
  need('texture', job.texture, 'grain, halftone, torn paper, collage or none');
  need('texture_reason', job.texture_reason, 'why this texture, or why none');
  need('placement.slot', job.placement?.slot, 'where on the page');
  need('placement.field', job.placement?.field, 'which area stays empty for type or UI');
  if (!job.placement?.mode) errors.push(`placement.mode: missing (${MODES.join(' | ')})`);
  else if (!MODES.includes(job.placement.mode)) errors.push(`placement.mode: "${job.placement.mode}" is not one of ${MODES.join(', ')}`);
  need('prop', job.prop, 'the brand colour or mark inside the frame');
  const tells = stockTells([job.subject, job.concept].join(' '));
  if (tells.length) errors.push(`reads as a stock brief (${tells.join(', ')}): replace it with a moment and a concept`);
  return errors;
}

/** A free-text prompt given with --raw is allowed, but stock tells and missing direction are still reported. */
export function rawWarnings(prompt = '') {
  const out = stockTells(prompt).map(t => `stock tell: ${t}`);
  if (!DIRECTION.test(prompt)) out.push('no art direction (palette hex, grade, texture or an empty field for type)');
  return out;
}

const GRADE_TEXT = {
  monochrome: 'monochrome',
  duotone: 'duotone',
  'desaturated-one-accent': 'desaturated, with a single saturated accent',
  'full-color': 'full colour',
};
const MODE_TEXT = {
  cutout: 'Isolated on a transparent background: no backdrop, no floor, no shadow plate, clean edges.',
  tile: 'Composed to be cropped into a framed tile; keep the subject clear of the edges.',
  bleed: 'Full-bleed behind page content.',
};

const clean = s => String(s || '').trim().replace(/\.$/, '');
const reason = s => clean(s).replace(/^because\s+/i, '');
const NOTHING = /^(none|nothing|n\/a|-)?$/i;

export function composePrompt(raw) {
  const j = normalize(raw), p = j.palette, field = clean(j.placement.field);
  return [
    `${clean(j.subject)}.`,
    `Concept: ${clean(j.concept)}.`,
    `Grade: ${GRADE_TEXT[j.grade]}; shadows ${p.shadows}, highlights ${p.highlights}; the only saturated colour is ${p.accent}, carried by ${clean(j.prop)}.${j.grade_reason ? ` (${reason(j.grade_reason)})` : ''}`,
    `Light: ${clean(j.light)} (${reason(j.light_reason)}).`,
    clean(j.texture).toLowerCase() === 'none' ? `No added texture (${reason(j.texture_reason)}).` : `Texture: ${clean(j.texture)} (${reason(j.texture_reason)}).`,
    `Composition${j.ratio ? ` ${j.ratio}` : ''}: used as ${clean(j.placement.slot)}.${NOTHING.test(field) ? '' : ` Empty field for type or UI: ${field}.`} ${MODE_TEXT[j.placement.mode]}`,
    `Exclude: ${j.exclude || 'text, letters, logos, watermarks, extra fingers, HDR glow'}.`,
  ].join(' ');
}
