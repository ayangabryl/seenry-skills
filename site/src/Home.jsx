import React, { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Copy, Minus, Pause, Play, Plus, X } from "lucide-react";
import { createNumberTransition } from "../../skills/seenry-motion/assets/number-transition.mjs";
import { copyText } from "./copy";
import "./reading-site.css";
import "./home.css";

const repository = "https://github.com/ayangabryl/seenry-skills";
const command = "npx skills add ayangabryl/seenry-skills";
const enter = [0.16, 1, 0.3, 1];
const exitEase = [0.4, 0, 1, 1];
const indicator = { duration: 0.18, ease: enter };
const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12, delay: 0.02, ease: enter } },
  exit: { opacity: 0, transition: { duration: 0.07, ease: exitEase } },
};
const lift = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.12, delay: 0.02, ease: enter } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.07, ease: exitEase } },
};
const opus = "Claude Opus 5.5";
const sonnet = "Claude Sonnet 5.5";

const prompts = {
  hotel: "build a website for my small boutique hotel in Lisbon, make it feel premium",
  coffee: "build a website for my specialty coffee roastery, with a shop for our beans",
  api: "make a landing page for my API that turns messy PDFs into clean JSON",
  studio: "make a portfolio site for my architecture studio",
};

const sites = {
  hotel: { name: "Casa Andorinha", model: opus, prompt: prompts.hotel, pages: [{ label: "Home", file: "hotel" }] },
  halden: { name: "Halden", model: opus, prompt: prompts.coffee, pages: [{ label: "Home", file: "halden" }] },
  lowfold: {
    name: "Lowfold Coffee",
    model: opus,
    prompt: prompts.coffee,
    pages: [
      { label: "Home", file: "lowfold" },
      { label: "Shop", file: "lowfold-shop" },
      { label: "Product", file: "lowfold-product" },
    ],
  },
  api: { name: "Parsewell", model: opus, prompt: prompts.api, pages: [{ label: "Home", file: "api" }] },
  unfold: { name: "Unfold", model: opus, prompt: prompts.api, pages: [{ label: "Home", file: "unfold" }] },
  studio: { name: "Lilim Architects", model: opus, prompt: prompts.studio, pages: [{ label: "Home", file: "studio" }] },
  "lowfold-arch": { name: "Lowfold Architects", model: opus, prompt: prompts.studio, pages: [{ label: "Home", file: "lowfold-arch" }] },
  wren: { name: "Wren Street", model: sonnet, prompt: "make a website for my neighborhood bakery", pages: [{ label: "Home", file: "wren" }] },
  ines: { name: "Inês Varela", model: sonnet, prompt: "i'm a wedding photographer, need a portfolio site", pages: [{ label: "Home", file: "ines" }] },
  trio: { name: "Trio", model: sonnet, prompt: "make a landing page for my habit tracker app, make it look good", pages: [{ label: "Home", file: "trio" }] },
};

const groups = [
  { label: "Hotel", ids: ["hotel"] },
  { label: "Coffee roaster, run twice", ids: ["halden", "lowfold"] },
  { label: "PDF to JSON API, run twice", ids: ["api", "unfold"] },
  { label: "Architecture studio, run twice", ids: ["studio", "lowfold-arch"] },
  { label: "On Claude Sonnet", ids: ["wren", "ines", "trio"] },
];

const pairs = [
  {
    id: "habit",
    label: "Habit tracker",
    prompt: "make a landing page for my habit tracker app, make it look good",
    change: "Without it: pastel cards, an orange accent word and a borrowed logo wall. With it: one specific promise, one colour and the app itself.",
    beforeAlt: "Without Seenry: “Little steps. Big changes.” with an orange accent word, floating cards, a sparkle and a row of company logos.",
    afterAlt: "With Seenry: “Miss a day. Keep your progress.” on a single yellow field beside the app’s today screen.",
  },
  {
    id: "notes",
    label: "Notes app",
    prompt: "waitlist page for my AI notes app",
    change: "Without it: an italic accent line, a sparkle and avatar proof. With it: a plain claim and the notebook showing a connection it found.",
    beforeAlt: "Without Seenry: “Big thoughts. Little notes. Endless possibilities.” with an italic accent line, a sparkle and avatar social proof.",
    afterAlt: "With Seenry: “Your notes. A mind of their own.” beside the notebook, which highlights a connection between two notes.",
  },
  {
    id: "bakery",
    label: "Bakery",
    prompt: "make a website for my neighborhood bakery",
    change: "Without it: an italic accent, sticker badges and uppercase labels. With it: a concrete claim, 48 hours, and one photograph of the bread.",
    beforeAlt: "Without Seenry: “Good mornings start with something warm.” with an italic accent, a sticker badge and small uppercase labels.",
    afterAlt: "With Seenry: “48 hours in the making. Ready for your morning.” over one large photograph of sourdough.",
  },
];

