import React, { useState, useRef, useId, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Mail,
  Link,
  Download,
  ArrowLeft,
  SlidersHorizontal,
  Image as ImageIcon,
  Layers,
  MousePointer2,
  Scan,
  Maximize,
} from "lucide-react";
import "./style.css";
import Showcase from "./Showcase.jsx";
import "./showcase.css";
const repo = "https://github.com/ayangabryl/seenry-skills";
const command = "npx skills add ayangabryl/seenry-skills";
function CopyButton({
  text = command,
  label = "Copy command",
  primary = false,
}) {
  const [state, set] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      set("Copied");
      setTimeout(() => set(""), 2000);
    } catch {
      set("Select and copy the command below");
    }
  }
  return (
    <button
      className={primary ? "primary" : ""}
      onClick={copy}
      aria-label={label}
    >
      {state === "Copied" ? <Check size={16} /> : <Copy size={16} />}
      <span aria-live="polite">{state || label}</span>
    </button>
  );
}
function Switch({ items, value, onChange, label }) {
  let id = useId();
  return (
    <div className="switch" role="group" aria-label={label}>
      {items.map((x) => (
        <button key={x} aria-pressed={value === x} onClick={() => onChange(x)}>
          {value === x && (
            <motion.span
              layoutId={id}
              className="selection"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <span>{x}</span>
        </button>
      ))}
    </div>
  );
}
function Art({ type = 0 }) {
  const gid = useId();
  return (
    <svg
      viewBox="0 0 480 480"
      aria-label={
        ["Folded paper sculpture", "Orbit sculpture", "Sculpted monogram"][type]
      }
      role="img"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={type === 1 ? "#ddd9ce" : "#f3ede4"} />
          <stop offset=".52" stopColor={type === 1 ? "#8c99a4" : "#b9afa2"} />
          <stop offset="1" stopColor="#595b58" />
        </linearGradient>
      </defs>
      {type === 0 ? (
        <g transform="translate(240 245) rotate(-25)">
          {Array.from({ length: 13 }, (_, i) => (
            <path
              key={i}
              d={`M ${-150 + i * 10} ${-110 + i * 9} Q 50 ${-185 + i * 8} ${150 - i * 7} ${-80 + i * 13} L ${80 - i * 9} ${160 - i * 3} Q -85 95 ${-150 + i * 10} ${-110 + i * 9}`}
              fill={`url(#${gid})`}
              stroke="#fff8"
              strokeWidth="1.2"
            />
          ))}
        </g>
      ) : type === 1 ? (
        <g transform="translate(240 240) rotate(-32)">
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse
              key={i}
              cx={i * 5 - 20}
              rx={125 - i * 4}
              ry={164 - i * 5}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="14"
              transform={`rotate(${i * 13})`}
            />
          ))}
        </g>
      ) : (
        <g transform="translate(85 80)">
          <path
            d="M270 65C180 -45 0 20 25 140c15 70 190 25 198 100 6 60-136 85-196 10"
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="64"
            strokeLinecap="round"
          />
          <path
            d="M260 48C155 -30 20 40 40 133"
            fill="none"
            stroke="#ffffff66"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
function DesignPreview({ before = false }) {
  return (
    <div className={"design-preview " + (before ? "before" : "after")}>
      <div className="spec-nav">
        <strong>forma®</strong>
        <span>Objects for everyday.</span>
        <ArrowUpRight size={18} />
      </div>
      <div className="spec-content">
        <div className="spec-copy">
          <span className="eyebrow">INDEPENDENT DESIGN STORE</span>
          <h3>
            {before
              ? "Discover Amazing Design Products"
              : "A little less.\nA little better."}
          </h3>
          <p>
            {before
              ? "Elevate your lifestyle with our innovative, curated solutions for modern living."
              : "Thoughtful objects. Beautifully made.\nKeep only what you love."}
          </p>
          <a href="#assets" className="spec-action">
            Explore the collection <ArrowRight size={16} />
          </a>
        </div>
        <div className="spec-art">
          <Art />
          <span>01 — Fold study</span>
        </div>
      </div>
      <div className="spec-bottom">
        <span>Made with intention.</span>
        <span>Objects / Lighting / Editions</span>
      </div>
    </div>
  );
}
function Hero() {
  const [mode, set] = useState("With Seenry");
  return (
    <section className="hero" id="design">
      <div className="hero-copy">
        <span className="kicker">OPEN-SOURCE SKILLS FOR YOUR CODING AGENT</span>
        <h1>
          Give your AI
          <br />
          an eye for design.
        </h1>
        <p>
          From the first layout to the final interaction.
          <br />
          Five skills for work that feels considered.
        </p>
        <div className="hero-actions">
          <a className="primary" href="#install">
            Get the skills <ArrowRight size={17} />
          </a>
          <a className="quiet" href="#playground">
            Try the demos <span>↓</span>
          </a>
        </div>
      </div>
      <div className="workbench">
        <div className="bench-toolbar">
          <span>
            <span className="status-dot" /> A design, reconsidered
          </span>
          <Switch
            items={["Before", "With Seenry"]}
            value={mode}
            onChange={set}
            label="Compare website design"
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.23 }}
          >
            <DesignPreview before={mode === "Before"} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="demo-caption">
        <span>Same brief. Different decisions.</span>
        <span>
          Authored examples of the skills’ guidance, not a model benchmark.
        </span>
      </div>
      <div className="agent-list">
        <span>Fits where you build</span>
        <strong>Codex</strong>
        <strong>Claude Code</strong>
        <strong>Cursor</strong>
        <strong>VS Code</strong>
      </div>
    </section>
  );
}
function SectionIntro({ tag, title, children }) {
  return (
    <div className="section-intro">
      <span className="kicker">{tag}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
function MotionDemo() {
  const [open, set] = useState(false);
  const [tab, choose] = useState("Share");
  const [copied, copy] = useState(false);
  const host = useRef();
  const trigger = useRef();
  useEffect(() => {
    if (!open) return;
    host.current?.querySelector(".floating-panel button")?.focus();
    const outside = (e) => {
      if (!host.current?.contains(e.target)) set(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      ref={host}
      className="motion-demo"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          set(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="floating-demo">
        <AnimatePresence>
          {open && (
            <motion.div
              className="floating-panel"
              initial={{ opacity: 0, scale: 0.78, y: 18, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.88, y: 12, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 440, damping: 32 }}
            >
              <Switch
                items={["Share", "Export"]}
                value={tab}
                onChange={choose}
                label="Popover action"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {tab === "Share" ? (
                    <>
                      <p>Share your collection</p>
                      <button
                        className="menu-row"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              "https://skill.seenry.design/",
                            );
                            copy(true);
                          } catch {
                            copy(false);
                          }
                        }}
                      >
                        <Link size={17} />
                        {copied ? "Link copied" : "Copy link"}
                        <Copy size={15} />
                      </button>
                      <a
                        className="menu-row"
                        href="mailto:?subject=Seenry%20Skills&body=https%3A%2F%2Fskill.seenry.design"
                      >
                        <Mail size={17} />
                        Send by email
                        <ArrowUpRight size={15} />
                      </a>
                    </>
                  ) : (
                    <>
                      <p>Take the example with you</p>
                      <a
                        className="menu-row"
                        href={repo + "/tree/main/site/src"}
                      >
                        <Download size={17} />
                        View source
                        <ArrowUpRight size={15} />
                      </a>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          ref={trigger}
          className={"popover-trigger " + (open ? "active" : "")}
          aria-expanded={open}
          aria-label={open ? "Close example popover" : "Open example popover"}
          onClick={() => set(!open)}
          whileTap={{ scale: 0.94 }}
        >
          <motion.span animate={{ rotate: open ? 45 : 0 }}>
            <Plus size={25} />
          </motion.span>
        </motion.button>
      </div>
      <span className="demo-hint">Click. Switch. Close. Try it again.</span>
    </div>
  );
}
function MotionSection() {
  return (
    <section id="playground" className="split-section">
      <SectionIntro tag="01 / SEENRY-MOTION" title="Feel the difference.">
        A menu should stay connected to its trigger. A transition should follow
        your next move.
      </SectionIntro>
      <div className="demo-block">
        <MotionDemo />
        <div className="under-demo">
          <span>Anchored popover · Shared selection · Reversible motion</span>
          <a href={repo + "/tree/main/skills/seenry-motion"}>
            Explore the skill <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
function AssetSection() {
  const [asset, set] = useState("Fold");
  return (
    <section id="assets" className="split-section">
      <SectionIntro
        tag="02 / SEENRY-ASSETS"
        title="The right material. In the right place."
      >
        Source imagery, choose type, or generate an original asset when the
        project calls for one. Keep the source and the fallback.
      </SectionIntro>
      <div className="demo-block">
        <div className="asset-demo">
          <div className="asset-top">
            <span>STUDIO / MATERIAL EXPLORATIONS</span>
            <ImageIcon size={18} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={asset}
              initial={{ opacity: 0, scale: 0.93, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.3 }}
            >
              <Art type={["Fold", "Orbit", "Letter"].indexOf(asset)} />
            </motion.div>
          </AnimatePresence>
          <Switch
            items={["Fold", "Orbit", "Letter"]}
            value={asset}
            onChange={set}
            label="Select original artwork"
          />
        </div>
        <div className="under-demo">
          <span>
            Original vector studies · Responsive · No external image requests
          </span>
          <a href={repo + "/tree/main/skills/seenry-assets"}>
            Explore the skill <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
function BrandSection() {
  const [tone, set] = useState("Stone");
  return (
    <section className="split-section" id="branding">
      <SectionIntro
        tag="03 / SEENRY-BRANDING"
        title="One identity. Everywhere."
      >
        Carry the same typography, color and material across the website, the
        object and the smallest detail.
      </SectionIntro>
      <div className="demo-block">
        <div className={"brand-demo " + tone.toLowerCase()}>
          <div className="brand-poster">
            <span>OBJECTS WITH INTENTION</span>
            <strong>forma.</strong>
            <span>2026 — COLLECTION 01</span>
          </div>
          <div className="brand-small">
            <div className="brand-card">
              <strong>f.</strong>
              <span>
                A quieter kind
                <br />
                of everyday.
              </span>
            </div>
            <div className="brand-colors">
              <i />
              <i />
              <i />
            </div>
          </div>
          <Switch
            items={["Stone", "Ink", "Clay"]}
            value={tone}
            onChange={set}
            label="Brand palette"
          />
        </div>
        <div className="under-demo">
          <span>Change the palette. The whole system follows.</span>
          <a href={repo + "/tree/main/skills/seenry-branding"}>
            Explore the skill <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
const slides = [
  {
    label: "The idea",
    title: "Fewer things.\nBetter things.",
    small: "FORMA / COLLECTION 01",
  },
  {
    label: "The evidence",
    title: "Designed to stay.",
    small: "REPAIRABLE PARTS · HONEST MATERIALS",
  },
  {
    label: "The invitation",
    title: "Make room\nfor the everyday.",
    small: "EXPLORE THE COLLECTION",
  },
];
function DeckSection() {
  const [n, set] = useState(0);
  return (
    <section className="split-section" id="decks">
      <SectionIntro
        tag="04 / SEENRY-DECKS"
        title="Make the story easy to follow."
      >
        Give every slide a job. Study the sequence, build the argument and keep
        the visual language intact.
      </SectionIntro>
      <div className="demo-block">
        <div className="deck-demo">
          <AnimatePresence mode="wait">
            <motion.div
              key={n}
              className={"slide slide-" + n}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.25 }}
            >
              <span>{slides[n].small}</span>
              <h3>{slides[n].title}</h3>
              <Art type={n} />
              <small>forma.</small>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="deck-controls">
          <button
            aria-label="Previous slide"
            disabled={!n}
            onClick={() => set(n - 1)}
          >
            <ArrowLeft size={18} />
          </button>
          <span>
            {n + 1} / 3 <b>{slides[n].label}</b>
          </span>
          <button
            aria-label="Next slide"
            disabled={n === 2}
            onClick={() => set(n + 1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
const media =
  "https://cdn.seenry.design/designs/24ebbdf6910e69ca125cfae5350b4d01/video.mp4";
function VideoDemo() {
  const v = useRef();
  const [playing, set] = useState(false);
  const [time, tick] = useState(0);
  const [error, fail] = useState(false);
  return (
    <div className="video-demo">
      <video
        ref={v}
        playsInline
        preload="none"
        poster="https://cdn.seenry.design/designs/24ebbdf6910e69ca125cfae5350b4d01/poster.webp"
        muted
        onLoadedData={() => fail(false)}
        onPlay={() => {
          fail(false);
          set(true);
        }}
        onPause={() => set(false)}
        onEnded={() => set(false)}
        onTimeUpdate={() =>
          tick((v.current.currentTime / (v.current.duration || 1)) * 100)
        }
        onError={() => fail(true)}
        src={media}
        aria-label="Original fluid popover motion reference"
      />
      {error ? (
        <p>
          Video couldn’t load.{" "}
          <button
            onClick={() => {
              fail(false);
              v.current.load();
              v.current.play().catch(() => fail(true));
            }}
          >
            Try again
          </button>{" "}
          <a href="https://seenry.design/demos/motion-studies/">
            Open the motion study ↗
          </a>
        </p>
      ) : (
        <div className="video-controls">
          <button
            aria-label={playing ? "Pause reference" : "Play reference"}
            onClick={() =>
              playing
                ? v.current.pause()
                : v.current.play().catch(() => fail(true))
            }
          >
            {playing ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <input
            aria-label="Reference video position"
            type="range"
            min="0"
            max="100"
            value={time}
            onChange={(e) => {
              if (Number.isFinite(v.current.duration))
                v.current.currentTime =
                  (e.target.value / 100) * v.current.duration;
            }}
          />
          <button
            aria-label="Restart reference"
            onClick={() => {
              v.current.currentTime = 0;
              v.current.play().catch(() => fail(true));
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
function Reconstruction() {
  const host = useRef();
  const [width, set] = useState(560);
  useEffect(() => {
    const obs = new ResizeObserver(([e]) => set(e.contentRect.width));
    obs.observe(host.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={host} className="reconstruction">
      <iframe
        title="Interactive popover reconstruction"
        src="/demos/liquid-popover/index.html"
        loading="lazy"
        style={{
          width: 1154,
          height: 720,
          transform: `scale(${width / 1154})`,
        }}
      />
    </div>
  );
}
function MCPSection() {
  const [mode, set] = useState("Reference");
  return (
    <section className="mcp-section" id="mcp">
      <SectionIntro
        tag="05 / SKILLS + SEENRY MCP"
        title="Give your agent something real to work from."
      >
        Connect the library. Inspect the actual screens and recordings.
        Reconstruct a reference, or take its principles somewhere new.
      </SectionIntro>
      <div className="mcp-layout">
        <div className="mcp-copy">
          <div className="connection">
            <span className="mini-logo">s.</span>
            <span className="connection-line" />
            <span className="connection-node">
              <Scan size={22} />
            </span>
          </div>
          <h3>Reference → understanding → interface.</h3>
          <p>
            Video reveals what a screenshot cannot: the trigger, the timing, the
            hover and the way back.
          </p>
          <Switch
            items={["Reference", "Reconstruction"]}
            value={mode}
            onChange={set}
            label="View motion reference or reconstruction"
          />
          <a className="primary" href="https://seenry.design/mcp">
            Connect Seenry MCP <ArrowUpRight size={16} />
          </a>
          <small>
            Skills are free. Library access and MCP usage follow your Seenry
            plan.
          </small>
        </div>
        <div>
          <div className="mcp-media">
            {mode === "Reference" ? <VideoDemo /> : <Reconstruction />}
          </div>
          <div className="under-demo">
            <span>
              {mode === "Reference"
                ? "Original motion reference · Kopp"
                : "Author-assisted reconstruction · Interactive demo"}
            </span>
            <a href="https://seenry.design/demos/motion-studies/">
              Full study <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
      <div className="prompt-pair">
        <article>
          <span>RECREATE</span>
          <p>
            “Inspect this recording. Recreate the layout, hover and opening and
            closing motion. Compare the result at the same size.”
          </p>
        </article>
        <article>
          <span>TAKE INSPIRATION</span>
          <p>
            “Study how this menu stays anchored. Use that behavior in our
            collection picker, with our own content and identity.”
          </p>
        </article>
      </div>
    </section>
  );
}
function Install() {
  return (
    <section className="install" id="install">
      <span className="kicker">START WITH ONE COMMAND</span>
      <h2>
        Your next project.
        <br />
        With a better eye.
      </h2>
      <p>Install all five skills, then ask your agent to use Seenry.</p>
      <div className="command">
        <code>{command}</code>
        <CopyButton />
      </div>
      <div className="install-links">
        <a href={repo}>
          View on GitHub <ArrowUpRight size={15} />
        </a>
        <a href="https://seenry.design/mcp">
          Set up MCP <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="install-note">
        <Check size={15} /> Open source <span>·</span> Works without MCP{" "}
        <span>·</span> Bring your own coding agent
      </div>
    </section>
  );
}
function App() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id)
      document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <a className="wordmark" href="/">
          seenry.<span>skills</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#playground">Playground</a>
          <a href="#mcp">Skills + MCP</a>
          <a href="#install" className="nav-install">
            Install <ArrowDown />
          </a>
        </nav>
      </header>
      <main id="main">
        <Showcase
          {...{
            MotionDemo,
            AssetSection,
            BrandSection,
            DeckSection,
            VideoDemo,
            Reconstruction,
            DesignPreview,
            Switch,
            Art,
            CopyButton,
          }}
        />
      </main>
      <footer>
        <div>
          <a className="wordmark" href="https://seenry.design">
            seenry.
          </a>
          <p>Open-source design guidance. Working examples.</p>
        </div>
        <div>
          <a href="https://seenry.design">
            Design library <ArrowUpRight size={15} />
          </a>
          <a href={repo}>
            Source code <ArrowUpRight size={15} />
          </a>
          <a href="mailto:support@seenry.design">Contact</a>
        </div>
        <small>
          © {new Date().getFullYear()} Seenry. Skills licensed under MIT.
        </small>
      </footer>
    </MotionConfig>
  );
}
function ArrowDown() {
  return <span aria-hidden="true">↓</span>;
}
createRoot(document.getElementById("root")).render(<App />);
