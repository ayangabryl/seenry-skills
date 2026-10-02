// The web motion judge's declared response schema is also its runtime contract.
// Native/video legacy results use their existing separate schema and zero-exit route.
export const MOTION_SCORE_KEYS = ['origin', 'attachment', 'choreography', 'character', 'exit', 'continuity', 'interruption', 'states', 'reduced_motion', 'overall'];
const scoreSchema = {type: 'integer', minimum: 1, maximum: 10};
export const MOTION_VERDICT_SCHEMA = {type: 'object', additionalProperties: false, required: ['scores', 'rows', 'verdict', 'fixes'], properties: {
  scores: {type: 'object', additionalProperties: false, required: MOTION_SCORE_KEYS, properties: Object.fromEntries(MOTION_SCORE_KEYS.map(k => [k, scoreSchema]))},
  rows: {type: 'array', items: {type: 'object', additionalProperties: false, required: ['interaction', 'score', 'note'], properties: {interaction: {type: 'string'}, score: scoreSchema, note: {type: 'string'}}}},
  verdict: {type: 'string'},
  fixes: {type: 'array', minItems: 1, maxItems: 10, items: {type: 'object', additionalProperties: false, required: ['interaction', 'problem', 'fix'], properties: {interaction: {type: 'string'}, problem: {type: 'string'}, fix: {type: 'string'}}}}
}};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// Only the keywords used in the declared schema above are needed; do not silently
// equate JSON.parse() success with a completed judgment.
function matches(value, schema) {
  if (schema.type === 'object') return object(value)
    && schema.required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => Object.hasOwn(schema.properties, key) && matches(value[key], schema.properties[key]));
  if (schema.type === 'array') return Array.isArray(value)
    && value.length >= (schema.minItems ?? 0) && value.length <= (schema.maxItems ?? Infinity)
    && value.every(item => matches(item, schema.items));
  if (schema.type === 'integer') return Number.isInteger(value) && value >= schema.minimum && value <= schema.maximum;
  if (schema.type === 'string') return typeof value === 'string';
  return false;
}
export function validMotionVerdict(value, {annotated = false} = {}) {
  if (!object(value)) return false;
  if (!annotated) return matches(value, MOTION_VERDICT_SCHEMA);
  // These fields are added by the judge, never part of the model's response schema.
  const {cli, runs, stillOpen, ...judgment} = value;
  if (Object.hasOwn(value, 'cli') && typeof cli !== 'string') return false;
  if (Object.hasOwn(value, 'runs') && (!Array.isArray(runs) || !runs.length || !runs.every(n => matches(n, scoreSchema)))) return false;
  if (Object.hasOwn(value, 'stillOpen') && (!object(stillOpen)
    || Object.keys(stillOpen).length !== 2 || !Array.isArray(stillOpen.criteria) || !Array.isArray(stillOpen.interactions)
    || !stillOpen.criteria.every(key => key !== 'overall' && MOTION_SCORE_KEYS.includes(key))
    || !stillOpen.interactions.every(name => typeof name === 'string'))) return false;
  return matches(judgment, MOTION_VERDICT_SCHEMA);
}
