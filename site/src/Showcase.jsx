import {
  ResponsiveStudio,
  FormFlow,
  SharedSelection,
  OperationFeedback,
  BrandApplications,
  DeckNarrative,
} from "./CapabilityDemos";
import {
  createNotificationState,
  notificationEvent,
} from "../../skills/seenry-motion/assets/notification-state.mjs";
import React, { useState, useRef, useEffect, useReducer } from "react";
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
  const [state, dispatch] = useReducer(
    notificationEvent,
    3,
    createNotificationState,
  );
  const trigger = useRef();
  function add() {
    dispatch({ type: "add", content: "Reference saved" });
  }
  function dismiss(id) {
    trigger.current?.focus();
    dispatch({ type: "dismiss", id });
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
        if (leaving) dispatch({ type: "exit-finished", id });
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
        {state.items.map((item, index) => row(item.id, index))}
      </div>
      <button ref={trigger} className="demo-action" onClick={add}>
        Show notification <Plus size={15} />
      </button>
      <span className="sr-only" role="status">
        {state.sequence
          ? `Reference ${state.sequence} added to collection`
          : ""}
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
  const [aligned, setAligned] = useState(true);
  const [added, setAdded] = useState(false);
  return (
    <div className="layout-study">
      <div
        className="layout-study-switch"
        role="group"
        aria-label="Layout comparison"
      >
        <button aria-pressed={!aligned} onClick={() => setAligned(false)}>
          Ungrouped
        </button>
        <button aria-pressed={aligned} onClick={() => setAligned(true)}>
          Refined
        </button>
      </div>
      <div className={"session-card " + (aligned ? "refined" : "ungrouped")}>
        <div className="session-art" aria-hidden="true">
          <span>Aa</span>
          <small>STUDIO SESSIONS / 01</small>
        </div>
        <div className="session-copy">
          <span className="session-category">Live workshop</span>
          <h4>Designing with type</h4>
          <p>
            Hierarchy, rhythm and the details that make text easier to read.
          </p>
          <dl>
            <div>
              <dt>When</dt>
              <dd>Thursday, 14:00</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>45 minutes · Online</dd>
            </div>
          </dl>
          <button onClick={() => setAdded(!added)} aria-pressed={added}>
            {added ? "Added to demo calendar" : "Add to calendar"}{" "}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <p className="layout-study-note">
        {aligned
          ? "One reading edge. Related details together. A clear next action."
          : "Same content, competing alignments and disconnected details."}
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
  const [selectedExamples, selectExample] = useState({});
  const demos = [
    {
      title: "Responsive website",
      cat: "Design",
      desc: "Switch the viewport, search the collection, open an object and save it. A working interface, not a static mockup.",
      el: <ResponsiveStudio Art={Art} />,
    },
    {
      title: "Onboarding flow",
      cat: "Design",
      desc: "Try an empty submission, move between steps and complete the example. Your input stays local.",
      el: <FormFlow />,
    },
    {
      title: "Coordinated transitions",
      cat: "Motion",
      desc: "Switch the period. The selection, heading and chart stay connected through rapid changes.",
      el: <SharedSelection />,
    },
    {
      title: "Loading to success",
      cat: "Motion",
      desc: "A simulated operation with stable button dimensions, progress and a clear completion state.",
      el: <OperationFeedback />,
    },
    {
      title: "Identity in use",
      cat: "Branding",
      desc: "The same identity across a poster, business card and label. Switch the entire set between light and dark.",
      el: <BrandApplications />,
    },
    {
      title: "Narrative structure",
      cat: "Decks",
      desc: "Context, evidence, proposal. Inspect how a slide’s role changes its composition and message.",
      el: <DeckNarrative />,
    },
    {
      title: "Spacing & hierarchy",
      cat: "Design",
      desc: "Compare the same content with scattered and deliberate grouping. The difference is in the relationships.",
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
      desc: "Play and scrub the original reference to inspect its behavior.",
      el: <VideoDemo />,
      dark: true,
    },
    {
      title: "Reference reconstruction",
      cat: "MCP",
      desc: "Our reference reconstruction. Open either menu and try the hover.",
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
  const chapters = [
    {
      id: "seenry",
      name: "Seenry",
      description: "Design a complete interface.",
      body: "Work from the content and the task: establish hierarchy, compare layouts, choose typography and assets, then build and review the result.",
      capabilities: [
        "Layout & alignment",
        "Typography & color",
        "Responsive interfaces",
        "Reference reconstruction",
      ],
      categories: ["Design"],
    },
    {
      id: "motion",
      name: "Seenry Motion",
      description: "Make state changes easy to follow.",
      body: "Plan what stays still, what moves and how an interaction responds when interrupted. Try navigation, disclosure, values, feedback and scroll-driven compositions below.",
      capabilities: [
        "Menus & surfaces",
        "Navigation & transitions",
        "Numbers & feedback",
        "Hover & scroll",
      ],
      categories: ["Motion"],
    },
    {
      id: "assets",
      name: "Seenry Assets",
      description: "Find the right material for the design.",
      body: "Search for existing photography, choose licensed type and icons, create original artwork when needed, and check the framing. Video sourcing and playback belong here too.",
      capabilities: [
        "Image search",
        "Fonts & icons",
        "Original artwork",
        "Video & responsive media",
      ],
      categories: ["Assets"],
    },
    {
      id: "branding",
      name: "Seenry Branding",
      description: "Keep the identity consistent.",
      body: "Research brand references and turn decisions about type, color, imagery and components into usable project guidelines.",
      capabilities: ["Identity research", "Palette & type", "Brand guidelines"],
      categories: ["Branding"],
    },
    {
      id: "decks",
      name: "Seenry Decks",
      description: "Build a clear visual sequence.",
      body: "Study reference decks in order, identify each slide’s role and shape a presentation around its narrative—not a set of disconnected layouts.",
      capabilities: ["Deck research", "Slide order", "Narrative & hierarchy"],
      categories: ["Decks"],
    },
  ];
  function card(d) {
    return (
      <article
        className={"showcase-card " + (d.dark ? "dark-demo" : "")}
        key={d.title}
      >
        <div className="example-stage">{d.el}</div>
        <div className="example-info">
          <div>
            <h3>{d.title}</h3>
            <p>{d.desc}</p>
          </div>
        </div>
      </article>
    );
  }
  return (
    <>
      <section className="showcase-intro">
        <div>
          <span className="intro-label">Seenry Skills · Open source</span>
          <h1>
            Design skills for
            <br className="intro-break" /> coding agents.
          </h1>
          <p>
            Give your agent a design workflow: study references, build the
            interface, refine the details. Five skills cover websites, motion,
            assets, branding and presentations.
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
      <div id="playground" className="skill-sequence">
        <nav className="skill-index" aria-label="Skills">
          {chapters.map((c) => (
            <a key={c.id} href={"#" + c.id}>
              {c.name.replace("Seenry ", "")}
            </a>
          ))}
          <a href="#mcp">Skill + MCP</a>
        </nav>
        {chapters.map((c, chapterIndex) => {
          const examples = demos
            .filter((d) => c.categories.includes(d.cat))
            .sort((a, b) =>
              c.id === "seenry"
                ? a.title === "Responsive website"
                  ? -1
                  : b.title === "Responsive website"
                    ? 1
                    : 0
                : c.id === "assets"
                  ? a.title === "Original artwork"
                    ? -1
                    : b.title === "Original artwork"
                      ? 1
                      : 0
                  : 0,
            );
          const selected = selectedExamples[c.id] || examples[0].title;
          const example =
            examples.find((d) => d.title === selected) || examples[0];
          return (
            <section
              className={"skill-chapter chapter-" + c.id}
              id={c.id}
              key={c.id}
            >
              <div className="chapter-heading">
                <span className="chapter-number">0{chapterIndex + 1}</span>
                <h2>{c.name}</h2>

                <p>
                  {c.id === "seenry"
                    ? "The core design skill. It helps your agent turn a brief into an interface: choose a layout, establish type and spacing, then build and check responsive states."
                    : c.id === "motion"
                      ? "Make interactions feel connected. The motion skill guides timing, easing, hover, scrolling and transitions—including what happens when you change your mind halfway through."
                      : c.id === "assets"
                        ? "Find the material a design needs. Search for photography, select fonts and icons, generate original artwork when useful, and integrate images or video with the right crop."
                        : c.id === "branding"
                          ? "Build a visual identity that holds together. Research references and define how type, color, imagery and components work across a project."
                          : "Shape a presentation around its story. Study reference decks, give each slide a role, and carry a consistent visual system through the sequence."}
                </p>
                <div
                  className="example-picker"
                  role="group"
                  aria-label={c.name + " examples"}
                >
                  {examples.map((d) => (
                    <button
                      key={d.title}
                      aria-pressed={d.title === selected}
                      onClick={() =>
                        selectExample((prev) => ({ ...prev, [c.id]: d.title }))
                      }
                    >
                      {d.title}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
                <a
                  className="chapter-source"
                  href={
                    "https://github.com/ayangabryl/seenry-skills/tree/main/skills/" +
                    (c.id === "seenry" ? "seenry" : "seenry-" + c.id)
                  }
                >
                  Read the skill <ArrowUpRight size={14} />
                </a>
              </div>
              <div className="chapter-examples" aria-live="polite">
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {card(example)}
                </motion.div>
                <div className="skill-prompt">
                  <span>Try it with your agent</span>
                  <p>
                    {c.id === "seenry"
                      ? "Use Seenry to redesign this page. Compare layouts, refine the typography, and check it on mobile."
                      : c.id === "motion"
                        ? "Use Seenry Motion to refine these interactions. Keep controls stable and test rapid clicks, keyboard use and reduced motion."
                        : c.id === "assets"
                          ? "Use Seenry Assets to find images and type for this project. Keep their sources and licenses, and test the crops."
                          : c.id === "branding"
                            ? "Use Seenry Branding to define a visual identity for this project, with usable rules for type, color and imagery."
                            : "Use Seenry Decks to research a presentation structure for this brief. Explain each slide’s role before building the sequence."}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <section className="mcp-notes" id="mcp">
        <h2>Build from a reference.</h2>
        <div>
          <p>
            Connect Seenry to inspect real screens and recordings inside your
            coding agent. Recreate a reference or use it to guide an original
            design.
          </p>
          <a className="primary" href="https://seenry.design/mcp">
            Connect Seenry MCP <ArrowUpRight size={16} />
          </a>
          <small>
            Skills work without MCP. Library access follows your Seenry plan.
          </small>
        </div>
        <div className="chapter-examples proof-examples">
          {demos.filter((d) => ["Video", "MCP"].includes(d.cat)).map(card)}
        </div>
        <a
          className="full-study-link"
          href="/demos/liquid-popover/index.html"
          target="_blank"
          rel="noreferrer"
        >
          Open the interactive study at full size <ArrowUpRight size={15} />
        </a>
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