const scores = [
  { name: "Seenry + MCP", value: 7.99, lead: true },
  { name: "Emil Kowalski’s skills", value: 6.84 },
  { name: "No skill", value: 6.61 },
  { name: "Jakub Krehel’s skills", value: 6.53 },
];

const photos = [
  ["room", "Guest room", 8],
  ["breakfast", "Breakfast", 7],
  ["street", "Alfama street", 8],
];

const swatches = [
  ["#f6f3ee", "Limestone"],
  ["#fffdfa", "Surface"],
  ["#e2ddd4", "Rule"],
  ["#1c1a17", "Ink"],
  ["#2c4fa3", "Azulejo cobalt"],
  ["#14213c", "River night"],
];

const faq = [
  ["What are agent skills?", "Instructions, scripts and assets your coding agent loads when a task needs them. You keep prompting as you do now; the agent picks the right skill from what you ask, or you name one."],
  ["How do I install them?", `Run ${command} in your project, then ask for a page, a redesign or a review as usual.`],
  ["Which agents do they work with?", "Claude Code, Codex and Cursor, and other agents that read the open skills format."],
  ["Do I need Seenry MCP?", "No. Without it the skills use their built-in benchmarks and ordinary browsing. With a Seenry Pro key your agent can also study 100,000+ captured app screens, nearly 2,000 measured websites and recordings of real interactions."],
  ["Why does it take longer?", "It researches references, explores three directions and runs a blind review before it stops: about 12 minutes per new site, against 6 to 7 without it."],
  ["Were the examples edited?", "No. Every page here is the agent’s output as captured. The photographs inside them were generated by the agents."],
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

function Prompt({ text, meta }) {
  return (
    <p className="h-prompt">
      <span aria-hidden="true">&gt;</span> {text}
      {meta && <em>{meta}</em>}
    </p>
  );
}

function Section({ id, name, lead, children, first = false }) {
  return (
    <section className={"h-sec" + (first ? " h-sec-first" : "")} id={id} aria-labelledby={`${id}-name`}>
      <div className="h-col">
        <h2 className="h-sec-name" id={`${id}-name`}>
          <span aria-hidden="true">/</span>
          {name}
        </h2>
        {lead && <p className="h-sec-lead">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Step({ title, run, children }) {
  return (
    <div className="h-step">
      <div className="h-col">
        <h3>{title}</h3>
        <p className="h-step-run">From the {run} run</p>
      </div>
      {children}
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

function Shot({ name, alt }) {
  return (
    <picture>
      <source media="(max-width: 760px)" srcSet={`/work/${name}-390.webp`} />
      <img src={`/work/${name}.webp`} alt={alt} width="1440" height="900" />
    </picture>
  );
}

function SamePrompt() {
  const [pairId, setPairId] = useState("habit");
  const [side, setSide] = useState("after");
  const pair = pairs.find((p) => p.id === pairId);
  return (
    <div className="h-wide h-same">
      <div className="h-same-top">
        <Tabs label="Example" value={pairId} onChange={setPairId} items={pairs} />
        <Toggle label="Show the page" value={side} onChange={setSide} items={[{ id: "before", label: "Without" }, { id: "after", label: "With Seenry" }]} />
      </div>
      <div className="h-clip">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={pair.id} {...lift}>
            <Prompt text={pair.prompt} meta="Codex Sol 6.1" />
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={pair.id} {...swap}>
          <div className="h-compare" data-side={side}>
            <figure className="h-compare-before">
              <figcaption>Without Seenry</figcaption>
              <div className="h-frame">
                <Shot name={`${pair.id}-before`} alt={pair.beforeAlt} />
              </div>
            </figure>
            <figure className="h-compare-after">
              <figcaption>With Seenry + MCP</figcaption>
              <div className="h-frame">
                <Shot name={`${pair.id}-after`} alt={pair.afterAlt} />
              </div>
            </figure>
          </div>
          <p className="h-note">{pair.change}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Explore() {
  const [openAlt] = useState(() => !matchMedia("(max-width: 760px)").matches);
  return (
    <div className="h-wide h-explore">
      <figure className="h-explore-win">
        <img src="/work/studio-explore-a.webp" alt="Explored first screen A: the house photograph with the cooling claim and two temperature readings." width="1440" height="900" />
        <figcaption>
          <span>A · the house and the claim, picked</span>
          <b>8</b>
        </figcaption>
      </figure>
      <details className="h-explore-side" open={openAlt}>
        <summary>Show B and C</summary>
        {[
          ["b", "B · the drawing", 7],
          ["c", "C · the number", 7],
        ].map(([file, name, score]) => (
          <figure key={file}>
            <img src={`/work/studio-explore-${file}.webp`} alt={`Explored first screen ${name}.`} width="1440" height="900" />
            <figcaption>
              <span>{name}</span>
              <b>{score}</b>
            </figcaption>
          </figure>
        ))}
      </details>
      <ul className="h-explore-notes">
        <li>
          <span>Kept</span>Work comes first: the house fills the screen.
        </li>
        <li>
          <span>Refused</span>The all-caps mood slogan studio sites repeat.
        </li>
        <li>
          <span>Claimed</span>Measured cooling: 34° street, 29° inside.
        </li>
      </ul>
      <p className="h-note">
        Ranked blind by a fresh model that did not know which was which. B’s drawing became a section further down.
      </p>
    </div>
  );
}

function Benchmark() {
  return (
    <div className="h-wide">
      <p className="h-bench-result">Led 15 of 18 tasks.</p>
      <figure className="h-chart">
        <dl className="h-bars">
          {scores.map((s) => (
            <div key={s.name} className={s.lead ? "h-bar-lead" : undefined}>
              <dt>{s.name}</dt>
              <dd>
                <span className="h-bar-track" style={{ "--v": s.value / 10 }}>
                  <span className="h-bar" aria-hidden="true" />
                  <span className="h-bar-value">{s.value.toFixed(2)}</span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="h-axis" aria-hidden="true">
          {[0, 2, 4, 6, 8, 10].map((t) => (
            <span key={t} style={{ "--t": t / 10 }}>
              {t}
            </span>
          ))}
        </div>
        <figcaption>Mean blind score out of 10, 80 judgments per condition.</figcaption>
      </figure>
      <p className="h-note">
        59 wins, 15 ties and 6 losses against Emil Kowalski’s skills, judged pair by pair. The cost is time: about 12
        minutes per new site, against 6 to 7 without it. Ten edits inside existing apps and eight new sites from
        one-line requests, seven held out from tuning; Codex Sol 6.1 built every page and Claude Opus judged the
        screenshots with labels shuffled, on October 7, 2026.{" "}
        <a href={`${repository}#measured-results`}>
          Read the full method <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </p>
      <div className="h-col h-again">
        <Command />
      </div>
    </div>
  );
}

function useTravel(frame) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  function freeze() {
    const img = frame.current?.querySelector("img");
    if (!img) return null;
    const y = new DOMMatrixReadOnly(getComputedStyle(img).transform).m42;
    img.style.transition = "none";
    img.style.transform = `translateY(${y}px)`;
    return { img, y };
  }
  function play() {
    const s = freeze();
    if (!s) return;
    const distance = s.img.offsetHeight - frame.current.clientHeight;
    s.img.getBoundingClientRect();
    s.img.style.transition = `transform ${Math.max(0, distance + s.y) / 320}s linear`;
    s.img.style.transform = `translateY(${-distance}px)`;
    setPlaying(true);
  }
  function pause() {
    freeze();
    setPlaying(false);
  }
  return { playing, play, pause, reduced };
}

function Gallery({ onOpen }) {
  const [id, setId] = useState("hotel");
  const [page, setPage] = useState(0);
  const frame = useRef();
  const { playing, play, pause, reduced } = useTravel(frame);
  const site = sites[id];
  const file = site.pages[page].file;
  function choose(next) {
    pause();
    setPage(0);
    setId(next);
  }
  return (
    <div className="h-wide h-gallery">
      <div className="h-clip">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={id} {...lift}>
            <Prompt text={site.prompt} meta={site.model} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="h-gallery-frame h-frame" ref={frame} data-gallery-frame>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.picture key={file} {...swap}>
            <source media="(max-width: 760px)" srcSet={`/work/${file}-390.webp`} />
            <img src={`/work/${file}-1440.webp`} alt={`${site.name}, ${site.pages[page].label.toLowerCase()} page, unedited agent output.`} width="1440" height="6000" />
          </motion.picture>
        </AnimatePresence>
      </div>
      <div className="h-gallery-foot">
        <span className="h-gallery-name">
          <b>{site.name}</b>
          {site.pages.length > 1 && (
            <Toggle
              label="Page"
              value={String(page)}
              onChange={(next) => {
                pause();
                setPage(Number(next));
              }}
              items={site.pages.map((p, i) => ({ id: String(i), label: p.label }))}
            />
          )}
        </span>
        <span className="h-gallery-actions">
          {!reduced && (
            <button type="button" onClick={() => (playing ? pause() : play())} aria-pressed={playing}>
              {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
              {playing ? "Pause" : "Scroll the page"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              pause();
              onOpen(id, page, frame.current.getBoundingClientRect());
            }}
            aria-haspopup="dialog"
          >
            Open the full site <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="h-strip">
        {groups.map((group) => (
          <div key={group.label} className="h-strip-group" style={{ "--n": group.ids.length }}>
            <p>{group.label}</p>
            <div>
              {group.ids.map((sid) => (
                <button
                  key={sid}
                  type="button"
                  className="h-thumb"
                  aria-pressed={id === sid}
                  aria-label={`Show ${sites[sid].name}`}
                  onClick={() => {
                    if (id !== sid) choose(sid);
                    const top = frame.current.getBoundingClientRect().top;
                    if (top < 0 || top > innerHeight * 0.6) frame.current.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
                  }}
                >
                  <img src={`/work/${sites[sid].pages[0].file}-first.webp`} alt="" width="1440" height="900" />
                  <span>{sites[sid].name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Viewer({ open, onClose }) {
  const dialog = useRef();
  const frame = useRef();
  const [page, setPage] = useState(0);
  const [device, setDevice] = useState("desktop");
  const site = open ? sites[open.id] : null;
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open) {
      setPage(open.page || 0);
      setDevice(matchMedia("(max-width: 760px)").matches ? "phone" : "desktop");
      if (!d.open) d.showModal();
      const from = open.rect;
      if (from && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const to = d.getBoundingClientRect();
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        d.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0.4 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      }
    } else if (d.open) {
      d.close();
    }
  }, [open]);
  useEffect(() => {
    if (frame.current) frame.current.scrollTop = 0;
  }, [page, device, open]);
  const current = site ? Math.min(page, site.pages.length - 1) : 0;
  const file = site?.pages[current].file;
  return (
    <dialog
      ref={dialog}
      className="h-viewer"
      aria-labelledby="viewer-title"
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current.close()}
    >
      {site && (
        <div className="h-viewer-inner">
          <div className="h-viewer-bar">
            <div className="h-viewer-title">
              <h2 id="viewer-title">{site.name}</h2>
              <span>{site.model} with Seenry + MCP · unedited</span>
            </div>
            <div className="h-viewer-tools">
              {site.pages.length > 1 && (
                <Toggle
                  label="Page"
                  value={String(current)}
                  onChange={(next) => setPage(Number(next))}
                  items={site.pages.map((p, i) => ({ id: String(i), label: p.label }))}
                />
              )}
              <Toggle label="Device" value={device} onChange={setDevice} items={[{ id: "desktop", label: "Desktop" }, { id: "phone", label: "Phone" }]} />
              <button type="button" className="h-viewer-close" onClick={() => dialog.current.close()} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="h-viewer-prompt">
            <Prompt text={site.prompt} />
          </div>
          <div className="h-viewer-frame" ref={frame} tabIndex={0} aria-label={`${site.name}, ${site.pages[current].label} page`} data-device={device}>
            <img key={file + device} src={`/work/${file}-${device === "desktop" ? 1440 : 390}.webp`} alt={`${site.name} ${site.pages[current].label.toLowerCase()} page at ${device} width.`} />
          </div>
        </div>
      )}
    </dialog>
  );
}

function Review() {
  return (
    <div className="h-wide h-review">
      <blockquote>
        <p>“Add a real photograph of the corresponding veranda or ventilation opening beneath the diagram, so it has built evidence.”</p>
        <footer>Seenry’s blind critic, round 7 of 8.</footer>
      </blockquote>
      <div className="h-revision">
        <figure>
          <figcaption>Round 7</figcaption>
          <div className="h-frame h-frame-dark">
            <img src="/work/studio-round7.webp" alt="Round 7: the three cooling principles in a row below the diagram, with no photograph." width="1440" height="294" />
          </div>
        </figure>
        <figure className="h-revision-after">
          <figcaption>After the fix</figcaption>
          <div className="h-frame h-frame-dark">
            <img src="/work/studio-after.webp" alt="After the fix: a photograph of the breeze-block wall beside the three principles." width="1440" height="680" />
          </div>
        </figure>
      </div>
      <p className="h-note">
        Every finding names where it is and how to fix it, ranked. This run held at 7 for four rounds, so it stopped and
        reported what was still open; it only claims a pass at 9.
      </p>
    </div>
  );
}

function Assets() {
  return (
    <div className="h-wide h-assets">
      <figure className="h-assets-page">
        <div className="h-frame">
          <img src="/work/hotel-room.webp" alt="Casa Andorinha’s Room 3.1 section: the generated guest room photograph beside the room’s details and a cobalt booking button." width="1440" height="1050" />
        </div>
        <figcaption>The generated guest room photograph, in the finished page.</figcaption>
      </figure>
      <div className="h-photos">
        {photos.map(([file, slot, score]) => (
          <figure key={file}>
            <img src={`/work/photo-${file}.webp`} alt={`Generated photograph for the ${slot.toLowerCase()} slot.`} width="800" height="1000" />
            <figcaption>
              <span>{slot}</span>
              <b>{score}/10</b>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="h-note">
        One shoot, generated with the same light and surface words in every prompt, then scored for its slot by a blind
        photo check. Anything under 7 is regenerated or replaced.
      </p>
    </div>
  );
}

function Brand() {
  return (
    <div className="h-wide">
      <div className="h-brand">
        <figure>
          <div className="h-frame">
            <img src="/work/hotel-floors.webp" alt="Casa Andorinha’s floor chooser: a serif heading, the house drawn in line, a balcony photograph and rooms 3.1 to 3.3 with cobalt Book buttons." width="1440" height="1290" />
          </div>
        </figure>
        <ol className="h-brand-rules">
          <li>
            <b>One action colour.</b> Cobalt only for booking, selection and focus.
          </li>
          <li>
            <b>Serif headlines, never italic.</b> Newsreader 400 for headlines, room numbers and prices; Hanken Grotesk
            for text.
          </li>
          <li>
            <b>Rooms by position.</b> “3.1, Rio”, matched to its window on the drawing, with a rate that includes
            breakfast.
          </li>
        </ol>
      </div>
      <div className="h-swatches" aria-label="Palette">
        {swatches.map(([hex, name]) => (
          <span key={hex}>
            <i style={{ background: hex }} aria-hidden="true" />
            {name} <code>{hex}</code>
          </span>
        ))}
      </div>
      <p className="h-note">From the brand guidelines section Seenry wrote into Casa Andorinha’s DESIGN.md, shown where they apply.</p>
    </div>
  );
}

function MotionDemo() {
  const [mode, setMode] = useState("after");
  const [qty, setQty] = useState(1);
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
    <div className="h-wide">
      <div className="h-cart">
        <div className="h-cart-line">
          <img src="/work/lowfold-bag.webp" alt="" width="240" height="240" />
          <div className="h-cart-item">
            <b>Gatomboya AA</b>
            <span>Kenya, Nyeri · 250 g · roasted Tue 13 Oct</span>
          </div>
          <div className="h-cart-qty">
            <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} aria-label="One bag fewer" disabled={qty === 1}>
              <Minus size={16} aria-hidden="true" />
            </button>
            <span aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((v) => Math.min(9, v + 1))} aria-label="One bag more" disabled={qty === 9}>
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          <span className="h-cart-total" ref={slot} key={mode} />
        </div>
        <Toggle label="Motion" value={mode} onChange={setMode} items={[{ id: "before", label: "Before" }, { id: "after", label: "With seenry-motion" }]} />
      </div>
      <p className="h-note">
        A cart line from Lowfold Coffee, one of the examples. Before, the total is replaced. With the skill’s number
        transition, only the changed digits roll, in the direction of the change, and nothing around them moves. Reduced
        motion gets the instant swap.{" "}
        <a href="/motion">
          Browse the motion library <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </p>
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
      <header className="h-header h-col">
        <a href="https://seenry.design" className="h-wordmark" data-wordmark>
          seenry.
        </a>
        <a href={repository}>
          GitHub <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </header>
      <main id="main">
        <section className="h-intro h-col" aria-labelledby="intro-title">
          <h1 id="intro-title">
            <span aria-hidden="true">/</span>skills
          </h1>
          <p>
            Install these and your coding agent studies real references, explores three directions and reviews its own
            page blind before it stops. In a blind benchmark of 18 everyday requests, it led 15.
          </p>
          <Command />
          <p className="h-intro-links">
            <a href={repository}>
              GitHub <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a href="https://seenry.design/mcp">
              Seenry MCP <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <span>Claude Code, Codex and Cursor</span>
          </p>
        </section>

        <Section id="seenry" name="seenry" first lead={<>The core skill for pages and components. Same prompt, same model, without and with it:</>}>
          <SamePrompt />
        </Section>

        <Section id="benchmark" name="benchmark" lead={<>Blind-judged against no skill and two popular design skills, on the requests people actually type.</>}>
          <Benchmark />
        </Section>

        <Section
          id="examples"
          name="examples"
          lead={<>Unedited pages from one-line prompts. Run the same prompt twice and you get two identities, not one template.</>}
        >
          <Gallery onOpen={(id, page, rect) => setOpen({ id, page, rect })} />
        </Section>

        <Section
          id="inside-seenry"
          name="inside-seenry"
          lead={<>What the core skill does on every page, shown with the working files of two runs from the examples.</>}
        >
          <Step title="It explores three directions and picks one blind" run="Lilim Architects">
            <Explore />
          </Step>
          <Step title="It reviews the page until it holds" run="Lilim Architects">
            <Review />
          </Step>
          <Step title="It checks every photograph for its slot" run="Casa Andorinha">
            <Assets />
          </Step>
          <Step title="It writes the rules down for the next page" run="Casa Andorinha">
            <Brand />
          </Step>
        </Section>

        <Section
          id="seenry-motion"
          name="seenry-motion"
          lead={<>Decides whether something should move at all, then picks the curve, duration, interruption and reduced-motion behaviour, with tested recipes and assets you can run.</>}
        >
          <MotionDemo />
        </Section>

        <Section id="more-skills" name="more-skills" lead={<>Installed with the rest, each runs when your request needs it.</>}>
          <div className="h-col">
            <ul className="h-also">
              <li>
                <code>seenry-review</code> Ranked, fixable findings for a live screen, a branch or pull request, or one
                component pushed through every state and size. It can also explain how an interface you point it at was
                built.
              </li>
              <li>
                <code>seenry-assets</code> Finds license-clear photos, icons and fonts, or generates images when your agent
                has an image model, and writes a manifest with every file’s source, licence and prompt.
              </li>
              <li>
                <code>seenry-branding</code> Researches identity systems and writes a BRAND.md, linked from DESIGN.md, with
                the colour, type, imagery and naming rules later agents follow.
              </li>
              <li>
                <code>seenry-apps</code> Native-feeling mobile screens and flows in SwiftUI, UIKit, React Native, Expo or
                Flutter, held to a strict platform grid.
              </li>
              <li>
                <code>seenry-decks</code> Researches presentation decks in the Seenry library, keeping slide order and
                narrative roles, so a deck is planned as a sequence.
              </li>
              <li>
                <code>seenry-video</code> Product films as code: story, shot list, voiceover and sound, rendered frame by
                frame from real captures.
              </li>
            </ul>
          </div>
        </Section>

        <Section id="faq" name="faq">
          <div className="h-col">
            <div className="h-faq">
              {faq.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>
      </main>
      <footer className="h-footer h-col">
        <a href="https://seenry.design">Seenry</a>
        <span>Apache 2.0</span>
        <a href={repository}>
          Source <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
      <Viewer open={open} onClose={() => setOpen(null)} />
    </MotionConfig>
  );
}
