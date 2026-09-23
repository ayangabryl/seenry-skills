import React, { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Copy,
  Plus,
  Minus,
  ArrowLeft,
  Mail,
  RotateCcw,
} from "lucide-react";
import { createNumberTransition } from "../../skills/seenry-motion/assets/number-transition.mjs";
import { BrandApplications, DeckNarrative } from "./CapabilityDemos";
import "./reading-site.css";
const repository = "https://github.com/ayangabryl/seenry-skills";
const command = "npx skills add ayangabryl/seenry-skills";
function CopyInstall() {
  const [state, setState] = useState("Copy install command");
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      aria-label={state}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(command);
          setState("Copied");
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => setState("Copy install command"),
            1800,
          );
        } catch {
          setState("Select the command to copy");
        }
      }}
    >
      {state === "Copied" ? <Check size={16} /> : <Copy size={16} />}
      <span className="r-sr" role="status">
        {state}
      </span>
    </button>
  );
}
function Section({ id, title, children, description }) {
  return (
    <section className="r-section" id={id}>
      <h2>
        <a href={"#" + id}>{title}</a>
        <a
          className="r-source"
          aria-label={"Read " + title + " skill"}
          href={repository + "/tree/main/skills/" + id}
        >
          <ArrowUpRight size={16} />
        </a>
      </h2>
      <p className="r-description">{description}</p>
      {children}
    </section>
  );
}
function ComparisonChoice({ after, setAfter, label }) {
  return (
    <div className="r-comparison-tools">
      <span>{label}</span>
      <div role="group" aria-label={label + " version"}>
        <button aria-pressed={!after} onClick={() => setAfter(false)}>
          Starting point
        </button>
        <button aria-pressed={after} onClick={() => setAfter(true)}>
          With Seenry
        </button>
      </div>
    </div>
  );
}
function InterfaceStudy() {
  const [after, setAfter] = useState(true);
  const [saved, setSaved] = useState(false);
  return (
    <figure className="r-demo r-comparison">
      <ComparisonChoice
        after={after}
        setAfter={setAfter}
        label="A saved collection"
      />
      <div className={"r-collection " + (after ? "refined" : "default")}>
        <div className="r-collection-top">
          <span>seenry.</span>
          <span>Collection / 03 references</span>
        </div>
        <div className="r-collection-title">
          <div>
            <h3>Type worth saving.</h3>
            <p>Three studies in scale, rhythm and contrast.</p>
          </div>
          <button
            aria-label={saved ? "Unsave collection" : "Save collection"}
            aria-pressed={saved}
            onClick={() => setSaved(!saved)}
          >
            {saved ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>
        <div className="r-reference-samples">
          <div>
            <div className="r-cover r-cover-editorial">
              <span>01 / Editorial</span>
              <strong>
                Aa<span>—</span>
              </strong>
              <small>Form follows reading.</small>
            </div>
            <h4>Editorial</h4>
            <p>Scale & hierarchy</p>
          </div>
          <div>
            <div className="r-cover r-cover-poster">
              <span>02 / Poster</span>
              <strong>
                TYPE
                <br />
                IN
                <br />
                FORM.
              </strong>
              <small>A study in contrast</small>
            </div>
            <h4>Poster</h4>
            <p>Weight & contrast</p>
          </div>
          <div>
            <div className="r-cover r-cover-index">
              <span>03 / Index</span>
              <strong>
                abc
                <br />
                def
                <br />
                ghi<span>↗</span>
              </strong>
              <small>Letters in a grid</small>
            </div>
            <h4>Index</h4>
            <p>Rhythm & alignment</p>
          </div>
        </div>
        <div className="r-collection-footer">
          <span>Original type studies</span>
          <span role="status">
            {saved ? "Saved to your collection" : "Curated in Seenry"}
          </span>
        </div>
      </div>
      <figcaption>
        Same studies and controls. Compare the grouping, proportions and reading
        order.
      </figcaption>
    </figure>
  );
}
function TypographyStudy() {
  const [after, setAfter] = useState(true);
  return (
    <figure className="r-demo r-comparison">
      <ComparisonChoice
        after={after}
        setAfter={setAfter}
        label="A type specimen"
      />
      <div className={"r-type-study " + (after ? "refined" : "default")}>
        <span>TYPE NOTES / 001</span>
        <h3>
          Open Runde<span className="r-type-period">.</span>
        </h3>
        <p>
          A rounded sans serif by Laurids Kern. Soft terminals, open counters,
          and four weights for interfaces that need to read clearly.
        </p>
        <div className="r-type-weights">
          <span>Regular</span>
          <span>Medium</span>
          <span>Semibold</span>
          <span>Bold</span>
        </div>
        <a
          className="r-type-link"
          href="https://github.com/lauridskern/open-runde"
        >
          Explore the typeface <ArrowUpRight size={14} />
        </a>
      </div>
      <figcaption>
        One typeface. A deliberate scale, readable line length and useful
        contrast.
      </figcaption>
    </figure>
  );
}
function MotionStudy() {
  const [state, setState] = useState("closed"),
    [email, setEmail] = useState(""),
    [error, setError] = useState(false);
  const trigger = useRef(),
    restoreFocus = useRef(false),
    field = useRef();
  const close = () => {
    restoreFocus.current = true;
    setState("closed");
  };
  return (
    <figure className="r-demo">
      <div
        className="r-motion-stage"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === "closed" ? (
            <motion.button
              ref={(el) => {
                trigger.current = el;
                if (el && restoreFocus.current) {
                  el.focus();
                  restoreFocus.current = false;
                }
              }}
              className="r-primary"
              key="closed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.14 }}
              onClick={() => setState("open")}
            >
              <Plus size={17} /> Invite a teammate
            </motion.button>
          ) : (
            <motion.div
              layout
              className="r-invite"
              key="panel"
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 430, damping: 32 }}
              onAnimationComplete={() => {
                if (state === "open") field.current?.focus();
              }}
            >
              {state === "sent" ? (
                <div className="r-invite-success">
                  <span>
                    <Check size={22} />
                  </span>
                  <h3>Invitation prepared</h3>
                  <p>{email}</p>
                  <button autoFocus className="r-primary" onClick={close}>
                    Done
                  </button>
                </div>
              ) : (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                      setError(true);
                      field.current?.focus();
                      return;
                    }
                    setError(false);
                    setState("sent");
                  }}
                >
                  <h3>Invite to Studio</h3>
                  <p>Give someone a place on your team.</p>
                  <label htmlFor="r-demo-email">Email address</label>
                  <input
                    ref={field}
                    id="r-demo-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(false);
                    }}
                    placeholder="alex@example.com"
                    aria-invalid={error}
                    aria-describedby="r-email-help"
                  />
                  <span
                    id="r-email-help"
                    className="r-field-help"
                    role="status"
                  >
                    {error
                      ? "Enter a valid email address."
                      : "Demo only. No invitation is sent."}
                  </span>
                  <div className="r-invite-actions">
                    <button type="button" onClick={close}>
                      Cancel
                    </button>
                    <button className="r-primary" type="submit">
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <figcaption>
        <span>Open, complete, close. Try Escape or repeat the action.</span>
        <span className="r-caption-tag">Surface transitions</span>
      </figcaption>
    </figure>
  );
}
function NumberStudy() {
  const [n, setN] = useState(99);
  const slot = useRef(),
    renderer = useRef();
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
    <figure className="r-demo">
      <div className="r-number-stage">
        <span className="r-number-title">Saved references</span>
        <div className="r-number-controls">
          <button
            aria-label="Decrease saved references"
            disabled={n === 0}
            onClick={() => setN((n) => Math.max(0, n - 1))}
          >
            <Minus size={17} />
          </button>
          <span ref={slot}>99</span>
          <button
            aria-label="Increase saved references"
            disabled={n === 999}
            onClick={() => setN((n) => Math.min(999, n + 1))}
          >
            <Plus size={17} />
          </button>
        </div>
        <span className="r-sr" role="status">
          {n} saved references
        </span>
      </div>
      <figcaption>
        <span>
          Individual digits roll. The surrounding controls stay still.
        </span>
        <button onClick={() => setN((n) => (n === 99 ? 100 : 99))}>
          99 ↔ 100
        </button>
      </figcaption>
    </figure>
  );
}
function AssetStudy({ Art }) {
  const [type, setType] = useState(1),
    [crop, setCrop] = useState(false);
  return (
    <figure className="r-demo">
      <div className="r-asset-stage">
        <div className={"r-art-window " + (crop ? "portrait" : "")}>
          <Art type={type} />
        </div>
        <div className="r-asset-tools">
          <span>Original artwork</span>
          <div role="group" aria-label="Artwork selection">
            {["Fold", "Orbit", "Letter"].map((s, i) => (
              <button
                key={s}
                aria-pressed={type === i}
                onClick={() => setType(i)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <figcaption>
        <span>Choose the material, then test its framing.</span>
        <button aria-pressed={crop} onClick={() => setCrop(!crop)}>
          {crop ? "Portrait" : "Square"}
          <RotateCcw size={14} />
        </button>
      </figcaption>
    </figure>
  );
}
export default function ReadingSite({ Art, VideoDemo, Reconstruction }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="reading-site">
        <a className="r-skip" href="#main">
          Skip to content
        </a>
        <header className="r-header">
          <a href="https://seenry.design" className="r-wordmark">
            seenry.<span>skills</span>
          </a>
          <a href={repository}>
            GitHub <ArrowUpRight size={14} />
          </a>
        </header>
        <main id="main">
          <div className="r-intro">
            <h1>
              Skills for building
              <br />
              better interfaces.
            </h1>
            <p>
              A collection of open-source skills for your coding agent. From
              layout and typography to motion, imagery and visual identity.
            </p>
            <div className="r-install" id="install">
              <code>{command}</code>
              <CopyInstall />
            </div>
            <div className="r-install-notes">
              <span>For agents that support skills</span>
              <a href={repository + "#readme"}>
                Installation guide <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <div id="playground">
            <Section
              id="seenry"
              title="Seenry"
              description={
                <>
                  The core design skill. Helps with{" "}
                  <strong>
                    layout, typography, spacing and responsive behavior
                  </strong>
                  —from the first composition to the final details. It studies
                  references, compares directions and checks the result in the
                  browser.
                </>
              }
            >
              <InterfaceStudy />
              <p className="r-between">
                The same content can feel very different when its hierarchy is
                deliberate. Type size, line length and spacing should support
                the reading order.
              </p>
              <TypographyStudy />
            </Section>
            <Section
              id="seenry-motion"
              title="Seenry Motion"
              description={
                <>
                  Makes state changes easier to follow. Covers{" "}
                  <strong>
                    menus, hover, navigation, scroll, numbers and feedback
                  </strong>
                  , with attention to timing, interruption, keyboard use and
                  reduced motion.
                </>
              }
            >
              <MotionStudy />
              <NumberStudy />
              <p className="r-footnote">
                These are interactive examples. Motion choices should suit the
                interface, rather than applying the same spring everywhere.
              </p>
            </Section>
            <Section
              id="seenry-assets"
              title="Seenry Assets"
              description={
                <>
                  Finds and integrates{" "}
                  <strong>
                    photography, fonts, icons, illustration and video
                  </strong>
                  . It can source existing material or create original artwork,
                  then check licensing, cropping and responsive fallbacks.
                </>
              }
            >
              <AssetStudy Art={Art} />
              <p className="r-footnote">
                The artwork above is an original SVG study. Image generation is
                another option—not a requirement. Existing assets keep their
                source and license information.
              </p>
              <div className="r-resource-links">
                <a href="https://unsplash.com">
                  Photography <ArrowUpRight size={13} />
                </a>
                <a href="https://github.com/lauridskern/open-runde">
                  Open Runde font <ArrowUpRight size={13} />
                </a>
                <a href="https://lucide.dev">
                  Lucide icons <ArrowUpRight size={13} />
                </a>
              </div>
            </Section>
            <Section
              id="seenry-branding"
              title="Seenry Branding"
              description={
                <>
                  Turns references and decisions into a usable identity. Defines{" "}
                  <strong>type, color, imagery and component rules</strong> so
                  the same brand holds together across different applications.
                </>
              }
            >
              <figure className="r-demo">
                <div className="r-brand-stage">
                  <BrandApplications />
                </div>
                <figcaption>
                  <span>One identity across a poster, card and label.</span>
                  <span className="r-caption-tag">Original study</span>
                </figcaption>
              </figure>
            </Section>
            <Section
              id="seenry-decks"
              title="Seenry Decks"
              description={
                <>
                  Studies presentations as a sequence. Helps with{" "}
                  <strong>narrative, slide roles and visual hierarchy</strong>,
                  keeping the argument clear from its opening context to the
                  final proposal.
                </>
              }
            >
              <figure className="r-demo">
                <div className="r-deck-stage">
                  <DeckNarrative />
                </div>
                <figcaption>
                  <span>Choose a slide to see its role in the story.</span>
                  <span className="r-caption-tag">Original study</span>
                </figcaption>
              </figure>
            </Section>
            <section className="r-section" id="mcp">
              <h2>
                With Seenry MCP
                <a
                  className="r-source"
                  href="https://seenry.design/mcp"
                  aria-label="Connect Seenry MCP"
                >
                  <ArrowUpRight size={16} />
                </a>
              </h2>
              <p className="r-description">
                The skills guide the work. MCP adds{" "}
                <strong>
                  real website screens, app flows and motion references
                </strong>{" "}
                for your agent to inspect. Recreate a reference, or carry its
                principles into a new design.
              </p>
              <div className="r-reference-pair">
                <figure className="r-demo">
                  <div className="r-reference-stage">
                    <VideoDemo />
                  </div>
                  <figcaption>
                    <span>Original · Kopp</span>
                    <span>Recording</span>
                  </figcaption>
                </figure>
                <figure className="r-demo">
                  <div className="r-reference-stage">
                    <Reconstruction />
                  </div>
                  <figcaption>
                    <span>Reconstruction</span>
                    <a href="/demos/liquid-popover/index.html">
                      Try at full size <ArrowUpRight size={13} />
                    </a>
                  </figcaption>
                </figure>
              </div>
              <p className="r-footnote">
                An author-assisted reconstruction.{" "}
                <a href="/demos/liquid-popover/NOTICE.md">
                  Read the study notes
                </a>
                . The skills work without MCP; library access follows your
                Seenry plan.
              </p>
            </section>
          </div>
          <section className="r-closing">
            <h2>Use the skills in your project.</h2>
            <p>
              Install the collection, then ask your agent to use the relevant
              Seenry skill with your brief.
            </p>
            <div className="r-install">
              <code>{command}</code>
              <CopyInstall />
            </div>
            <small>
              These authored examples demonstrate techniques, not guaranteed
              model output.
            </small>
          </section>
        </main>
        <footer className="r-footer">
          <a href="https://seenry.design">Seenry</a>
          <span>Open source · MIT</span>
          <a href={repository}>
            Source <ArrowUpRight size={13} />
          </a>
        </footer>
      </div>
    </MotionConfig>
  );
}
