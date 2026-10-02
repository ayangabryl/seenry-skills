/* Library controls. Demo timers belong to the gallery, never the kit. */
(() => {
 'use strict';
 const S = SeenryTransitions, $ = id => document.getElementById(id);
 const grid = $('library-grid'), cards = [...grid.children, ...$('extras-grid').children], replay = window.galleryReplay;
 const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
 const runs = new Map();
 const sequence = (key, steps) => {
  runs.get(key)?.forEach(clearTimeout);
  const timers = [];
  for (const [ms, fn] of steps) ms ? timers.push(setTimeout(fn, ms)) : fn();
  runs.set(key, timers);
 };
 let resized = false, badgeValue = 3, progressError = false;
 const doResize = () => {
  resized = !resized;
  S.resize($('resize-card'), () => {
   $('resize-content').hidden = !resized;
   $('resize-content').innerHTML = '<p>8 updates across the team.</p><p>Next review: Friday at 10:00.</p>';
   S.swapText($('resize-action'), resized ? 'Hide details' : 'Show details');
   $('resize-action').setAttribute('aria-expanded', String(resized));
  });
 };
 replay.resize = doResize;
 replay.badge = () => { const el = $('badge'); S.badge(el, Number(el.dataset.value) === 12 ? 3 : 12); };
 replay.icon = () => $('icon-swap').click();
 replay.success = () => {
  const el = $('success-check');
  if (el.dataset.stDone === 'true') { delete el.dataset.stDone; el.setAttribute('aria-label','Ready to complete'); sequence('success',[[70,()=>S.swapText(el.querySelector('[data-st-success-text]'),'Ready to save')],[260,()=>S.success(el)]]); } else S.success(el);
 };
 replay.avatars = () => { const g = $('avatar-group'), more = g.querySelector('[data-st-avatar-more]');
  if (more.getAttribute('aria-expanded') === 'true') { g.__stLift?.(-1); more.click(); return; }
  sequence('avatars', [[0, () => g.__stLift?.(0)], [110, () => g.__stLift?.(1)], [220, () => g.__stLift?.(2)], [400, () => g.__stLift?.(-1)], [520, () => more.click()]]); };
 replay.clear = () => {
  const input = $('clear-input');
  if (input.value) $('clear-field').querySelector('button').click();
  else { input.value = 'Mara Alves'; input.dispatchEvent(new Event('input', {bubbles:true})); input.focus({preventScroll:true}); }
 };
 replay.link = () => { const el = $('learn-link'); el.dataset.stHover = el.dataset.stHover !== 'true' ? 'true' : 'false'; };
 replay.reveal = () => S.reveal($('text-reveal'));
 replay.shimmer = () => S.shimmer($('shimmer-text'));
 replay.popover = () => S.toggle($('popover-panel'), $('popover-trigger'));
 S.progress($('progress'), 'idle');
 replay.progress = () => sequence('progress', [[0, () => { S.progress($('progress'), 'loading'); S.swapText($('progress-label'), 'Syncing changes'); }], [900, () => { progressError = !progressError; S.progress($('progress'), progressError ? 'success' : 'error'); S.swapText($('progress-label'), progressError ? 'All changes synced' : 'Connection lost. Try again.'); }]]);
 replay.image = () => S.image($('image-open'));
 replay.reorder = () => { const root = $('reorder-list'); S.list.reorder(root, [...root.children].reverse()); };
 replay.tilt = () => { const t = $('tilt-card'); sequence('tilt', [[0, () => S.tilt(t, -1, -1)], [90, () => S.tilt(t, 0, -1)], [180, () => S.tilt(t, 1, -.6)], [270, () => S.tilt(t, 1, .6)], [360, () => S.tilt(t, 0, 1)], [450, () => S.tilt(t, -1, .6)], [600, () => S.tilt(t)]]); };
 $('resize-action').onclick = doResize;
 $('success-action').onclick = replay.success;
 $('progress-action').onclick = replay.progress;
 document.querySelectorAll('[data-replay]').forEach(b => b.addEventListener('click', e => { if (!e.isTrusted) document.documentElement.dataset.stInputMode='pointer'; replay[b.dataset.replay]?.(); }));

 // Keep copy material independent of indicators, ghosts and animated digits.
 const snippets = new Map();
 for (const card of cards) {
  const stage = card.querySelector('.stage').cloneNode(true);
  stage.querySelectorAll('.replay,[data-st-ghost],.st-tab-indicator,.st-tab-ink,.st-resize-shell').forEach(n => n.remove());
  stage.querySelectorAll('[data-st-contained]').forEach(n => {
   n.removeAttribute('data-st-contained');
   n.removeAttribute('data-st-persistent');
   if (['modal','palette'].includes(n.dataset.st)) {
    const d = document.createElement('dialog'); [...n.attributes].forEach(a => d.setAttribute(a.name,a.value)); d.append(...n.childNodes); n.replaceWith(d);
   } else if (['menu','plus-menu','popover-panel'].includes(n.dataset.st)) n.setAttribute('popover','manual');
  });
  stage.querySelectorAll('svg use').forEach(use => {
   const symbol = document.querySelector(use.getAttribute('href'));
   if (symbol) { const svg=use.parentElement; svg.setAttribute('viewBox',symbol.getAttribute('viewBox')||'0 0 20 20'); use.outerHTML=symbol.innerHTML; }
  });
  stage.querySelectorAll('.app').forEach(n=>n.classList.add('st-surface'));
  snippets.set(card.dataset.key, '<!-- Preview markup, not a standalone component. Include the Seenry CSS/JS, reproduce the gallery-specific styles and assets, and wire application actions. -->\n' + stage.innerHTML.trim());
  const copy = card.querySelector('[data-snippet]'); copy.dataset.stCopy = snippets.get(card.dataset.key);
 }
 const api = {
  menu:"SeenryTransitions.toggle(menu, trigger)", morph:"SeenryTransitions.toggle(menu, trigger)", dialog:"SeenryTransitions.open(dialog, trigger)", palette:"SeenryTransitions.open(palette, trigger)", sheet:"SeenryTransitions.toggle(sheet, trigger)", drawer:"SeenryTransitions.toggle(drawer, trigger)", tooltip:"SeenryTransitions.tooltip.show(trigger)", expand:"SeenryTransitions.expand(card, detail)", tabs:"SeenryTransitions.tab(tabs, selectedTab)", segmented:"SeenryTransitions.tab(control, selectedTab)", page:"SeenryTransitions.page('forward', renderDetail, scope, {shared: ['sender']})", accordion:"SeenryTransitions.accordion(details, true)", button:"SeenryTransitions.state(button, 'success', 'Saved')", copy:"SeenryTransitions.copy(button, 'Text to copy')", like:"SeenryTransitions.like(button)", switch:"input.checked = !input.checked", checkbox:"input.checked = !input.checked", error:"SeenryTransitions.shake(form, 'Enter a valid email')", toast:"SeenryTransitions.toast(region, 'Changes saved')", number:"SeenryTransitions.number(readout, 125)", text:"SeenryTransitions.swapText(label, 'In review')", list:"SeenryTransitions.list.reorder(list, compare)", skeleton:"SeenryTransitions.skeleton(profile, true)", ai:"SeenryTransitions.swapText(status, 'Searching 4 entries…')\nSeenryTransitions.stream(answer, chunk, {done: true})", resize:"SeenryTransitions.resize(card, () => renderContent())", badge:"SeenryTransitions.badge(badge, 12)", icon:"SeenryTransitions.icon(button, true)", success:"SeenryTransitions.success(confirmation)", avatars:"SeenryTransitions.init(group) // hover, focus and names disclosure", clear:"SeenryTransitions.init(field) // text, caret and clear control", link:"SeenryTransitions.init(link) // hover and keyboard focus", reveal:"SeenryTransitions.reveal(section)", shimmer:"SeenryTransitions.shimmer(label) // one finite sweep", popover:"SeenryTransitions.toggle(panel, trigger)", progress:"SeenryTransitions.progress(indicator, 'loading')\nSeenryTransitions.progress(indicator, 'success') // or 'error'", image:"SeenryTransitions.image(thumbnail)\nSeenryTransitions.closeImage(thumbnail)", reorder:"SeenryTransitions.list.reorder(list, orderedNodes)", tilt:"SeenryTransitions.tilt(card, x, y) // normalized -1…1"
 };

 let category = 'All', filterVersion = 0, detailCard = null, stageHome = null;
 const search = $('library-search'), filterRoot = document.querySelector('.filter'), detail = $('library-detail');
 const filterList = filterRoot.querySelector('[role=tablist]'), filterScroll = filterRoot.parentElement;
 function updateFilterOverflow() {
  const lastTab = [...filterList.querySelectorAll('[role=tab]')].at(-1);
  filterScroll.dataset.more = String(!!lastTab && lastTab.getBoundingClientRect().right > filterList.getBoundingClientRect().right + .5);
 }
 function revealFilterTab(tab) {
  tab.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  updateFilterOverflow();
 }
 filterList.addEventListener('scroll', updateFilterOverflow, {passive:true});
 addEventListener('resize', updateFilterOverflow);
 if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateFilterOverflow).observe(filterList);
 requestAnimationFrame(updateFilterOverflow);
 const header = document.querySelector('.top');
 const sizeHeader = () => document.documentElement.style.setProperty('--gallery-header-height', header.getBoundingClientRect().height + 'px');
 if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sizeHeader).observe(header);
 sizeHeader();
 async function filter(animate = true) {
  const v = ++filterVersion, query = search.value.trim().toLowerCase();
  const wanted = cards.filter(c => (category === 'All' || c.dataset.category.split(' ').includes(category)) && (c.querySelector('.caption h3').textContent + ' ' + c.querySelector('.caption p').textContent).toLowerCase().includes(query));
  const entering = wanted.filter(c => c.hidden);
  const leaving = cards.filter(c => !c.hidden && !wanted.includes(c));
  if (animate && !reduce()) await Promise.all(leaving.map(c => S.play(c, [{opacity:0}], {ms:65,curve:'X',channel:'filter',fill:'forwards',fade:true})));
  if (v !== filterVersion) return;
  // The same kit FLIP used by list.reorder commits layout once, with no stagger.
  S.flip(cards.filter(c => !c.hidden && wanted.includes(c)), () => cards.forEach(c => { c.hidden = !wanted.includes(c); c.style.opacity = ''; }), {spring:'smooth'});
  for (const c of entering) if (animate) S.play(c,[{opacity:0},{opacity:1}],{ms:120,fade:true,channel:'filter',current:false});
  $('no-results').hidden = wanted.length > 0;
 }
 const setHash = hash => history.replaceState(null,'',location.pathname + location.search + hash);
 filterRoot.addEventListener('st:tab-change', e => { category = e.detail.tab.dataset.categoryChoice; revealFilterTab(e.detail.tab); filter(); if (!detailCard) setHash(category === 'All' ? '' : '#f/' + category.toLowerCase()); });
 search.addEventListener('input', () => filter());
 document.addEventListener('keydown', e => {
  if (e.key === '/' && !e.target.closest('input,textarea,[contenteditable]')) { e.preventDefault(); search.focus(); }
 });
 function showDetail(card) {
  if (detailCard === card) return;
  if (detailCard) restoreStage();
  detailCard = card; stageHome = card;
  const stage = card.querySelector('.stage');
  $('detail-title').textContent = card.querySelector('.caption h3').textContent;
  $('detail-description').textContent = card.querySelector('.caption p').textContent;
  $('detail-preview').replaceChildren(stage);
  $('detail-spec').innerHTML = card.querySelector('.spec').innerHTML;
  $('detail-codes').replaceChildren();
  for (const [label, code] of [['Preview HTML (not standalone)',snippets.get(card.dataset.key)],['JS API',api[card.dataset.key]],['Reduced motion','/* prefers-reduced-motion: reduce */\n// State and focus update immediately.\n// Travel, blur and looping decoration are removed.\n// Opacity handoffs are at most 100ms.']]) {
   const section = document.createElement('section'); section.className='detail-code';
   const h = document.createElement('h3'); h.textContent = label;
   const pre = document.createElement('pre'), content = document.createElement('code'); content.textContent=code; pre.append(content);
   const b = document.createElement('button'); b.className='st-button'; b.dataset.st='copy'; b.dataset.stCopy=code; b.innerHTML='<span data-st="text">Copy</span>'; b.setAttribute('aria-label','Copy '+label);
   section.append(h,pre,b); $('detail-codes').append(section);
  }
  detail.dataset.st = matchMedia('(max-width:650px)').matches ? 'sheet' : 'drawer';
  S.init(detail); S.open(detail,card.querySelector('.title-link'));
  setHash('#t/' + card.dataset.key);
 }
 function restoreStage() {
  const stage = $('detail-preview').querySelector('.stage'); if (stage && stageHome) stageHome.prepend(stage);
 }
 detail.addEventListener('st:close', e => { if (e.target !== detail) return; restoreStage(); const c = detailCard; detailCard=null; stageHome=null; c?.querySelector('.title-link').focus({preventScroll:true}); setHash(category === 'All' ? '' : '#f/'+category.toLowerCase()); });
 for (const card of cards) {
  card.querySelector('.title-link').onclick = () => showDetail(card);
  card.addEventListener('keydown', e => { if (e.target === card && e.key === 'Enter') { e.preventDefault(); showDetail(card); } });
 }
 function fromHash() {
  const [kind,value] = location.hash.slice(1).split('/');
  if (kind === 't') { const c=cards.find(c=>c.dataset.key===value); if(c) showDetail(c); }
  else if (kind === 'f') { const b=[...filterRoot.querySelectorAll('[data-category-choice]')].find(b=>b.dataset.categoryChoice.toLowerCase()===value); if(b) S.tab(filterRoot,b,true); }
 }
 addEventListener('hashchange',fromHash); fromHash();

 // One first-view preview. Finite sequences stop when their stage leaves view.
 const seen = new WeakSet();
 const previews = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
  const c=target.closest('.card'), key=c?.dataset.key;
  if (!key) return;
  target.dataset.stPaused=String(!isIntersecting);
  target.querySelectorAll('*').forEach(el => el.getAnimations().filter(a=>a.effect?.getTiming().iterations===Infinity).forEach(a=>isIntersecting&&!reduce()?a.play():a.pause()));
  if (!isIntersecting) {if(key==='shimmer')target.querySelector('.st-shine')?.getAnimations().forEach(a=>a.cancel());window.galleryCancel?.(key); runs.get(key)?.forEach(clearTimeout); runs.delete(key); return; }
  if (seen.has(target)) return; seen.add(target);
  // Merely entering the viewport is not an accepted UI state change. Keep functional
  // previews fully opaque so their text, focus and essential control cues retain contrast.
  // Dedicated reveal/shimmer examples still demonstrate their explicitly requested effect.
  if(key==='reveal') S.reveal($('text-reveal'));
  else if(key==='shimmer') S.shimmer($('shimmer-text'));
 }),{threshold:.55});
 cards.forEach(c=>previews.observe(c.querySelector('.stage')));
 window.galleryLibrary = {filter, showDetail, snippets, cards};
 // Blur option: one switch for the whole library, remembered per viewer.
 const blur = $('blur-toggle');
 if (blur) { blur.checked = document.documentElement.hasAttribute('data-st-blur'); blur.addEventListener('change', () => { S.blur(blur.checked); try { localStorage.setItem('st-gallery-blur', blur.checked ? 'on' : 'off'); } catch {} }); }
 // Phone: one category picker drives the same filter as the pills.
 const pick = $('cat-select');
 if (pick) {
  pick.addEventListener('change', () => { const b = [...filterRoot.querySelectorAll('[data-category-choice]')].find(x => x.dataset.categoryChoice === pick.value); if (b) S.tab(filterRoot, b); });
  filterRoot.addEventListener('st:tab-change', e => { pick.value = e.detail.tab.dataset.categoryChoice; });
 }
})();
