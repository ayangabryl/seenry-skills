import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  ArrowLeft,
  Check,
  Search,
  Heart,
  Monitor,
  Smartphone,
  LoaderCircle,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import "./capability-demos.css";

const ease = [0.22, 1, 0.36, 1];
const objects = [
  { name: "Fold", type: "Paper", variant: "fold" },
  { name: "Orbit", type: "Sculpture", variant: "orbit" },
  { name: "Letter", type: "Typography", variant: "letter" },
];
export function ResponsiveStudio({ Art }) {
  const [compact, setCompact] = useState(false),
    [query, setQuery] = useState(""),
    [detail, setDetail] = useState(null),
    [saved, setSaved] = useState([]);
  const inputId = useId();
  return (
    <div className="cap-responsive">
      <div className="cap-toolbar" role="group" aria-label="Preview width">
        <span>Responsive collection</span>
        <button
          aria-label="Desktop preview"
          aria-pressed={!compact}
          onClick={() => setCompact(false)}
        >
          <Monitor size={15} />
        </button>
        <button
          aria-label="Mobile preview"
          aria-pressed={compact}
          onClick={() => setCompact(true)}
        >
          <Smartphone size={15} />
        </button>
      </div>
      <motion.div
        className={"studio-frame " + (compact ? "compact" : "")}
        animate={{ maxWidth: compact ? 300 : 720 }}
        transition={{ duration: 0.4, ease }}
      >
        <div className="studio-top">
          <strong>form / objects</strong>
          <span>{saved.length} saved</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {detail ? (
            <motion.div
              className="studio-detail"
              key={detail.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <button className="studio-back" onClick={() => setDetail(null)}>
                <ArrowLeft size={13} /> Collection
              </button>
              <div className="studio-object">
                <Art type={objects.indexOf(detail)} />
              </div>
              <div className="studio-detail-copy">
                <h4>{detail.name}</h4>
                <p>{detail.type} study · Edition 01</p>
                <button
                  className="cap-dark"
                  aria-pressed={saved.includes(detail.name)}
                  onClick={() =>
                    setSaved((s) =>
                      s.includes(detail.name)
                        ? s.filter((n) => n !== detail.name)
                        : [...s, detail.name],
                    )
                  }
                >
                  <Heart
                    size={13}
                    fill={saved.includes(detail.name) ? "currentColor" : "none"}
                  />
                  {saved.includes(detail.name) ? "Saved" : "Save object"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="studio-title">
                <h4>Objects worth keeping.</h4>
                <label htmlFor={inputId}>
                  <Search size={13} />
                  <input
                    id={inputId}
                    aria-label="Search example collection"
                    placeholder="Find an object"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="studio-grid">
                {objects
                  .filter((o) =>
                    (o.name + " " + o.type)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((o) => (
                    <button key={o.name} onClick={() => setDetail(o)}>
                      <div className="studio-object">
                        <Art type={objects.indexOf(o)} />
                      </div>
                      <strong>
                        {o.name}
                        <ArrowUpRight size={12} />
                      </strong>
                      <small>{o.type}</small>
                    </button>
                  ))}
              </div>
              {!objects.some((o) =>
                (o.name + " " + o.type)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && (
                <div className="studio-empty">
                  <p>No matching objects.</p>
                  <button onClick={() => setQuery("")}>Clear search</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
export function FormFlow() {
  const [step, setStep] = useState(0),
    [name, setName] = useState(""),
    [error, setError] = useState(false),
    [purpose, setPurpose] = useState("Website");
  const input = useRef();
  const uid = useId();
  function next(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError(true);
      input.current?.focus();
      return;
    }
    setError(false);
    setStep(1);
  }
  return (
    <div className="cap-form">
      <div className="cap-progress" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((n) => (
          <span key={n} className={n <= step ? "complete" : ""} />
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease }}
        >
          {step === 0 ? (
            <form onSubmit={next} noValidate>
              <span className="cap-eyebrow">01 / THE PROJECT</span>
              <h4>What are you working on?</h4>
              <p>Give this example project a name.</p>
              <label htmlFor={uid}>Project name</label>
              <input
                id={uid}
                ref={input}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(false);
                }}
                placeholder="e.g. Studio website"
                aria-invalid={error}
                aria-describedby={error ? uid + "-error" : undefined}
              />
              <div className="cap-error" id={uid + "-error"} role="status">
                {error ? "Enter a project name to continue." : " "}
              </div>
              <button className="cap-dark" type="submit">
                Continue <ArrowRight size={14} />
              </button>
            </form>
          ) : step === 1 ? (
            <>
              <span className="cap-eyebrow">02 / THE FORMAT</span>
              <h4>Choose a starting point.</h4>
              <div
                className="format-options"
                role="group"
                aria-label="Project format"
              >
                {["Website", "App interface", "Presentation"].map((x) => (
                  <button
                    key={x}
                    aria-pressed={purpose === x}
                    onClick={() => setPurpose(x)}
                  >
                    {x}
                    <span>{purpose === x ? <Check size={14} /> : null}</span>
                  </button>
                ))}
              </div>
              <div className="cap-actions">
                <button onClick={() => setStep(0)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button className="cap-dark" onClick={() => setStep(2)}>
                  Create example <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flow-success">
              <Check size={28} />
              <h4>{name}</h4>
              <p>{purpose} workspace created in this demo.</p>
              <button
                className="cap-dark"
                onClick={() => {
                  setStep(0);
                  setName("");
                  setError(false);
                }}
              >
                <RotateCcw size={14} /> Start again
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <small className="cap-local">
        Interactive example · Nothing is submitted
      </small>
    </div>
  );
}
export function SharedSelection() {
  const [active, setActive] = useState("Week");
  const uid = useId();
  const data = {
    Week: [28, 47, 35, 72, 52, 90, 68],
    Month: [48, 36, 67, 53, 85, 65, 94],
    Year: [30, 40, 48, 56, 62, 74, 88],
  };
  return (
    <div className="cap-analytics">
      <div className="cap-analytics-top">
        <div>
          <small>Studio activity</small>
          <h4>
            {active === "Week"
              ? "This week"
              : active === "Month"
                ? "This month"
                : "This year"}
          </h4>
        </div>
        <div className="cap-segment" role="group" aria-label="Activity period">
          {Object.keys(data).map((x) => (
            <button
              key={x}
              aria-pressed={active === x}
              onClick={() => setActive(x)}
            >
              {active === x && (
                <motion.span
                  layoutId={uid}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span>{x}</span>
            </button>
          ))}
        </div>
      </div>
      <div
        className="cap-bars"
        role="img"
        aria-label={`${active} example activity chart`}
      >
        {data[active].map((n, i) => (
          <motion.div
            key={i}
            animate={{ height: n + "%" }}
            transition={{
              type: "spring",
              stiffness: 170,
              damping: 24,
              delay: i * 0.025,
            }}
          >
            <span>{n}</span>
          </motion.div>
        ))}
      </div>
      <p>One selection. Indicator, heading and chart move together.</p>
    </div>
  );
}
export function OperationFeedback() {
  const [phase, setPhase] = useState("idle");
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function run() {
    clearTimeout(timer.current);
    setPhase("working");
    timer.current = setTimeout(() => setPhase("done"), 1600);
  }
  return (
    <div className="cap-operation">
      <div className="cap-file">
        <span>F</span>
        <div>
          <strong>Fold study</strong>
          <small>Collection / 3 objects</small>
        </div>
      </div>
      <motion.button
        className="cap-dark"
        layout
        onClick={phase === "done" ? () => setPhase("idle") : run}
        disabled={phase === "working"}
        aria-label={
          phase === "idle"
            ? "Run example export"
            : phase === "working"
              ? "Preparing example export"
              : "Reset example export"
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            className="cap-op-label"
            key={phase}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{ duration: 0.15 }}
          >
            {phase === "working" ? (
              <LoaderCircle className="cap-spin" size={16} />
            ) : phase === "done" ? (
              <Check size={16} />
            ) : (
              <ArrowUpRight size={16} />
            )}{" "}
            {phase === "idle"
              ? "Export collection"
              : phase === "working"
                ? "Preparing…"
                : "Ready · Reset"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <span className="cap-operation-status" role="status">
        {phase === "working"
          ? "Preparing the example."
          : phase === "done"
            ? "Example complete. No file was uploaded."
            : "Simulated export · No network request"}
      </span>
    </div>
  );
}
export function BrandApplications() {
  const [ink, setInk] = useState(false);
  return (
    <div className={"brand-applications " + (ink ? "inverted" : "")}>
      <div className="brand-app-head">
        <span>Fieldnotes</span>
        <button aria-pressed={ink} onClick={() => setInk((v) => !v)}>
          {ink ? "Light edition" : "Dark edition"} <RotateCcw size={12} />
        </button>
      </div>
      <div className="brand-artifacts">
        <div className="brand-poster">
          <span>F/N®</span>
          <strong>
            Observe.
            <br />
            Collect.
            <br />
            Make.
          </strong>
          <small>
            Independent practice
            <br />
            2026
          </small>
        </div>
        <div className="brand-stationery">
          <div className="brand-card">
            <strong>Fieldnotes.</strong>
            <small>
              Design & research
              <br />
              An independent practice.
            </small>
            <span>F/N®</span>
          </div>
          <div className="brand-label">
            <span>F/N</span>
            <div>
              Ideas, in good company.<small>Studio journal</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function DeckNarrative() {
  const [step, setStep] = useState(0);
  const slides = [
    {
      label: "Context",
      title: "Less searching.\nMore making.",
      body: "A design research tool for independent teams.",
      stat: "01",
      note: "Open with the audience and the problem.",
    },
    {
      label: "Evidence",
      title: "Research lives\nin too many places.",
      body: "An illustrative workflow: screenshots, bookmarks, recordings and notes.",
      stat: "04",
      note: "Make the problem concrete before proposing a solution.",
    },
    {
      label: "Proposal",
      title: "One collection.\nShared context.",
      body: "Bring references and decisions into the same workspace.",
      stat: "→",
      note: "Connect the proposal to the problem you established.",
    },
  ];
  const s = slides[step];
  return (
    <div className="narrative-demo">
      <div className="narrative-tabs" role="group" aria-label="Narrative slide">
        {slides.map((s, i) => (
          <button
            key={s.label}
            aria-pressed={i === step}
            onClick={() => setStep(i)}
          >
            <span>0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="narrative-slide"
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease }}
        >
          <span>Index</span>
          <h4>{s.title}</h4>
          <p>{s.body}</p>
          <strong>{s.stat}</strong>
        </motion.div>
      </AnimatePresence>
      <p className="narrative-note">{s.note}</p>
    </div>
  );
}
