import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Check,
  X,
  Copy,
  Search,
  Image,
  Type,
  Layers,
} from "lucide-react";
import { createNumberTransition } from "../../skills/seenry-motion/assets/number-transition.mjs";
const spring = { type: "spring", stiffness: 420, damping: 32 };
function Disclosure() {
  const [open, set] = useState(false);
  return (
    <div className="example-disclosure">
      <button onClick={() => set(!open)} aria-expanded={open}>
        Export settings
        <motion.span animate={{ rotate: open ? 45 : 0 }}>
          <Plus size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="disclosure-content"
          >
            <p>Keep the original dimensions.</p>
            <label>
              <input type="checkbox" defaultChecked /> Include source
              information
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function PageTransition() {
  const [detail, set] = useState(false);
  return (
    <div className="page-example">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={String(detail)}
          initial={{ x: detail ? 35 : -35, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: detail ? -35 : 35, opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {detail ? (
            <>
              <button onClick={() => set(false)}>
                <ArrowLeft size={16} /> Collections
              </button>
              <h4>Everyday objects</h4>
              <p>12 references · Private collection</p>
              <div className="mini-objects">
                <i />
                <i />
                <i />
              </div>
            </>
          ) : (
            <>
              <span className="demo-label">YOUR COLLECTIONS</span>
              <button className="collection-row" onClick={() => set(true)}>
                <span className="collection-art" />
                <span>
                  Everyday objects<small>12 references</small>
                </span>
                <ArrowRight size={17} />
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
function Numbers() {
  const [n, set] = useState(99);
  const slot = useRef(null);
  const renderer = useRef(null);
  useEffect(() => {
    renderer.current = createNumberTransition({
      slot: slot.current,
      value: 99,
      reserveValues: [0, 99, 100, 999],
      duration: 480,
      align: "end",
    });
    return () => renderer.current?.destroy();
  }, []);
  useEffect(() => renderer.current?.update(n), [n]);
  return (
    <div className="number-example">
      <div className="number-display">
        <span ref={slot}>99</span>
        <small>references</small>
      </div>
      <div className="number-actions">
        <button
          aria-label="Decrease references"
          disabled={n === 0}
          onClick={() => set((v) => Math.max(0, v - 1))}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="demo-action"
          onClick={() => set((v) => (v === 99 ? 100 : 99))}
        >
          99 ↔ 100
        </button>
        <button
          aria-label="Increase references"
          disabled={n === 999}
          onClick={() => set((v) => Math.min(999, v + 1))}
        >
          <Plus size={16} />
        </button>
      </div>
      <span className="sr-only" role="status">
        {n} references
      </span>
    </div>
  );
}
function Notifications() {
  const [state, set] = useState({ items: [], leaving: null });
  const serial = useRef(0);
  const trigger = useRef();
  const [message, announce] = useState("");
  function add() {
    const id = ++serial.current;
    set((s) => ({
      items: [id, ...s.items].slice(0, 3),
      leaving: s.items.length === 3 ? { id: s.items[2], index: 2 } : s.leaving,
    }));
    announce(`Reference ${id} added to collection`);
  }
  function dismiss(id) {
    trigger.current?.focus();
    set((s) => ({
      items: s.items.filter((x) => x !== id),
      leaving: { id, index: s.items.indexOf(id) },
    }));
  }
  const row = (id, index, leaving = false) => (
    <motion.div
      key={(leaving ? "exit-" : "") + id}
      aria-hidden={leaving || undefined}
      style={{
        zIndex: leaving ? 0 : 4 - index,
        pointerEvents: leaving ? "none" : undefined,
      }}
      initial={
        leaving
          ? { opacity: 1, y: -index * 62, scale: 1 }
          : { opacity: 0, y: 36, scale: 0.94 }
      }
      animate={
        leaving
          ? { opacity: 0, y: -index * 62, x: 36, scale: 0.96 }
          : { opacity: 1, y: -index * 62, scale: 1 }
      }
      transition={
        leaving
          ? { duration: 0.18 }
          : { type: "spring", stiffness: 460, damping: 38 }
      }
      onAnimationComplete={() => {
        if (leaving)
          set((s) => (s.leaving?.id === id ? { ...s, leaving: null } : s));
      }}
    >
      <Check size={16} />
      <span>
        <strong>Reference saved</strong>
        <small>Added to Collection · {id}</small>
      </span>
      {!leaving && (
        <button
          aria-label={`Dismiss notification ${id}`}
          onClick={() => dismiss(id)}
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
  return (
    <div className="notice-example">
      <div className="notice-stack">
        {state.leaving && row(state.leaving.id, state.leaving.index, true)}
        {state.items.map((id, index) => row(id, index))}
      </div>
      <button ref={trigger} className="demo-action" onClick={add}>
        Show notification <Plus size={15} />
      </button>
      <span className="sr-only" role="status">
        {message}
      </span>
    </div>
  );
}
function Hover() {
  const [open, set] = useState(false),
    [selected, select] = useState(0);
  const names = ["Architecture", "Objects", "Typography"];
  return (
    <div
      className="collection-preview"
      onPointerEnter={() => set(true)}
      onPointerLeave={() => set(false)}
      onFocus={() => set(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) set(false);
      }}
    >
      <div className="fan-cards">
        {names.map((name, i) => (
          <button
            key={name}
            aria-label={`Preview ${name}`}
            aria-pressed={selected === i}
            onClick={() => {
              select(i);
              set(true);
            }}
          >
            <motion.span
              className="fan-surface"
              animate={{
                x: open ? 0 : -(i - 1) * 78,
                y: open && selected === i ? -12 : Math.abs(i - 1) * 4,
                rotate: (i - 1) * (open ? 6 : 9),
                scale: open && selected === i ? 1.04 : 1,
              }}
              transition={spring}
              style={{ zIndex: open ? i + 1 : 3 - i }}
            >
              <span className={"fan-art fan-art-" + i}>
                <i />
                <i />
                <i />
              </span>
              <span className="fan-name">{name}</span>
            </motion.span>
          </button>
        ))}
      </div>
      <div className="collection-caption">
        <strong>{open ? names[selected] : "Studio collection"}</strong>
        <span>
          {open ? "Select a card to preview" : "Hover or focus to browse"}
        </span>
      </div>
    </div>
  );
}
function Anatomy() {
  const [guides, set] = useState(false);
  return (
    <div className={"anatomy-example " + (guides ? "has-guides" : "")}>
      <button
        className="anatomy-toggle"
        aria-pressed={guides}
        onClick={() => set(!guides)}
      >
        {guides ? "Hide guides" : "Show layout guides"}
      </button>
      <div className="anatomy-layout">
        <div className="anatomy-picture">
          <span>01</span>
        </div>
        <div className="anatomy-copy">
          <small>OBJECT STUDY</small>
          <h3>Form follows function.</h3>
          <p>
            One image, one reading edge. Detail stays close to the thing it
            describes.
          </p>
          <span>View study ↗</span>
        </div>
      </div>
      <p className="anatomy-note">
        {guides
          ? "24px inset · 16px gutter · shared text edge"
          : "A two-column composition with a shared baseline."}
      </p>
    </div>
  );
}
function Scroll() {
  const [p, set] = useState(0);
  return (
    <div
      className="scroll-example"
      tabIndex={0}
      aria-label="Scrollable transition example"
      onScroll={(e) =>
        set(
          e.currentTarget.scrollTop /
            (e.currentTarget.scrollHeight - e.currentTarget.clientHeight),
        )
      }
    >
      <div className="scroll-track">
        <div className="scroll-scene">
          <span className="demo-label">SCROLL INSIDE THIS FRAME ↓</span>
          <div className="scroll-objects">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  transform: `translate(${(i - 1) * (76 - 48 * p)}px,${-p * 25 + Math.abs(i - 1) * 15}px) rotate(${(i - 1) * (24 - 20 * p)}deg)`,
                  background: ["#d0d0d0", "#aaaaaa", "#e4e4e4"][i],
                }}
              >
                <Layers size={26} />
              </div>
            ))}
          </div>
          <span>
            {p > 0.8 ? "A single collection." : "Three separate references."}
          </span>
          <div className="scroll-progress">
            <i style={{ width: `${p * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
function Toggle() {
  const [on, set] = useState(false);
  return (
    <div className="toggle-example">
      <button
        role="switch"
        aria-checked={on}
        aria-label="Enable example notifications"
        onClick={() => set(!on)}
        className={on ? "is-on" : ""}
      >
        <motion.span animate={{ x: on ? 26 : 0 }} transition={spring} />
      </button>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={String(on)}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          {on ? "Notifications on" : "Notifications off"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
function Sources() {
  const [q, set] = useState("sculptural objects");
  return (
    <div className="source-example">
      <form
        action="https://unsplash.com/s"
        method="GET"
        onSubmit={(e) => {
          e.preventDefault();
          window.open(
            "https://unsplash.com/s/photos/" +
              encodeURIComponent(q.trim() || "design"),
            "_blank",
            "noopener,noreferrer",
          );
        }}
      >
        <label htmlFor="photo-query">Find photography for a project</label>
        <div>
          <Search size={17} />
          <input
            id="photo-query"
            value={q}
            onChange={(e) => set(e.target.value)}
            placeholder="What does the image need to show?"
          />
          <button aria-label="Search photographs on Unsplash">
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
      <div className="source-links">
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
          Unsplash · License ↗
        </a>
        <a
          href="https://www.pexels.com/license/"
          target="_blank"
          rel="noreferrer"
        >
          Pexels · License ↗
        </a>
      </div>
      <p>
        Opens the provider’s search. Choose a photo, check its license, then
        test the crop.
      </p>
    </div>
  );
}
function TypeDemo() {
  const [weight, set] = useState("Regular");
  return (
    <div className="type-example">
      <p
        style={{
          fontWeight:
            weight === "Regular" ? 400 : weight === "Medium" ? 500 : 700,
        }}
      >
        Good type.
        <br />
        Every detail.
      </p>
      <div className="weight-options">
        {["Regular", "Medium", "Bold"].map((x) => (
          <button aria-pressed={x === weight} key={x} onClick={() => set(x)}>
            {x}
          </button>
        ))}
      </div>
      <a
        href="https://github.com/lauridskern/open-runde"
        target="_blank"
        rel="noreferrer"
      >
        Open Runde · Source & OFL license ↗
      </a>
    </div>
  );
}
function Compare({ DesignPreview, Switch }) {
  const [m, set] = useState("After");
  return (
    <div className="gallery-compare">
      <Switch
        items={["Before", "After"]}
        value={m}
        onChange={set}
        label="Compare layout"
      />
      <DesignPreview before={m === "Before"} />
    </div>
  );
}
function Crop({ Art, Switch }) {
  const [c, set] = useState("Square");
  return (
    <div className="crop-example">
      <motion.div
        layout
        transition={spring}
        className="crop-art"
        style={{
          width: c === "Portrait" ? 145 : 230,
          height: c === "Landscape" ? 140 : 205,
        }}
      >
        <Art type={1} />
      </motion.div>
      <Switch
        items={["Square", "Portrait", "Landscape"]}
        value={c}
        onChange={set}
        label="Asset crop"
      />
    </div>
  );
}
export default function Showcase({
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
}) {
  const [category, set] = useState("All");
  const [query, search] = useState("");
  const categories = [
    "All",
    "Motion",
    "Design",
    "Assets",
    "Video",
    "Branding",
    "Decks",
    "MCP",
  ];
  const demos = [
    {
      title: "Layout anatomy",
      cat: "Design",
      desc: "Inspect the composition: columns, inset, gutter and reading edge.",
      el: <Anatomy />,
    },
    {
      title: "Anchored popover",
      cat: "Motion",
      desc: "Open, switch and close. The trigger stays in place.",
      el: <MotionDemo />,
    },
    {
      title: "View transitions",
      cat: "Motion",
      desc: "Move into a collection and back without losing context.",
      el: <PageTransition />,
    },
    {
      title: "Expanding content",
      cat: "Motion",
      desc: "A disclosure with a measured opening and closing.",
      el: <Disclosure />,
    },
    {
      title: "Rolling numbers",
      cat: "Motion",
      desc: "Place-value rolls with stable units. Try 99 → 100 and reverse mid-roll.",
      el: <Numbers />,
    },
    {
      title: "Notification stack",
      cat: "Motion",
      desc: "Three visible messages. Rapid additions keep the control and frame still.",
      el: <Notifications />,
    },
    {
      title: "Collection preview",
      cat: "Motion",
      desc: "Open a card fan, then choose a reference. Keyboard and touch work too.",
      el: <Hover />,
    },
    {
      title: "Scroll choreography",
      cat: "Motion",
      desc: "Scrub a composition with actual scroll progress.",
      el: <Scroll />,
    },
    {
      title: "Toggle & label",
      cat: "Motion",
      desc: "State feedback with a spring and a short text transition.",
      el: <Toggle />,
    },
    {
      title: "Website before / after",
      cat: "Design",
      desc: "An authored layout study. Same brief, different decisions.",
      wide: true,
      el: <Compare {...{ DesignPreview, Switch }} />,
    },
    {
      title: "Search for images",
      cat: "Assets",
      desc: "Source existing photography. Generation is one option, not the default.",
      el: <Sources />,
    },
    {
      title: "Choose typography",
      cat: "Assets",
      desc: "Real font files, real weights, with the source preserved.",
      el: <TypeDemo />,
    },
    {
      title: "Test the crop",
      cat: "Assets",
      desc: "Check framing before placing an image in the final layout.",
      el: <Crop {...{ Art, Switch }} />,
    },
    {
      title: "Original artwork",
      cat: "Assets",
      desc: "Create code-native illustrations or use an image generator when needed.",
      el: <AssetSection />,
    },
    {
      title: "Study a recording",
      cat: "Video",
      desc: "Play and scrub the original Kopp reference to inspect its behavior.",
      el: <VideoDemo />,
      dark: true,
    },
    {
      title: "Reference reconstruction",
      cat: "MCP",
      desc: "Our author-assisted Kopp study. Open either menu and try the hover.",
      el: <Reconstruction />,
      dark: true,
    },
    {
      title: "A consistent identity",
      cat: "Branding",
      desc: "Change a palette across the whole system.",
      el: <BrandSection />,
    },
    {
      title: "A slide sequence",
      cat: "Decks",
      desc: "Move from an idea to evidence to an invitation.",
      el: <DeckSection />,
    },
  ];
  const visible = demos.filter(
    (d) =>
      (category === "All" || category === d.cat) &&
      `${d.title} ${d.desc} ${d.cat}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="showcase-intro">
        <div>
          <h1>The Seenry workshop</h1>
          <p>
            Working studies in layout, motion and visual design. Open an example
            and try changing it.
          </p>
        </div>
        <div className="quick-install">
          <code>npx skills add ayangabryl/seenry-skills</code>
          <CopyButton />
          <a href="https://github.com/ayangabryl/seenry-skills">
            Five open-source skills <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
      <section className="showcase-library" id="playground">
        <div className="showcase-tools">
          <Switch
            items={categories}
            value={category}
            onChange={set}
            label="Filter examples"
          />
          <label className="demo-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Find an example"
              aria-label="Find an example"
            />
            {query && (
              <button
                onClick={() => search("")}
                aria-label="Clear example search"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
        <div className="example-count" aria-live="polite">
          {visible.length} interactive examples{" "}
          <span>Original implementations · Try the controls</span>
        </div>
        <div className="showcase-grid">
          {visible.map((d) => (
            <article
              className={
                "showcase-card " +
                (d.wide ? "wide " : "") +
                (d.dark ? "dark-demo" : "")
              }
              key={d.title}
            >
              <div className="example-stage">{d.el}</div>
              <div className="example-info">
                <div>
                  <h2>{d.title}</h2>
                  <p>{d.desc}</p>
                </div>
                <span>{d.cat}</span>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <div className="demo-empty">
            <h2>No matching examples</h2>
            <button
              className="demo-action"
              onClick={() => {
                search("");
                set("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
      <section className="mcp-notes" id="mcp">
        <h2>What MCP adds</h2>
        <div>
          <p>
            The skills guide the work. Seenry MCP supplies real website screens,
            app flows, sections, brand references, decks and recordings to
            inspect.
          </p>
          <p>
            <strong>Recreate:</strong> measure the reference, build, compare and
            refine.
            <br />
            <strong>Take inspiration:</strong> carry a useful principle into an
            original interface.
          </p>
          <p>
            Video support means finding footage, inspecting recorded
            interactions and integrating players. It does not mean generating
            videos.
          </p>
          <a className="primary" href="https://seenry.design/mcp">
            Connect Seenry MCP <ArrowUpRight size={16} />
          </a>
          <small>
            Skills work without MCP. Library access follows your Seenry plan.
          </small>
        </div>
      </section>
      <section className="showcase-install" id="install">
        <h2>Use Seenry in your next project.</h2>
        <CopyButton />
        <a href="https://github.com/ayangabryl/seenry-skills/tree/main/skills">
          Read the skills <ArrowUpRight size={16} />
        </a>
        <p>
          Examples demonstrate guidance, not guaranteed model output. Source
          reconstruction limitations are documented in the{" "}
          <a href="/demos/liquid-popover/NOTICE.md">study notes</a>.
        </p>
      </section>
    </>
  );
}
