/* Seenry statement · MIT · classic script, no dependencies. */
(function () {
  "use strict";
  const selector = '[data-seenry-signature="statement"]',
    instances = new Map();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const icons =
    '<svg class="ss-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg><svg class="ss-spinner" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 1-9 9"/></svg><svg class="ss-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg><svg class="ss-error" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v9m0 4v.5"/></svg>';
  let frame = 0;
  function schedule() {
    if (!frame) frame = requestAnimationFrame(tick);
  }
  // Fallback work is coalesced, with one geometry read per visible statement.
  function tick() {
    frame = 0;
    for (const [el, s] of instances) {
      if (!s.visible || s.css || reduce.matches) continue;
      const r = el.getBoundingClientRect();
      el.style.setProperty(
        "--statement-progress",
        Math.max(
          0,
          Math.min(
            1,
            (innerHeight - r.top) /
              Math.min(r.height + innerHeight * 0.18, innerHeight * 0.7),
          ),
        ),
      );
    }
  }
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const s = instances.get(e.target);
              if (s) {
                s.visible = e.isIntersecting;
                e.target.dataset.ssVisible = String(e.isIntersecting);
              }
            }
            schedule();
          },
          { rootMargin: "80px" },
        )
      : null;
  function setState(s, state, message) {
    const b = s.button;
    if (!b) return;
    b.dataset.state = state;
    b.setAttribute("aria-busy", String(state === "loading"));
    b.setAttribute(
      "aria-label",
      state === "error" ? "Try again: " + s.label : s.label,
    );
    s.status.textContent = message || "";
  }
  // Pending activations share one request. Reset/destroy invalidate late results.
  async function run(s) {
    if (!s.button || s.button.disabled || s.button.dataset.state === "loading")
      return;
    clearTimeout(s.timer);
    clearTimeout(s.navTimer);
    s.controller?.abort();
    const controller = new AbortController();
    s.controller = controller;
    s.navigate = null;
    const version = ++s.version;
    setState(s, "loading", "Working…");
    try {
      if (s.action)
        await s.action({
          element: s.el,
          button: s.button,
          signal: controller.signal,
        });
      else {
        s.navigate = () => {
          const target = s.el.dataset.next
            ? document.getElementById(s.el.dataset.next.replace(/^#/, ""))
            : s.el.closest("section")?.nextElementSibling;
          if (target) {
            target.scrollIntoView({
              behavior: reduce.matches ? "instant" : "smooth",
              block: "start",
            });
            if (!target.hasAttribute("tabindex"))
              target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
          }
        };
        await Promise.resolve();
      }
      if (controller.signal.aborted || version !== s.version) return;
      setState(s, "done", s.el.dataset.success || "Done.");
      if (s.navigate) {
        const navigate = s.navigate;
        s.navigate = null;
        s.navTimer = setTimeout(
          () => {
            if (version === s.version && !controller.signal.aborted) navigate();
          },
          reduce.matches ? 0 : parseFloat(getComputedStyle(s.el).getPropertyValue("--motion-control")) + 40,
        );
      }
      if (s.el.dataset.stayDone !== "true")
        s.timer = setTimeout(() => setState(s, "idle", ""), 1200);
    } catch (error) {
      if (controller.signal.aborted || version !== s.version) return;
      setState(
        s,
        "error",
        s.el.dataset.error || "That didn’t work. Please try again.",
      );
      s.el.dispatchEvent(new CustomEvent("seenry:error", { detail: error }));
    }
  }
  function sentence(el) {
    function read(n) {
      if (n.nodeType === 3) return n.textContent;
      if (n.nodeType !== 1) return "";
      if (n.matches("[data-object]"))
        return " " + (n.dataset.objectLabel || "") + " ";
      return Array.from(n.childNodes, read).join("");
    }
    return Array.from(el.childNodes, read)
      .join("")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }
  // Preserve the original button node; only visual words are aria-hidden.
  function split(s) {
    s.observer.disconnect();
    const el = s.el;
    s.sentence.textContent = sentence(el);
    el.querySelectorAll(".ss-word").forEach((word) =>
      word.replaceWith(document.createTextNode(word.textContent)),
    );
    el.normalize();
    function walk(parent) {
      for (const node of [...parent.childNodes]) {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of node.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) frag.append(part);
            else {
              const word = document.createElement("span");
              word.className = "ss-word";
              word.setAttribute("aria-hidden", "true");
              word.textContent = part;
              frag.append(word);
            }
          }
          node.replaceWith(frag);
        } else if (node.nodeType === 1) {
          if (node.matches("[data-object]")) {
            if (!node.querySelector("button"))
              node.setAttribute("aria-hidden", "true");
            else node.removeAttribute("aria-hidden");
          } else walk(node);
        }
      }
    }
    walk(el);
    const parts = [...el.querySelectorAll(".ss-word,[data-object]")],
      count = parts.length || 1;
    el.style.setProperty("--ss-count", count);
    parts.forEach((part, i) => {
      part.style.setProperty("--ss-index", i);
      part.style.setProperty("--ss-start", String((i / count) * 80));
      part.style.setProperty("--ss-end", String(((i + 1) / count) * 80 + 20));
    });
    const button = el.querySelector("[data-object] button");
    if (button !== s.button) {
      s.controller?.abort();
      ++s.version;
      clearTimeout(s.timer);
      clearTimeout(s.navTimer);
      if (s.button) s.button.removeEventListener("click", s.click);
      s.button = button;
      if (button) {
        s.label =
          button.getAttribute("aria-label") ||
          button.textContent.trim() ||
          "Continue";
        button.setAttribute("aria-label", s.label);
        button.type = "button";
        button.dataset.state = "idle";
        button.setAttribute("aria-busy", "false");
        button.classList.add("ss-action");
        button.innerHTML = icons;
        button.addEventListener("click", s.click);
      }
    }
    s.observer.observe(el, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-object-label"],
    });
    schedule();
  }
  function init(el, options) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el) return null;
    if (instances.has(el)) {
      if (options?.action) instances.get(el).action = options.action;
      return api(el);
    }
    const s = {
      el,
      visible: true,
      action: options?.action,
      version: 0,
      css:
        CSS.supports("animation-timeline: view()") &&
        el.dataset.fallback !== "true",
    };
    s.sentence = document.createElement("p");
    s.sentence.className = "ss-sr";
    s.status = document.createElement("span");
    s.status.className = "ss-sr";
    s.status.setAttribute("role", "status");
    s.status.setAttribute("aria-live", "polite");
    el.before(s.sentence);
    el.after(s.status);
    s.click = () => run(s);
    s.observer = new MutationObserver(() => split(s));
    instances.set(el, s);
    el.dataset.ssTimeline = s.css ? "css" : "js";
    split(s);
    io?.observe(el);
    return api(el);
  }
  function api(el) {
    return {
      setAction(fn) {
        instances.get(el).action = fn;
      },
      reset() {
        const s = instances.get(el);
        s.controller?.abort();
        ++s.version;
        clearTimeout(s.timer);
        clearTimeout(s.navTimer);
        s.navigate = null;
        setState(s, "idle", "");
      },
      refresh() {
        split(instances.get(el));
      },
      destroy() {
        const s = instances.get(el);
        if (!s) return;
        s.observer.disconnect();
        s.controller?.abort();
        setState(s, "idle", "");
        clearTimeout(s.timer);
        clearTimeout(s.navTimer);
        s.button?.removeEventListener("click", s.click);
        io?.unobserve(el);
        el.querySelectorAll(".ss-word").forEach((w) =>
          w.replaceWith(document.createTextNode(w.textContent)),
        );
        el.querySelectorAll("[data-object]").forEach((o) =>
          o.removeAttribute("aria-hidden"),
        );
        s.sentence.remove();
        s.status.remove();
        el.removeAttribute("data-ss-timeline");
        el.style.removeProperty("--statement-progress");
        instances.delete(el);
      },
    };
  }
  function initAll(root = document) {
    root.querySelectorAll(selector).forEach((el) => init(el));
  }
  window.SeenryStatement = { init, initAll };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  reduce.addEventListener("change", schedule);
  // Gallery-only demo wiring. Remove this function and its boot call in production.
  function setupGallery() {
    document.querySelectorAll("[data-demo-action]").forEach((el) => {
      let tries = 0;
      init(el, {
        action: ({ signal }) =>
          new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              tries++;
              if (el.dataset.demoAction === "retry" && tries === 1)
                reject(new Error("Example failure"));
              else resolve();
            }, 900);
            signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timer);
                reject(new DOMException("Aborted", "AbortError"));
              },
              { once: true },
            );
          }),
      });
    });
    const sampleObserver = new IntersectionObserver((entries) => {
      for (const entry of entries)
        entry.target.toggleAttribute("data-ss-paused", !entry.isIntersecting);
    });
    document.querySelectorAll(".state-panel").forEach(panel => sampleObserver.observe(panel));
    function playSample(b) {
      if (b.disabled || b._pending) return;
      clearTimeout(b._timer);
      b._pending = true;
      b.dataset.state = "loading";
      b.setAttribute("aria-busy", "true");
      b._timer = setTimeout(() => {
        b._pending = false;
        b.setAttribute("aria-busy", "false");
        b.dataset.state = b.dataset.stateSample === "error" ? "error" : "done";
        b._timer = setTimeout(() => {
          b.dataset.state = b.dataset.stateSample || "idle";
        }, 1200);
      }, 750);
    }
    document.querySelectorAll("[data-state-sample]").forEach((b) => {
      b.innerHTML = icons;
      b.addEventListener("click", () => playSample(b));
    });
    document.querySelectorAll("[data-replay-states]").forEach((b) => {
      b.addEventListener("click", () => {
        b.closest(".state-panel").querySelectorAll("[data-state-sample]").forEach(playSample);
      });
    });
  }
  document.addEventListener("visibilitychange", () => {
    document.documentElement.toggleAttribute("data-ss-paused", document.hidden);
  });

  function boot() {
    initAll();
    setupGallery();
    schedule();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
