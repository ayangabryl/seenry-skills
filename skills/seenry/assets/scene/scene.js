/* Seenry scene: scroll choreography without a library. Include scene.css and this file (defer).
 * [data-scene]        a tall section (height: --scene-length, default 220vh); exposes --p (0..1) as it scrolls past
 * [data-scene-stage]  its sticky, screen-high stage
 * [data-beats="..."]  on a scene: comma-separated progress points; sets data-beat="0..n" for discrete swaps
 * [data-track]        inside a stage: a horizontal row; exposes --track-overflow (px it must travel)
 * [data-enter]        reveals once when it enters (adds .is-in); --i staggers siblings
 * [data-draw]         an svg whose paths/lines draw with --draw (defaults to the scene's --p, or 1 after entering)
 * [data-count="1892"] counts to its value with the scene's progress (or once on entering)
 * Reduced motion and no JS: everything rests in its final state and scenes close up to natural height. */
(() => {
  const html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const fmt = (el, v) => { const n = +el.dataset.count, d = (String(el.dataset.count).split('.')[1] || '').length; el.textContent = (n * v).toLocaleString(el.dataset.locale || undefined, {minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: n >= 10000}); };
  document.querySelectorAll('[data-draw] path, [data-draw] line, [data-draw] polyline, [data-draw] circle, [data-draw] rect, [data-draw] ellipse, [data-draw] polygon').forEach(p => p.setAttribute('pathLength', '1'));
  let raf = 0;
  const measure = () => {
    raf = 0;
    for (const s of scenes) {
      const r = s.getBoundingClientRect(), travel = Math.max(1, r.height - innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / travel));
      s.style.setProperty('--p', p.toFixed(4));
      if (s.dataset.beats) { const beats = s.dataset.beats.split(',').map(Number); s.dataset.beat = beats.filter(b => p >= b).length; }
      s.querySelectorAll('[data-count]').forEach(el => fmt(el, p));
      s.querySelectorAll('[data-track]').forEach(t => t.style.setProperty('--track-overflow', `${Math.max(0, t.scrollWidth - t.parentElement.clientWidth)}px`));
    }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in'); io.unobserve(e.target);
    if (e.target.matches('[data-count]') && !e.target.closest('[data-scene]')) { const t0 = performance.now(), dur = 1200; const f = now => { const k = Math.min(1, (now - t0) / dur); fmt(e.target, 1 - Math.pow(1 - k, 4)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
  }), {rootMargin: '0px 0px -12% 0px'});
  const start = () => {
    if (reduce.matches) { html.dataset.motion = 'reduce'; scenes.forEach(s => s.style.setProperty('--p', 1)); document.querySelectorAll('[data-count]').forEach(el => fmt(el, 1)); return; }
    html.dataset.motion = 'full';
    document.querySelectorAll('[data-enter], [data-draw]:not([data-scene] [data-draw]), [data-count]:not([data-scene] [data-count])').forEach(el => io.observe(el));
    document.querySelectorAll('[data-count]:not([data-scene] [data-count])').forEach(el => fmt(el, 0));
    addEventListener('scroll', onScroll, {passive: true}); addEventListener('resize', onScroll); measure();
  };
  reduce.addEventListener?.('change', () => location.reload());
  start();
})();
