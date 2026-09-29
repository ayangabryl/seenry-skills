/* Seenry signature components. Classic script; load with defer. */
(function () {
  'use strict';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const observed = (nodes, callback, options = {}) => {
    if (!('IntersectionObserver' in window)) { nodes.forEach(node => callback(node, true)); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => callback(entry.target, entry.isIntersecting, entry)), options);
    nodes.forEach(node => io.observe(node));
    return io;
  };

  // Compact number adapter using the SeenryMotion.number(el, value, format) contract.
  const numberState = new WeakMap();
  function number(el, value, format = {}) {
    if (!el) return;
    const label = new Intl.NumberFormat(document.documentElement.lang || 'en', format).format(value);
    let state = numberState.get(el);
    if (!state) {
      el.textContent = '';
      const sr = document.createElement('span'); sr.className = 's-sr';
      const visible = document.createElement('span'); visible.className = 's-num-visible'; visible.setAttribute('aria-hidden', 'true');
      el.append(sr, visible);
      state = {sr, visible, label: ''}; numberState.set(el, state);
    }
    state.sr.textContent = label;
    if (state.label === label) return;
    const old = state.label; state.label = label;
    const shape = text => text.replace(/\d/g, '0');
    if (!old || shape(old) !== shape(label) || reduce()) {
      state.visible.replaceChildren(...[...label].map(char => makeDigit(char)));
      return;
    }
    [...label].forEach((char, index) => {
      if (!/\d/.test(char)) return;
      const cell = state.visible.children[index];
      if (cell && cell.dataset.digit !== char) {
        cell.dataset.digit = char;
        cell.firstChild.style.transform = `translateY(${-Number(char) * 1.1}em)`;
      }
    });
  }
  function makeDigit(char) {
    const node = document.createElement('span');
    if (!/\d/.test(char)) { node.textContent = char; return node; }
    node.className = 's-num-digit'; node.dataset.digit = char;
    const reel = document.createElement('span'); reel.className = 's-num-reel';
    for (let i = 0; i <= 9; i++) { const item = document.createElement('span'); item.textContent = i; reel.append(item); }
    reel.style.transform = `translateY(${-Number(char) * 1.1}em)`;
    node.append(reel); return node;
  }
  window.SeenryMotion = window.SeenryMotion || {};
  window.SeenryMotion.number = window.SeenryMotion.number || number;

  function initDemo(root) {
    const cursor = root.querySelector('.s-demo__cursor');
    const click = root.querySelector('.s-demo__click');
    const toggle = root.querySelector('[data-demo-toggle]');
    const steps = [...root.querySelectorAll('[data-demo-step]')].map(node => ({
      at: Math.max(0, Number(node.dataset.at) || 0), action: node.dataset.action,
      target: node.dataset.target, value: node.dataset.value || ''
    })).sort((a,b) => a.at - b.at);
    let timer, loop, active = false, visible = false, userPaused = false;
    const targetFor = step => root.querySelector(`[data-demo-target="${CSS.escape(step.target || '')}"]`);
    function moveTo(target) {
      if (!target || !cursor) return;
      const a = root.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x = b.left - a.left + b.width / 2, y = b.top - a.top + b.height / 2;
      root.style.setProperty('--s-x', `${x}px`); root.style.setProperty('--s-y', `${y}px`);
    }
    function apply(step) {
      const target = targetFor(step); if (!target) return;
      if (step.action === 'move') moveTo(target);
      if (step.action === 'click') {
        moveTo(target); click?.classList.remove('is-active'); void click?.offsetWidth; click?.classList.add('is-active');
        target.classList.add('is-target'); setTimeout(() => target.classList.remove('is-target'), 500);
        if (target instanceof HTMLButtonElement) target.click();
      }
      if (step.action === 'type') {
        if (reduce()) { target.value = step.value; target.dispatchEvent(new Event('input', {bubbles: true})); }
        else { target.value = ''; [...step.value].forEach((char, index) => timer.push(setTimeout(() => {
          if (!active) return; target.value += char; target.dispatchEvent(new Event('input', {bubbles: true}));
        }, index * 85))); }
      }
      if (step.action === 'open') { target.classList.add('is-open'); target.removeAttribute('inert'); }
      if (step.action === 'close') { target.classList.remove('is-open'); target.setAttribute('inert', ''); }
      if (step.action === 'value') target.textContent = step.value;
    }
    function stop(manual = false) {
      active = false; userPaused = manual || userPaused; clearTimeout(loop); timer?.forEach(clearTimeout); timer = [];
      root.dataset.playing = 'false';
      if (toggle) { toggle.textContent = manual ? 'Replay demo' : 'Play demo'; toggle.setAttribute('aria-pressed', 'false'); }
    }
    function play() {
      if (reduce() || !visible || active || userPaused || !steps.length) return;
      active = true; root.dataset.playing = 'true';
      if (toggle) { toggle.textContent = 'Pause demo'; toggle.setAttribute('aria-pressed', 'true'); }
      timer = [];
      root.querySelectorAll('[data-demo-panel]').forEach(el => { el.classList.remove('is-open'); el.setAttribute('inert',''); });
      steps.forEach(step => timer.push(setTimeout(() => active && apply(step), step.at)));
      loop = setTimeout(() => { stop(); if (visible && !root.matches(':hover, :focus-within')) play(); }, Math.max(...steps.map(x => x.at)) + 1900);
    }
    toggle?.addEventListener('click', () => { if (active) stop(true); else {
      userPaused = false;
      const bounds = root.getBoundingClientRect();
      visible = bounds.bottom > 0 && bounds.top < innerHeight;
      play();
    } });
    root.addEventListener('pointerenter', () => { if (fine() && active) stop(); });
    root.addEventListener('pointerleave', () => { if (!userPaused) play(); });
    root.addEventListener('focusin', event => { if (event.target !== toggle && active) stop(true); });
    root.addEventListener('pointerdown', event => { if (event.target !== toggle && active) stop(true); });
    observed([root], (_, on) => { visible = on; if (on && !root.matches(':hover, :focus-within')) play(); else if (!on) stop(); }, {threshold: .2});
    if (reduce()) { steps.forEach(step => { if (step.action !== 'move' && step.action !== 'click') apply(step); }); if (toggle) toggle.disabled = true; }
  }

  function drawSVG(svg, trigger = svg) {
    const strokes = [...svg.querySelectorAll('path, line, polyline, polygon')];
    strokes.forEach(line => {
      try { line.style.setProperty('--s-length', `${Math.ceil(line.getTotalLength()) + 2}px`); } catch (_) { /* display-only SVG */ }
    });
    if (reduce()) { trigger.classList.add('is-drawn'); return; }
    observed([trigger], (_, on) => { if (!on || trigger.classList.contains('is-drawn')) return;
      trigger.classList.add('is-drawn');
      strokes.forEach((line, index) => { const length = Number.parseFloat(line.style.getPropertyValue('--s-length')) || 100;
        line.animate([{strokeDasharray: length, strokeDashoffset: length}, {strokeDasharray: length, strokeDashoffset: 0}],
          {duration: 800, delay: Math.min(index * 35, 175), easing: 'cubic-bezier(.23,1,.32,1)'});
      });
    }, {threshold: .35});
  }

  function initAmbient(root) {
    const canvas = root.querySelector('canvas') || root.appendChild(document.createElement('canvas'));
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, frame = 0, visible = false, pointer = {x: -1000, y: -1000}, last = 0;
    const resize = () => { const b = root.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); w = b.width; h = b.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); paint(0); };
    function paint(time) {
      if (!w || !h) return;
      ctx.clearRect(0,0,w,h);
      const color = getComputedStyle(root).getPropertyValue('--line-strong').trim() || '#b8c0ca';
      const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#3659d9';
      const scroll = reduce() ? 0 : (window.scrollY % 30) * .08;
      for (let y = 18; y < h; y += 24) for (let x = 18; x < w; x += 24) {
        const distance = Math.hypot(x-pointer.x,y-pointer.y);
        const influence = reduce() ? 0 : Math.max(0,1-distance/115);
        const wave = reduce() ? 0 : Math.sin(time*.00035+x*.012+y*.016)*.7;
        const px = x + (x-pointer.x) / Math.max(distance,1) * influence * 3;
        const py = y + wave + scroll + (y-pointer.y) / Math.max(distance,1) * influence * 3;
        ctx.globalAlpha = .7 + influence*.25; ctx.fillStyle = influence > .25 ? accent : color;
        ctx.beginPath(); ctx.arc(px,py,1.2 + influence*.55,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function tick(time) { if (!visible || reduce()) return; if (time-last > 42) { paint(time); last = time; } frame = requestAnimationFrame(tick); }
    root.addEventListener('pointermove', e => { const b = root.getBoundingClientRect(); pointer = {x:e.clientX-b.left,y:e.clientY-b.top}; });
    root.addEventListener('pointerleave', () => { pointer = {x:-1000,y:-1000}; });
    window.addEventListener('scroll', () => { if (reduce() && visible) paint(0); }, {passive:true});
    new ResizeObserver(resize).observe(root); resize();
    observed([root], (_, on) => { visible = on; cancelAnimationFrame(frame); if (on) { paint(0); frame = requestAnimationFrame(tick); } }, {threshold: 0});
  }

  function initStory(root) {
    const steps = [...root.querySelectorAll('.s-story__step')];
    const visuals = [...root.querySelectorAll('.s-story__visual')];
    const progress = root.querySelector('.s-story__progress');
    if (progress && !progress.children.length) steps.forEach(() => progress.append(document.createElement('span')));
    let current = -1;
    function select(index) {
      if (index === current || index < 0) return; current = index;
      steps.forEach((node,i) => node.classList.toggle('is-current', i===index));
      visuals.forEach((node,i) => { node.classList.toggle('is-current', i===index); node.setAttribute('aria-hidden', i===index ? 'false' : 'true'); });
      [...(progress?.children || [])].forEach((node,i) => node.classList.toggle('is-current', i===index));
    }
    select(0);
    const update = () => { const midpoint = innerHeight * .52; let best = 0, distance = Infinity;
      steps.forEach((step,i) => { const b=step.getBoundingClientRect(), d=Math.abs((b.top+b.bottom)/2-midpoint); if (d<distance) { distance=d; best=i; } }); select(best); };
    let queued = false;
    const onScroll = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued=false; update(); }); };
    addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll); update();
  }

  function initValue(root) {
    const value = Number(root.dataset.value || 0), format = root.dataset.format ? JSON.parse(root.dataset.format) : {};
    const el = root.querySelector('.s-value__number') || root;
    if (reduce()) { window.SeenryMotion.number(el,value,format); return; }
    observed([root], (_, on) => { if (!on || root.dataset.counted) return; root.dataset.counted='true';
      const start=performance.now(), duration=850;
      const tick = now => { const p=Math.min(1,(now-start)/duration), eased=1-Math.pow(1-p,3);
        window.SeenryMotion.number(el, Math.round(value*eased), format);
        if (p<1) requestAnimationFrame(tick);
      }; requestAnimationFrame(tick);
    }, {threshold:.45});
  }
  function initTicker(root) {
    const el = root.querySelector('.s-value__number') || root;
    const values = (root.dataset.values || '').split(',').map(Number).filter(Number.isFinite);
    const format = root.dataset.format ? JSON.parse(root.dataset.format) : {};
    if (!values.length) return;
    let index=0, interval, visible=false;
    window.SeenryMotion.number(el,values[0],format);
    const start=() => { if (interval || reduce() || !visible) return; interval=setInterval(() => { index=(index+1)%values.length; window.SeenryMotion.number(el,values[index],format); }, Math.max(1800,Number(root.dataset.interval)||3600)); };
    observed([root], (_, on) => { visible=on; if (on) start(); else { clearInterval(interval); interval=null; } }, {threshold:.2});
    root.addEventListener('mouseenter', () => { clearInterval(interval); interval=null; });
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', () => { clearInterval(interval); interval=null; });
    root.addEventListener('focusout', start);
  }

  function initMarquee(root) {
    const track=root.querySelector('.s-marquee__track'), group=track?.querySelector('.s-marquee__group');
    if (!track || !group) return;
    if (track.children.length===1) { const copy=group.cloneNode(true); copy.setAttribute('aria-hidden','true'); copy.querySelectorAll('[tabindex],a,button').forEach(el=>el.setAttribute('tabindex','-1')); track.append(copy); }
    if (reduce()) return;
    const refresh=()=>{ const px=group.getBoundingClientRect().width; root.style.setProperty('--s-marquee-duration',`${Math.max(24,px/38)}s`); };
    new ResizeObserver(refresh).observe(group); refresh();
  }
  function initCompare(root) {
    const input=root.querySelector('input[type="range"]'); if (!input) return;
    const update=()=>root.style.setProperty('--s-position',`${Math.max(0,Math.min(100,Number(input.value)))}%`);
    input.addEventListener('input',update); update();
  }
  function initCase(root) {
    const frames=[...root.querySelectorAll('.s-case__frame')]; if (!frames.length) return;
    let index=0, timer;
    const show=i=>{ index=i; frames.forEach((frame,n)=>{ frame.classList.toggle('is-current',n===i); frame.setAttribute('aria-hidden',n===i?'false':'true'); }); };
    show(0);
    const start=()=>{ if (reduce() || !fine() || timer) return; timer=setInterval(()=>show((index+1)%frames.length),1100); };
    const stop=()=>{ clearInterval(timer); timer=null; show(0); };
    root.addEventListener('mouseenter',start); root.addEventListener('mouseleave',stop);
    root.addEventListener('focusin',start); root.addEventListener('focusout',event=>{ if (!root.contains(event.relatedTarget)) stop(); });
  }
  function init(root=document) {
    root.querySelectorAll('.s-demo').forEach(initDemo);
    root.querySelectorAll('.s-draw svg').forEach(svg=>drawSVG(svg,svg.closest('.s-draw')));
    root.querySelectorAll('.s-ambient').forEach(initAmbient);
    root.querySelectorAll('.s-story').forEach(initStory);
    root.querySelectorAll('.s-count').forEach(initValue);
    root.querySelectorAll('.s-ticker').forEach(initTicker);
    root.querySelectorAll('.s-marquee').forEach(initMarquee);
    root.querySelectorAll('.s-compare').forEach(initCompare);
    root.querySelectorAll('.s-case').forEach(initCase);
  }
  window.SeenrySignature={init,drawSVG,number};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>init(),{once:true}); else init();
})();
