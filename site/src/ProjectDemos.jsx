import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Bookmark,
  Search,
  Check,
} from "lucide-react";
import "./project-demos.css";

const versions = [
  {label: "Before", path: "fieldwork-luna", title: "Fieldwork baseline by Luna without design skills", note: "Luna’s standalone attempt without design skills or reference research. Preserved as generated."},
  {label: "Seenry Skill", path: "fieldwork-redesign", title: "Fieldwork redesigned with Seenry", note: "Seenry workflow: a consistent brand, clear reading order, original illustrations and checked interactions."},
  {label: "Skill + MCP", path: "fieldwork-mcp", title: "Fieldwork with Seenry and MCP research", note: "Inspected architecture references informed the composition and project exploration. All three architectural images are original AI-generated concepts."},
];
export function WebsiteRedesign() {
  const [selected, setSelected] = useState(1);
  const version = versions[selected];
  const url = `/demos/${version.path}/index.html`;
  return <div className="p-comparison">
    <div className="p-tools" role="group" aria-label="Website redesign comparison">
      {versions.map((v, i) => <button key={v.path} aria-pressed={i === selected} onClick={() => setSelected(i)}>{v.label}</button>)}
      <a href={url} target="_blank" rel="noreferrer">Open website <ArrowUpRight size={15} /></a>
    </div>
    <iframe key={url} src={url} title={version.title} loading="lazy" />
    <p className="r-footnote">{version.note}</p>
    {selected === 2 && <details className="p-research-results"><summary>Research results — what changed?</summary><div>
      <p><strong>Before.</strong> Luna’s preserved version uses a bold graphic palette and abstract illustrations. It introduces the studio, but says less about the spaces it designs.</p>
      <p><strong>Seenry Skill.</strong> Shared typography, spacing and controls make the page easier to scan. SVG studies stay sharp at every size and give precise control over color and shape. They suit diagrams; they cannot convey material texture or daylight like a rendered interior.</p>
      <p><strong>Skill + MCP.</strong> Storey’s architectural image scale and SSA’s project captions informed a project-first layout. Copy sits outside the image, the caption identifies the study, and each project opens for closer inspection. Matching generated imagery communicates the studio’s domestic scale, light and materials.</p>
      <p>MCP supplied reference evidence; imagegen supplied original concept images. The improvement comes from applying both to the brief, not from the file format alone. These are authored design judgments, not measured customer outcomes or a controlled model benchmark.</p>
      <a href="/demos/fieldwork-mcp/DESIGN.md">References, decisions and image prompts ↗</a>
    </div></details>}
    <p className="r-footnote">One brief, three approaches. The redesigns are guided demonstrations; this is not a controlled model benchmark. <a href={`/demos/${version.path}/${selected ? "DESIGN.md" : "README.md"}`}>Read the record ↗</a></p>
  </div>;
}
const examples = [
  {
    id: "architecture",
    name: "Architecture",
    type: "Photography",
    image:
      "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=240&q=80",
  },
  { id: "motion", name: "A fluid popover", type: "Interaction study" },
  { id: "type", name: "Open Runde", type: "Typography" },
];
function BrandButton({ children, ...props }) {
  return (
    <button className="p-brand-button" {...props}>
      {children}
    </button>
  );
}
function ReferenceRow({ item, saved, onSave }) {
  return (
    <div className="p-reference-row">
      <div className={"p-reference-art " + item.id}>
        {item.image ? (
          <img src={item.image} alt="White building by Joel Filipe" />
        ) : item.id === "motion" ? (
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <span aria-hidden="true">Aa</span>
        )}
      </div>
      <div className="p-reference-name">
        <strong>{item.name}</strong>
        <span>{item.type}</span>
      </div>
      <button
        className="p-save"
        aria-pressed={saved}
        aria-label={(saved ? "Unsave " : "Save ") + item.name}
        onClick={onSave}
      >
        <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
export function BrandGuidelineDemo() {
  const [tab, setTab] = useState("Library"),
    [saved, setSaved] = useState(["motion"]),
    [query, setQuery] = useState("");
  const shown = examples.filter(
    (x) =>
      (tab !== "Saved" || saved.includes(x.id)) &&
      x.name.toLowerCase().includes(query.toLowerCase()),
  );
  const toggle = (id) =>
    setSaved((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  return (
    <div className="p-brand-demo">
      <div
        className="p-tools"
        role="group"
        aria-label="Brand guideline example"
      >
        {["Library", "Saved", "Guidelines"].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              setQuery("");
            }}
          >
            {t}
          </button>
        ))}
        <a href="/demos/brand-system/BRAND.md" target="_blank" rel="noreferrer">
          Read BRAND.md <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="p-brand-surface">
        <div className="p-brand-header">
          <strong>seenry.</strong>
          <span>Project example</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            {tab === "Guidelines" ? (
              <div className="p-guide">
                <h3>One system. Every screen.</h3>
                <dl>
                  <div>
                    <dt>Type</dt>
                    <dd>
                      Open Runde. The same title, body and label roles on both
                      screens.
                    </dd>
                  </div>
                  <div>
                    <dt>Surfaces</dt>
                    <dd>
                      White content on gray. Charcoal for text and the primary
                      action.
                    </dd>
                  </div>
                  <div>
                    <dt>Controls</dt>
                    <dd>
                      Shared buttons, search and saved states. New screens reuse
                      them.
                    </dd>
                  </div>
                  <div>
                    <dt>Motion</dt>
                    <dd>
                      Short, interruptible state changes. Reduced motion keeps
                      the final state.
                    </dd>
                  </div>
                </dl>
                <a
                  className="p-guide-link"
                  href="/demos/brand-system/DESIGN.md"
                >
                  See how DESIGN.md links the rules <ArrowUpRight size={15} />
                </a>
              </div>
            ) : (
              <>
                <div className="p-brand-title">
                  <h3>
                    {tab === "Library"
                      ? "Your reference library"
                      : "Saved references"}
                  </h3>
                  <BrandButton
                    onClick={() => {
                      setQuery("");
                      setTab(tab === "Library" ? "Saved" : "Library");
                    }}
                  >
                    {tab === "Library" ? "View saved" : "Browse library"}{" "}
                    <ArrowRight size={15} />
                  </BrandButton>
                </div>
                <label className="p-brand-search">
                  <Search size={18} />
                  <input
                    aria-label="Search example references"
                    placeholder="Search references"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <div className="p-reference-list">
                  {shown.map((item) => (
                    <ReferenceRow
                      key={item.id}
                      item={item}
                      saved={saved.includes(item.id)}
                      onSave={() => toggle(item.id)}
                    />
                  ))}
                  {!shown.length && (
                    <p className="p-empty">
                      {query
                        ? "No matching references. Try another name."
                        : "Save a reference from the library to see it here."}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="r-footnote">
        Both screens use the same tokens and components. Save a reference, then
        open Saved to see its state carry across. Photo:{" "}
        <a href="https://unsplash.com/photos/white-modern-cement-building-under-blue-sky-RFDP7_80v5A">
          Joel Filipe / Unsplash
        </a>
        .
      </p>
    </div>
  );
}
