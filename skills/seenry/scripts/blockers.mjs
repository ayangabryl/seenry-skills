/** The final check's short answer: every blocker gets a rank, and only the few that decide the page are printed.
 *
 *  Rank 0  the study is missing (brief, references, approval, stack): nothing else matters until it exists
 *  Rank 1  the page is below the references' level (the idea stops, thin product, copied words)
 *  Rank 2  craft a person sees at once (clipped text, contrast, images)
 *  Rank 3  the rest of the board and the token lint
 *  Rank 4  motion details
 *  Ties keep the order they were found in. */

export const SHORT_LIMIT = 5;

export function rankBlockers(items = []) {
  return items
    .map((item, order) => ({rank: Number.isFinite(item.rank) ? item.rank : 3, text: String(item.text || '').trim(), fix: String(item.fix || '').trim(), order}))
    .filter(item => item.text)
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map(({rank, text, fix}) => fix ? {rank, text, fix} : {rank, text});
}

/** The lines to print: at most `limit` blockers, each one line, and where the full list is. */
export function shortBlockers(items, {total, limit = SHORT_LIMIT, full = ''} = {}) {
  const ranked = rankBlockers(items), count = Math.max(total || 0, ranked.length);
  if (!count) return [];
  const shown = ranked.slice(0, limit), line = s => s.split('\n')[0];
  const out = [`\n■ ${count} blocker(s)${shown.length < count ? `; the first ${shown.length}, most important first` : ', most important first'}:`];
  shown.forEach((item, i) => { out.push(`  ${i + 1}. ${line(item.text)}`); if (item.fix) out.push(`     ${line(item.fix)}`); });
  if (shown.length < count) out.push(`  The full list${full ? ` is in ${full}, or` : ':'} run check.mjs again with --all.`);
  return out;
}
