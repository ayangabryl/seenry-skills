import React, { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Copy, Minus, Plus, X } from "lucide-react";
import { createNumberTransition } from "../../skills/seenry-motion/assets/number-transition.mjs";
import { copyText } from "./copy";
import "./reading-site.css";
import "./home.css";

const repository = "https://github.com/ayangabryl/seenry-skills";
const command = "npx skills add ayangabryl/seenry-skills";
const enter = [0.16, 1, 0.3, 1];
const indicator = { duration: 0.18, ease: enter };
const shown = "inset(0% 0% 0% 0%)";
const hidden = (dir) => (dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)");
const livePath = (slug) => `/live/${slug}/index.html`;
const preload = (preview) => Object.values(preview).forEach((src) => (new Image().src = src));

const pairs = [
  {
    id: "bakery",
    label: "Bakery",
    prompt: "make a website for my neighborhood bakery",
    change: "Without a skill: a centred cream and terracotta template with a line any bakery could use. With Seenry: when the sourdough comes out, and what is still on the shelf right now.",
    beforeAlt: "Without a skill: Corner Crumb Bakery, “Warm bread, made around the corner.” centred on cream with a small uppercase label and a terracotta button.",
    afterAlt: "With Seenry: Alder Street Bakery, “Sourdough out at 6:30. Gone by noon.” on yellow beside a photograph of a loaf above the morning’s bake times.",
  },
  {
    id: "photographer",
    label: "Photographer",
    prompt: "i'm a wedding photographer, need a portfolio site",
    change: "Without a skill: “Your Name” over a grey gradient where the photograph should be. With Seenry: a named photographer, the hours she covers and a photograph of the day.",
    beforeAlt: "Without a skill: a site titled “Your Name” with “Honest, quiet photographs of the day you actually had.” over a grey gradient and no photograph.",
    afterAlt: "With Seenry: Isla Navarro, “From 7:40 a.m. to the last song.” on deep wine red beside a photograph of a couple on old stone steps.",
  },
  {
    id: "habit",
    label: "Habit tracker",
    prompt: "make a landing page for my habit tracker app, make it look good",
    change: "Without a skill: an italic orange accent word, a pill badge and floating cards. With Seenry: one idea, weeks instead of streaks, shown in the app screen beside it.",
    beforeAlt: "Without a skill: Habitual, “Tiny habits. Big streaks.” with an italic orange accent word, a pill badge and floating cards around a phone.",
    afterAlt: "With Seenry: Kept, “Miss Tuesday. Still on track.” on yellow beside the app’s week view, where a missed day still counts as on track.",
  },
];

const skills = [
  ["seenry", "Pages, sites and components. It studies real references, explores three directions, builds one and reviews it blind before it stops. The pages above."],
  ["seenry-motion", "Decides whether something should move at all, then the curve, duration, interruption and reduced-motion behaviour, with tested recipes you can run."],
  ["seenry-review", "Ranked, fixable findings for a live screen, a branch or pull request, or one component pushed through every state and size."],
  ["seenry-assets", "Licence-clear photos, icons and fonts, or generated images, with a manifest of every file’s source, licence and prompt."],
  ["seenry-branding", "Researches identity systems and writes a BRAND.md with the colour, type, imagery and naming rules later agents follow."],
  ["seenry-apps", "Native-feeling mobile screens and flows in SwiftUI, UIKit, React Native, Expo or Flutter, held to a strict platform grid."],
  ["seenry-decks", "Plans a presentation as a sequence, from real decks in the Seenry library, before it designs a slide."],
  ["seenry-video", "Product films as code: story, shot list, voiceover and sound, rendered frame by frame from real captures."],
];

