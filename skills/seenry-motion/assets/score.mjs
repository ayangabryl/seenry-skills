// Original deterministic score primitive. Input progress, never accumulated scroll deltas.
export function createScore(tracks) {
  if (!tracks || !Object.keys(tracks).length) throw new TypeError('Supply numeric tracks');
  const compiled = Object.entries(tracks).map(([name, frames]) => {
    if (!Array.isArray(frames) || frames.length < 2) throw new TypeError('Each track needs two keyframes');
    const copy = frames.map((frame, i) => {
      if (!Array.isArray(frame) || frame.length !== 2 || !frame.every(Number.isFinite) || frame[0] < 0 || frame[0] > 1 || (i && frame[0] <= frames[i-1][0])) throw new TypeError('Use strictly increasing progress in [0,1] with finite values');
      return [...frame];
    });
    if (copy[0][0] !== 0 || copy.at(-1)[0] !== 1) throw new TypeError('Tracks cover 0 to 1; duplicate values express holds');
    return [name, copy];
  });
  return progress => {
    if (!Number.isFinite(progress)) throw new TypeError('Finite progress required');
    const p = Math.max(0, Math.min(1, progress));
    return Object.fromEntries(compiled.map(([name, frames]) => {
      const end = frames.findIndex((f, i) => i && f[0] >= p);
      const [x0, y0] = frames[end-1], [x1, y1] = frames[end];
      return [name, y0 + (y1-y0) * (p-x0)/(x1-x0)];
    }));
  };
}
