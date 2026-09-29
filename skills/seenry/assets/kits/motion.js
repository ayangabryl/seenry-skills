/* Seenry motion kit: dependency-free, works from file:// and any bundler (classic script, exposes window.SeenryMotion).
 * Include with <script src="assets/motion.js" defer></script> next to motion.css.
 *
 *   SeenryMotion.number(el, 29, {style: 'currency', currency: 'EUR'})  rolls each digit to the new value
 *   SeenryMotion.swap(() => renderList())                                cross-fades a DOM update (filters, tabs, sorting)
 *   SeenryMotion.pop(badgeEl)                                            a short scale pop for counts and badges
 *   SeenryMotion.toast('Added to bag')                                   polite toast that enters, waits, leaves
 *
 * Why: values that change in place (prices, totals, counts) are the most common state change on a page; a roll shows
 * which way and by how much it changed, and keeps width stable with tabular figures. Everything respects reduced motion,
 * and the real value is always in the accessible text, never only in the animated digits. */
(function () {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const css = `
.sm-num{display:inline-flex;font-variant-numeric:tabular-nums;white-space:nowrap}
.sm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.sm-digit{display:inline-block;height:1.15em;line-height:1.15em;overflow:hidden;vertical-align:bottom}
.sm-reel{display:flex;flex-direction:column;transition:transform 520ms ${ease}}
.sm-reel span{height:1.15em}
.sm-toast{position:fixed;left:50%;bottom:24px;translate:-50% 0;z-index:1000;padding:10px 16px;border-radius:10px;background:#1c1c1a;color:#fff;font-family:inherit;font-size:14px;font-weight:500;line-height:20px;box-shadow:0 8px 24px rgb(0 0 0/.16);transition:opacity 200ms ease,transform 200ms ${ease}}
.sm-toast[data-state=hidden]{opacity:0;transform:translateY(8px)}
@media (prefers-reduced-motion: reduce){.sm-reel{transition:none}.sm-toast{transition:none}}`;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);

  const state = new WeakMap();
  function number(el, value, format = {}, locales = document.documentElement.lang || 'en') {
    const text = new Intl.NumberFormat(locales, format).format(value);
    let s = state.get(el);
    if (!s) {
      el.textContent = '';
      const sr = document.createElement('span'); sr.className = 'sm-sr';
      const vis = document.createElement('span'); vis.className = 'sm-num'; vis.setAttribute('aria-hidden', 'true');
      el.append(sr, vis); s = {sr, vis, text: ''}; state.set(el, s);
    }
    s.sr.textContent = text;
    if (s.text === text) return;
    const old = s.text; s.text = text;
    const up = parseFloat(old.replace(/[^\d.-]/g, '')) <= value;
    const cells = [...s.vis.children];
    // Rebuild when the shape changes (more digits, different separators); otherwise roll in place.
    const shape = t => t.replace(/\d/g, '0');
    if (!old || shape(old) !== shape(text) || reduce()) {
      s.vis.textContent = '';
      for (const ch of text) s.vis.append(/\d/.test(ch) ? digit(+ch) : glyph(ch));
      if (old && !reduce()) s.vis.animate([{opacity: 0.4, transform: `translateY(${up ? 6 : -6}px)`}, {opacity: 1, transform: 'none'}], {duration: 320, easing: ease});
      return;
    }
    [...text].forEach((ch, i) => { if (/\d/.test(ch)) roll(cells[i], +ch); });
  }
  function glyph(ch) { const g = document.createElement('span'); g.textContent = ch; return g; }
  function digit(n) {
    const d = document.createElement('span'); d.className = 'sm-digit';
    const reel = document.createElement('span'); reel.className = 'sm-reel';
    for (let i = 0; i < 10; i++) { const c = document.createElement('span'); c.textContent = i; reel.append(c); }
    reel.style.transform = `translateY(${-n * 1.15}em)`; d.append(reel); d.dataset.n = n; return d;
  }
  function roll(cell, n) {
    if (!cell || +cell.dataset.n === n) return;
    cell.dataset.n = n; cell.firstChild.style.transform = `translateY(${-n * 1.15}em)`;
  }

  function swap(update) {
    if (reduce() || !document.startViewTransition) { update(); return Promise.resolve(); }
    return document.startViewTransition(update).finished.catch(() => {});
  }

  function pop(el) {
    if (reduce() || !el) return;
    el.animate([{transform: 'scale(1)'}, {transform: 'scale(1.18)'}, {transform: 'scale(1)'}], {duration: 320, easing: ease});
  }

  let live, timer;
  function toast(message, ms = 2400) {
    if (!live) { live = document.createElement('div'); live.className = 'sm-toast'; live.setAttribute('role', 'status'); live.dataset.state = 'hidden'; document.body.append(live); }
    live.textContent = message; requestAnimationFrame(() => { live.dataset.state = 'shown'; });
    clearTimeout(timer); timer = setTimeout(() => { live.dataset.state = 'hidden'; }, ms);
  }

  window.SeenryMotion = {number, swap, pop, toast};
})();