const faq = [
  ["What are agent skills?", "Instructions, scripts and assets your coding agent loads when a task needs them. You keep prompting as you do now; the agent picks the right skill from what you ask, or you name one."],
  ["How do I install them?", `Run ${command} in your project, then ask for a page, a redesign or a review as usual.`],
  ["Which agents do they work with?", "Claude Code, Codex and Cursor, and other agents that read the open skills format."],
  ["Do I need Seenry MCP?", "No. Without it the skills use their built-in references and ordinary browsing. With a Seenry Pro key your agent can also study 100,000+ captured app screens, nearly 2,000 measured websites and recordings of real interactions."],
  ["Why does it take longer?", "It researches references, explores three directions and reviews its own page before it stops, so a new site takes a few more minutes than without it."],
  ["Were the pages edited?", "No. Both versions of every page are served exactly as the agent left them. Any photographs in them were generated by the agents."],
  ["Are these real businesses?", "No. They came from one-line prompts, and none of them exists."],
];

function Toggle({ items, value, onChange, label }) {
  const id = useId();
  return (
    <div className="h-toggle" role="group" aria-label={label}>
      {items.map((item) => (
        <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => value !== item.id && onChange(item.id)}>
          {value === item.id && <motion.span layoutId={id} className="h-toggle-pill" transition={indicator} />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function Tabs({ items, value, onChange, label }) {
  const id = useId();
  return (
    <div className="h-tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => value !== item.id && onChange(item.id)}>
          <span>{item.label}</span>
          {value === item.id && <motion.span layoutId={id} className="h-tabs-line" transition={indicator} />}
        </button>
      ))}
    </div>
  );
}

function Command() {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const code = useRef();
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    const ok = await copyText(command, code.current);
    setState(ok ? "copied" : "failed");
    setMessage(ok ? "Command copied" : "Clipboard unavailable. The command is selected; copy it with your keyboard.");
    clearTimeout(timer.current);
    if (ok) timer.current = setTimeout(() => setState("idle"), 1800);
  }
  return (
    <div className="h-command">
      <code ref={code}>
        <span>npx</span> skills add ayangabryl/seenry-skills
      </code>
      <button type="button" onClick={copy} aria-label={state === "copied" ? "Copied" : "Copy install command"}>
        <span className="h-copy" data-state={state} aria-hidden="true">
          <span className="h-copy-idle">
            <Copy size={15} /> Copy
          </span>
          <span className="h-copy-done">
            <Check size={15} /> {state === "failed" ? "Selected" : "Copied"}
          </span>
        </span>
      </button>
      <span className="r-sr" role="status">
        {message}
      </span>
    </div>
  );
}

function Wipe({ id, dir, children }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence initial={false} custom={dir}>
      <motion.div
        key={id}
        className="h-wipe"
        custom={dir}
        variants={{ enter: (d) => ({ clipPath: hidden(d) }), show: { clipPath: shown }, leave: { opacity: 1 } }}
        initial="enter"
        animate="show"
        exit="leave"
        transition={{ duration: reduced ? 0 : 0.36, ease: enter }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Scroller({ src, alt }) {
  const frame = useRef();
  const page = useRef();
  // top, moving, end or returning; the page stays parked at the end until the pointer leaves.
  const status = useRef("top");
  function hold() {
    const el = page.current;
    const y = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
    el.style.transition = "none";
    el.style.transform = `translateY(${y}px)`;
    el.getBoundingClientRect();
    return y;
  }
  function travel() {
    if (status.current === "moving" || status.current === "end") return;
    const end = frame.current.clientHeight - page.current.offsetHeight;
    if (end >= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const y = hold();
    page.current.style.transition = `transform ${Math.max(0.6, (y - end) / 420)}s cubic-bezier(.25,.15,.75,.85)`;
    page.current.style.transform = `translateY(${end}px)`;
    status.current = "moving";
  }
  function settle() {
    if (status.current === "top" || status.current === "returning") return;
    hold();
    page.current.style.transition = "transform 600ms cubic-bezier(.16,1,.3,1)";
    page.current.style.transform = "translateY(0px)";
    status.current = "returning";
  }
  function arrived(event) {
    if (event.target !== page.current) return;
    if (status.current === "moving") status.current = "end";
    else if (status.current === "returning") status.current = "top";
  }
  return (
    <div
      ref={frame}
      className="h-scroll"
      onPointerEnter={(event) => event.pointerType === "mouse" && travel()}
      onPointerLeave={(event) => event.pointerType === "mouse" && settle()}
      onClick={() => matchMedia("(hover: none)").matches && (status.current === "moving" || status.current === "end" ? settle() : travel())}
    >
      <img ref={page} src={src} alt={alt} width="1100" onTransitionEnd={arrived} />
    </div>
  );
}

function Typed({ text }) {
  const [shown, setShown] = useState(text);
  const current = useRef(text);
  useEffect(() => {
    const from = current.current;
    current.current = text;
    if (from === text) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(text);
    let same = 0;
    while (same < from.length && from[same] === text[same]) same++;
    const steps = [];
    for (let i = from.length; i >= same; i--) steps.push(from.slice(0, i));
    for (let i = same + 1; i <= text.length; i++) steps.push(text.slice(0, i));
    const per = Math.min(16, 640 / steps.length);
    const start = performance.now();
    const timer = setInterval(() => {
      const i = Math.min(steps.length - 1, Math.floor((performance.now() - start) / per));
      setShown(steps[i]);
      if (i === steps.length - 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <>
      <span className="h-typed-sizer" aria-hidden="true">
        {pairs.reduce((a, p) => (p.prompt.length > a.length ? p.prompt : a), "")}
      </span>
      <span className="h-typed" aria-hidden="true">
        {shown}
        <i className="h-caret" />
      </span>
    </>
  );
}

function Hero({ onOpen }) {
  const [pairId, setPairId] = useState("bakery");
  const dir = useRef(1);
  const pair = pairs.find((p) => p.id === pairId);
  const index = (id) => pairs.findIndex((p) => p.id === id);
  function choose(next) {
    dir.current = index(next) > index(pairId) ? 1 : -1;
    setPairId(next);
  }
  const sides = [
    { key: "before", label: "No skill", live: `${pair.id}-without`, alt: pair.beforeAlt },
    { key: "after", label: "With Seenry", live: `${pair.id}-with`, alt: pair.afterAlt },
  ].map((side) => ({ ...side, preview: { desktop: `/work/${pair.id}-${side.key}.webp`, phone: `/work/${pair.id}-${side.key}-390.webp` } }));
  return (
    <section className="h-hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="h-hero-title" aria-label={pair.prompt}>
        <Typed text={pair.prompt} />
      </h1>
      <p className="h-hero-sub">
        Teach your coding agent good design. This sentence went to Claude Sonnet 5.5 twice: once on its own, once with
        the Seenry skills installed.
      </p>
      <Command />
      <p className="h-hero-meta">For Claude Code, Codex and Cursor. Open source, Apache 2.0.</p>
      <div className="h-same">
        <div className="h-same-top">
          <p>
            Same prompt · Claude Sonnet 5.5 · Seenry skill only, no MCP.{" "}
            <span className="h-hint-mouse">Hover a page to scroll it.</span>
            <span className="h-hint-touch">Tap a page to scroll it.</span>
          </p>
          <Tabs label="Prompt" value={pairId} onChange={choose} items={pairs} />
        </div>
        <div className="h-compare">
          {sides.map((s) => (
            <figure key={s.key} className={`h-compare-${s.key}`}>
              <figcaption>
                <span>{s.label}</span>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Open the live page, ${s.label}`}
                  onPointerEnter={() => preload(s.preview)}
                  onFocus={() => preload(s.preview)}
                  onClick={(event) =>
                    onOpen({
                      slug: s.live,
                      name: `${pair.label}, ${s.key === "before" ? "no skill" : "with Seenry"}`,
                      prompt: pair.prompt,
                      model: "Claude Sonnet 5.5",
                      preview: s.preview,
                      rect: event.currentTarget.closest("figure").querySelector(".h-crop").getBoundingClientRect(),
                    })
                  }
                >
                  Open live <ArrowUpRight size={14} aria-hidden="true" />
                </button>
              </figcaption>
              <div className="h-crop">
                <Wipe id={pair.id} dir={dir.current}>
                  <Scroller src={`/work/${pair.id}-${s.key}-page.webp`} alt={s.alt} />
                </Wipe>
              </div>
            </figure>
          ))}
        </div>
        <p className="h-same-note">{pair.change}</p>
      </div>
    </section>
  );
}

const devices = [
  { id: "desktop", label: "Desktop" },
  { id: "phone", label: "Phone" },
];

function clipFrom(from, to) {
  const t = Math.round(from.top - to.top);
  const r = Math.round(to.right - from.right);
  const b = Math.round(to.bottom - from.bottom);
  const l = Math.round(from.left - to.left);
  return `inset(${t}px ${r}px ${b}px ${l}px round 12px)`;
}

const opened = "inset(0px 0px 0px 0px round 20px)";

function Viewer({ open, onClose }) {
  const dialog = useRef();
  const flight = useRef(null);
  const [device, setDevice] = useState("desktop");
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const d = dialog.current;
    if (!d || !open) return;
    setMounted(false);
    setLoaded(false);
    setDevice(matchMedia("(max-width: 760px)").matches ? "phone" : open.device || "desktop");
    if (!d.open) d.showModal();
    if (still()) return setMounted(true);
    const source = open.rect ? clipFrom(open.rect, d.getBoundingClientRect()) : "inset(2% 2% 2% 2% round 20px)";
    const shell = d.animate([{ clipPath: source }, { clipPath: opened }], { duration: 340, easing: "cubic-bezier(.16,1,.3,1)" });
    const veil = d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out", pseudoElement: "::backdrop" });
    flight.current = { shell, veil, source, closing: false };
    shell.onfinish = () => setMounted(true);
  }, [open]);
  function close() {
    const d = dialog.current;
    const f = flight.current;
    if (!d?.open) return;
    if (still() || !f) return d.close();
    if (f.closing) return;
    f.closing = true;
    // Leave from wherever the opening got to, so an early close never jumps.
    const style = getComputedStyle(d);
    const from = f.shell.playState === "running" ? style.clipPath : opened;
    const dim = f.veil.playState === "running" ? Number(getComputedStyle(d, "::backdrop").opacity) : 1;
    f.shell.cancel();
    f.veil.cancel();
    const timing = { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" };
    const shell = d.animate([{ clipPath: from }, { clipPath: f.source }], timing);
    const veil = d.animate([{ opacity: dim }, { opacity: 0 }], { ...timing, pseudoElement: "::backdrop" });
    shell.onfinish = () => {
      d.close();
      shell.cancel();
      veil.cancel();
      flight.current = null;
    };
  }
  return (
    <dialog
      ref={dialog}
      className="h-viewer"
      aria-labelledby="viewer-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        close();
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => event.target === dialog.current && close()}
    >
      {open && (
        <div className="h-viewer-inner">
          <div className="h-viewer-bar">
            <div className="h-viewer-title">
              <h2 id="viewer-title">{open.name}</h2>
              <span>{open.model} · unedited</span>
            </div>
            <div className="h-viewer-tools">
              <span className="h-viewer-devices">
                <Toggle label="Width" value={device} onChange={setDevice} items={devices} />
              </span>
              <a href={livePath(open.slug)} target="_blank" rel="noopener">
                New tab <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <button type="button" className="h-viewer-close" onClick={close} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="h-viewer-prompt">
            <span aria-hidden="true">&gt;</span> {open.prompt}
          </p>
          <div className="h-viewer-frame" data-device={device} data-loaded={loaded}>
            <img className="h-viewer-preview" src={open.preview[device]} alt="" />
            {mounted && <iframe key={open.slug} src={livePath(open.slug)} title={`${open.name}, the live site`} onLoad={() => setLoaded(true)} />}
          </div>
        </div>
      )}
    </dialog>
  );
}

function MotionDemo() {
  const [mode, setMode] = useState("after");
  const [qty, setQty] = useState(1);
  const step = useRef(1);
  const reduced = useReducedMotion();
  function change(by) {
    step.current = by;
    setQty((v) => Math.min(9, Math.max(1, v + by)));
  }
  const slot = useRef();
  const renderer = useRef();
  const total = qty * 24;
  const money = { style: "currency", currency: "USD", minimumFractionDigits: 2 };
  useEffect(() => {
    if (!slot.current) return;
    if (mode !== "after") {
      slot.current.textContent = total.toLocaleString("en-US", money);
      return;
    }
    slot.current.textContent = "";
    renderer.current = createNumberTransition({ slot: slot.current, value: total, locales: "en-US", format: money, duration: 420, reserveValues: [24, 240], align: "end" });
    return () => {
      renderer.current?.destroy();
      renderer.current = null;
    };
  }, [mode]);
  useEffect(() => {
    if (mode === "after") renderer.current?.update(total);
    else if (slot.current) slot.current.textContent = total.toLocaleString("en-US", money);
  }, [total, mode]);
  return (
    <div className="h-motion-demo">
      <div className="h-cart">
        <div className="h-cart-line">
          <img src="/work/lowfold-bag.webp" alt="" width="240" height="240" />
          <div className="h-cart-item">
            <b>Gatomboya AA</b>
            <span>Kenya, Nyeri · 250 g · roasted Tue 13 Oct</span>
          </div>
          <div className="h-cart-qty">
            <button type="button" onClick={() => change(-1)} aria-label="One bag fewer" disabled={qty === 1}>
              <Minus size={16} aria-hidden="true" />
            </button>
            <span className="h-cart-count" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false} custom={step.current}>
                <motion.span
                  key={qty}
                  custom={step.current}
                  variants={{ in: (d) => ({ y: d > 0 ? 10 : -10, opacity: 0 }), at: { y: 0, opacity: 1 }, out: (d) => ({ y: d > 0 ? -10 : 10, opacity: 0 }) }}
                  initial="in"
                  animate="at"
                  exit="out"
                  transition={{ duration: reduced ? 0 : 0.2, ease: enter }}
                >
                  {qty}
                </motion.span>
              </AnimatePresence>
            </span>
            <button type="button" onClick={() => change(1)} aria-label="One bag more" disabled={qty === 9}>
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          <span className="h-cart-total" ref={slot} key={mode} />
        </div>
        <Toggle label="Motion" value={mode} onChange={setMode} items={[{ id: "before", label: "Before" }, { id: "after", label: "With seenry-motion" }]} />
      </div>
    </div>
  );
}

export default function Home() {
  const [open, setOpen] = useState(null);
  return (
    <MotionConfig reducedMotion="user">
      <a className="r-skip" href="#main">
        Skip to content
      </a>
      <header className="h-header">
        <a href="https://seenry.design" className="h-wordmark" data-wordmark>
          seenry.
        </a>
        <nav aria-label="Page">
          <a href="#motion">Motion</a>
          <a href="#skills">Skills</a>
          <a href="#faq">FAQ</a>
          <a href={repository}>
            GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="main">
        <Hero onOpen={setOpen} />

        <section className="h-band h-split" id="motion" aria-labelledby="motion-title">
          <div className="h-split-head">
            <h2 id="motion-title">Motion with a reason.</h2>
            <p>
              seenry-motion on a real cart line. Before, the total is simply replaced. With the skill’s number transition,
              only the changed digits roll, in the direction of the change, and nothing around them moves.
            </p>
            <a className="h-link" href="/motion">
              Browse the motion library <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
          <MotionDemo />
        </section>

        <section className="h-band h-split" id="skills" aria-labelledby="skills-title">
          <div className="h-split-head">
            <h2 id="skills-title">Eight skills, one install.</h2>
            <p>Your agent loads the one your request needs. You keep prompting the way you do now, or name a skill.</p>
          </div>
          <ul className="h-skills">
            {skills.map(([name, text]) => (
              <li key={name}>
                <code>{name}</code>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="h-band h-faq-band" id="faq" aria-labelledby="faq-title">
          <div className="h-split-head">
            <h2 id="faq-title">Questions.</h2>
          </div>
          <div className="h-faq">
            {faq.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="h-close" aria-labelledby="close-title">
          <h2 id="close-title">Same prompt. Better design.</h2>
          <Command />
        </section>
      </main>
      <footer className="h-footer">
        <a href="https://seenry.design" className="h-wordmark" data-wordmark>
          seenry.
        </a>
        <span>Apache 2.0</span>
        <a href="https://seenry.design/mcp">
          Seenry MCP <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <a href={repository}>
          GitHub <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
      <Viewer open={open} onClose={() => setOpen(null)} />
    </MotionConfig>
  );
}
