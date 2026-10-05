import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Check,
  Copy,
} from "lucide-react";
import "./evidence-demos.css";
export const photoSource =
  "https://unsplash.com/photos/white-modern-cement-building-under-blue-sky-RFDP7_80v5A";
export const photo =
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1400&q=85";
const videoSource =
  "https://www.pexels.com/video/drone-shot-of-ocean-waves-at-the-seashore-4193133/";
const video =
  "https://videos.pexels.com/video-files/4193133/4193133-uhd_2562_1440_24fps.mp4";
function PhotoCredit() {
  return (
    <a href={photoSource} target="_blank" rel="noreferrer">
      Joel Filipe / Unsplash <ArrowUpRight size={12} />
    </a>
  );
}
export function SourcedMedia() {
  const [kind, setKind] = useState("Photography"),
    [portrait, setPortrait] = useState(false),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [error, setError] = useState(false);
  const ref = useRef();
  return (
    <div className="e-media">
      <div className="e-controls" role="group" aria-label="Sourced media">
        {["Photography", "Video"].map((x) => (
          <button
            key={x}
            aria-pressed={kind === x}
            onClick={() => {
              ref.current?.pause();
              setPlaying(false);
              setKind(x);
              setTime(0);
              setDuration(0);
              setError(false);
            }}
          >
            {x}
          </button>
        ))}
      </div>
      {kind === "Photography" ? (
        <>
          <div className={"e-photo-frame " + (portrait ? "portrait" : "")}>
            <img
              src={photo}
              width="1400"
              height="1867"
              loading="lazy"
              alt="White apartment building against a pale blue sky, photographed by Joel Filipe"
              onError={() => setError(true)}
            />
          </div>
          <div className="e-media-caption">
            <PhotoCredit />
            <button
              aria-pressed={portrait}
              onClick={() => setPortrait(!portrait)}
            >
              {portrait ? "Show wide crop" : "Try portrait crop"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="e-video-frame">
            <video
              ref={ref}
              src={video}
              poster="https://images.pexels.com/videos/4193133/pexels-photo-4193133.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200"
              playsInline
              muted
              preload="none"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onError={() => setError(true)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
            <div className="e-video-controls">
              <button
                aria-label={
                  playing ? "Pause sourced video" : "Play sourced video"
                }
                onClick={async () => {
                  if (playing) ref.current.pause();
                  else
                    try {
                      await ref.current.play();
                    } catch {
                      setError(true);
                    }
                }}
              >
                {playing ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <input
                aria-label="Sourced video position"
                type="range"
                min="0"
                max={duration || 20}
                step="0.1"
                value={time}
                onChange={(e) => {
                  ref.current.currentTime = Number(e.target.value);
                  setTime(Number(e.target.value));
                }}
              />
              <span>{Math.floor(time)}s</span>
            </div>
          </div>
          <div className="e-media-caption">
            <a href={videoSource} target="_blank" rel="noreferrer">
              Nino Souza / Pexels <ArrowUpRight size={12} />
            </a>
            <a href="https://www.pexels.com/license/">License ↗</a>
          </div>
        </>
      )}
      {error && (
        <p role="status">
          Media could not load. Open its source using the credit link.
        </p>
      )}
      <p className="r-footnote">
        Sourced, not generated. Photography shows crop choices; video keeps
        playback under your control.{" "}
        <a href="https://unsplash.com/license">Unsplash license</a>.
      </p>
    </div>
  );
}
function linearRGB(L, C, H) {
  let a = C * Math.cos((H * Math.PI) / 180),
    b = C * Math.sin((H * Math.PI) / 180),
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
export function paletteColor(L, C, H) {
  let used = C,
    rgb = linearRGB(L, used, H);
  while (rgb.some((v) => v < 0 || v > 1) && used > 0) {
    used = Math.max(0, used - 0.001);
    rgb = linearRGB(L, used, H);
  }
  const srgb = rgb.map((v) =>
    Math.round(
      Math.max(
        0,
        Math.min(
          1,
          v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055,
        ),
      ) * 255,
    ),
  );
  const decoded = srgb.map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * decoded[0] + 0.7152 * decoded[1] + 0.0722 * decoded[2];
  const white = 1.05 / (lum + 0.05),
    black = (lum + 0.05) / 0.05;
  return {
    css: `rgb(${srgb.join(" ")})`,
    oklch: `oklch(${L.toFixed(2)} ${used.toFixed(3)} ${H})`,
    ink: white >= black ? "#fff" : "#000",
    contrast: Math.max(white, black).toFixed(2),
    chroma: used,
  };
}
export function ColorStudy() {
  const [preset, setPreset] = useState(0),
    [h, setH] = useState(260),
    [L, setL] = useState(0.46),
    [reserved, setReserved] = useState(false),
    [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const c = paletteColor(L, 0.14, h),
    surface = paletteColor(0.94, 0.045, [55, 300, 100][preset]);
  return (
    <div className="e-color">
      <div className="e-controls" role="group" aria-label="Color combination">
        {[
          ["Blue + peach", 260, 0.46],
          ["Plum + lilac", 330, 0.4],
          ["Forest + citron", 145, 0.38],
        ].map(([name, hue, light], i) => (
          <button
            key={name}
            aria-pressed={preset === i}
            onClick={() => {
              setPreset(i);
              setH(hue);
              setL(light);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        className="e-color-example"
        style={{
          "--color-accent": c.css,
          "--color-surface": surface.css,
          "--color-ink": c.ink,
        }}
      >
        <div className="e-color-label">
          <span>Tide</span>
          <span>Reading room</span>
        </div>
        <h3>Read with us on Saturday.</h3>
        <p>Bring a book to the reading room. No set reading list.</p>
        <div className="e-color-action">
          <span>Saturday · 10:00–12:00</span>
          <button
            aria-pressed={reserved}
            onClick={() => setReserved(!reserved)}
          >
            {reserved ? (
              <>
                <Check size={15} /> Seat reserved
              </>
            ) : (
              "Reserve a seat"
            )}
          </button>
        </div>
      </div>
      <div className="e-color-sliders">
        <label>
          Hue <span>{h}°</span>
          <input
            aria-label="Palette hue"
            type="range"
            min="0"
            max="360"
            value={h}
            onChange={(e) => setH(Number(e.target.value))}
          />
        </label>
        <label>
          Lightness <span>{Math.round(L * 100)}%</span>
          <input
            aria-label="Palette lightness"
            type="range"
            min="25"
            max="72"
            value={Math.round(L * 100)}
            onChange={(e) => setL(Number(e.target.value) / 100)}
          />
        </label>
      </div>
      <div className="e-color-tokens">
        <code>{c.oklch}</code>
        <button
          aria-label={copied ? "Color token copied" : "Copy color token"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`--accent: ${c.oklch};`);
              setCopied(true);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1800);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        <span>Button contrast {c.contrast}:1</span>
      </div>
      <p className="r-footnote">
        Each preset pairs a different surface and action color. The sliders
        adjust the action in OKLCH. Text switches between black and white to
        preserve contrast. Chroma is reduced when needed to fit sRGB; the ratio
        measures the final button colors only.
      </p>
    </div>
  );
}
const wiseImage =
  "https://cdn.sanity.io/images/vf63fv1z/production/22314f0fe1315be5a2d9626e113917fe5c2e43a6-1200x630.jpg?auto=format&fit=max&q=80&w=1600";
export function BrandSystem() {
  const [view, setView] = useState(0);
  const views = ["Full study", "Entry", "Card", "Confirmation"];
  const notes = [
    "The same identity, with different levels of emphasis. Artwork and display type lead the entry and confirmation; balance and controls lead the card screen.",
    "The opening uses a globe, currency artwork and heavy display type. A short description and clear action keep the offer understandable.",
    "The balance and card come first. Green connects the card and controls, while ordinary labels stay small and readable.",
    "Expressive type and artwork return after the task. The supporting sentence names the completed result; the action closes the moment.",
  ];
  return (
    <div className="e-wise">
      <div className="e-controls" role="group" aria-label="Wise reference view">
        {views.map((name, i) => (
          <button
            key={name}
            aria-pressed={view === i}
            onClick={() => setView(i)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={"e-wise-image " + (view ? "focused" : "")}>
        <motion.img
          src={wiseImage}
          alt={
            view
              ? `Wise ${views[view].toLowerCase()} screen from its rebrand presentation`
              : "Wise rebrand: entry, card management and confirmation screens"
          }
          loading="lazy"
          animate={{ x: view ? `${(-(view - 1) * 100) / 3}%` : "0%" }}
          style={{ width: view ? "300%" : "100%" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="e-wise-note" aria-live="polite">
        {notes[view]}
      </p>
      <p className="r-footnote">
        Wise rebrand study. Reference artwork belongs to Wise; shown for design
        analysis.{" "}
        <a href="https://seenry.design/design/bbf1181a77472aeb22423e4229b6e755">
          View in Seenry ↗
        </a>{" "}
        ·{" "}
        <a href="https://wise.com/gb/blog/a-brand-for-everywhere-wise-unveils-bold-new-look">
          Wise’s brand announcement ↗
        </a>
      </p>
    </div>
  );
}
const slides = ["Introduce", "Explain", "Plan", "Invite"];
export function DeckStudy() {
  const [step, setStep] = useState(0);
  return (
    <div className="e-deck">
      <div className="e-controls" role="group" aria-label="Presentation slide">
        {slides.map((x, i) => (
          <button key={x} aria-pressed={step === i} onClick={() => setStep(i)}>
            {x}
          </button>
        ))}
      </div>
      <div className={"e-slide stage-" + step}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="e-slide-content"
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 ? (
              <>
                <div>
                  <span className="e-tide-logo">Tide ∿</span>
                  <h3>
                    A public room
                    <br />
                    for slow afternoons.
                  </h3>
                  <p>A concept for a coastal reading space.</p>
                </div>
                <img
                  src={photo}
                  alt="Architectural photograph used as concept mood imagery"
                />
              </>
            ) : step === 1 ? (
              <>
                <div className="e-slide-statement">
                  <span>Tide ∿</span>
                  <h3>
                    Make room
                    <br />
                    for doing less.
                  </h3>
                </div>
                <div className="e-slide-body">
                  <p>
                    A shared place to read, meet a neighbour, or sit quietly.
                  </p>
                  <p>
                    The proposal brings a small library, a communal table, and
                    an open doorway into one room.
                  </p>
                  <span>A place to read, meet, and stay a while.</span>
                </div>
              </>
            ) : step === 2 ? (
              <>
                <div>
                  <span>Tide ∿</span>
                  <h3>
                    Three ways
                    <br />
                    to spend an hour.
                  </h3>
                </div>
                <div className="e-floorplan">
                  <div>Reading nook</div>
                  <div>Shared table</div>
                  <div>Open shelves</div>
                </div>
              </>
            ) : (
              <>
                <span className="e-tide-logo">Tide ∿</span>
                <h3>
                  Start with
                  <br />
                  one Saturday.
                </h3>
                <div className="e-slide-agenda">
                  <span>
                    10:00
                    <br />
                    <strong>Doors open</strong>
                  </span>
                  <span>
                    14:00
                    <br />
                    <strong>Shared reading</strong>
                  </span>
                  <span>
                    18:00
                    <br />
                    <strong>Close & reflect</strong>
                  </span>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="e-deck-nav">
        <button
          aria-label="Previous slide"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <span>
          {step + 1} / {slides.length}
        </span>
        <button
          aria-label="Next slide"
          disabled={step === slides.length - 1}
          onClick={() => setStep(step + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <p className="r-footnote">
        An original proposal with distinct slide roles.{" "}
        <a href="https://seenry.design/design/743acf1986f891a2ab9da2725170d43a">
          SPACE10’s catalogue
        </a>{" "}
        informed the alternation of image-led context, readable explanation, and
        visual process. Stock photo:{" "}
        <a href={photoSource}>Joel Filipe / Unsplash</a>.
      </p>
    </div>
  );
}
export function SolComparison() {
  const [mode, setMode] = useState("baseline"),
    [mobile, setMobile] = useState(false);
  return (
    <div className="e-comparison">
      <div className="e-controls" role="group" aria-label="Sol comparison">
        {[
          ["baseline", "Without skill"],
          ["with-skill", "With Seenry"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={mode === id}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
        <button
          className="e-width-toggle"
          aria-pressed={mobile}
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? "Full width" : "Narrow"}
        </button>
      </div>
      <div className={"e-site-window " + (mobile ? "narrow" : "")}>
        <iframe
          key={mode}
          title={
            "Fieldwork website " +
            (mode === "baseline" ? "without skill" : "with Seenry skill")
          }
          src={"/demos/sol-comparison/" + mode + "/index.html"}
          loading="lazy"
        />
      </div>
      <div className="e-media-caption">
        <span>Earlier Sol runs · before this skill revision</span>
        <a
          href={"/demos/sol-comparison/" + mode + "/index.html"}
          target="_blank"
          rel="noreferrer"
        >
          Open website <ArrowUpRight size={13} />
        </a>
      </div>
      <details className="e-method">
        <summary>Brief and comparison method</summary>
        <p>
          Recorded before the latest copy, palette and anti-default guidance.
          The user rejected aspects of the skill-assisted result; these
          originals remain unchanged for comparison. Two fresh Sol runs, high
          reasoning. Same fictional architecture studio, content, font access,
          SVG-only artwork and functional requirements. The second run uses
          Seenry’s workflow. No baseline instructions to make poor work. The
          runs share a brief, not an identical time or token budget; this is one
          example, not a ranking.
        </p>
        <a href="/demos/sol-comparison/baseline/manifest.md">
          Baseline record ↗
        </a>
        <a href="/demos/sol-comparison/with-skill/manifest.md">
          Skill-assisted record ↗
        </a>
      </details>
    </div>
  );
}
