// Add your photos to images/ and list them here. Missing files render as a soft placeholder.
const PHOTOS = [
  { src: "images/01.jpg", cat: "ceremony",    alt: "Couple exchanging vows", ratio: "3/4" },
  { src: "images/02.jpg", cat: "portraits",   alt: "Couple portrait at golden hour", ratio: "2/3" },
  { src: "images/03.jpg", cat: "details",     alt: "Rings on a bouquet", ratio: "1/1" },
  { src: "images/04.jpg", cat: "celebration", alt: "First dance", ratio: "3/2" },
  { src: "images/05.jpg", cat: "portraits",   alt: "Bride walking through a field", ratio: "4/5" },
  { src: "images/06.jpg", cat: "ceremony",    alt: "Aisle moment", ratio: "3/2" },
  { src: "images/07.jpg", cat: "details",     alt: "Table setting", ratio: "4/5" },
  { src: "images/08.jpg", cat: "celebration", alt: "Guests cheering", ratio: "2/3" },
  { src: "images/09.jpg", cat: "portraits",   alt: "Quiet moment before the ceremony", ratio: "3/4" },
];

const $ = (s, el = document) => el.querySelector(s);
const gallery = $("#gallery");
const tones = ["#d9cdbd", "#c9b9a6", "#e2d8ca", "#bfae9b"];
let visible = [];
let current = 0;

PHOTOS.forEach((p, i) => {
  const b = document.createElement("button");
  b.dataset.cat = p.cat;
  b.setAttribute("aria-label", `Open: ${p.alt}`);
  b.style.aspectRatio = p.ratio;
  b.style.background = tones[i % tones.length];
  const img = new Image();
  img.src = p.src;
  img.alt = p.alt;
  img.loading = "lazy";
  img.style.cssText = "width:100%;height:100%;object-fit:cover";
  img.onerror = () => img.remove();
  b.append(img);
  b.onclick = () => open(visible.indexOf(p));
  p.el = b;
  gallery.append(b);
});

function applyFilter(f) {
  visible = PHOTOS.filter(p => f === "all" || p.cat === f);
  PHOTOS.forEach(p => (p.el.hidden = !visible.includes(p)));
}
applyFilter("all");

document.querySelectorAll(".filters button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".filters button").forEach(b => b.classList.toggle("on", b === btn));
    applyFilter(btn.dataset.filter);
  };
});

const lb = $("#lightbox");
const lbImg = $("img", lb);
function show(i) {
  current = (i + visible.length) % visible.length;
  lbImg.src = visible[current].src;
  lbImg.alt = visible[current].alt;
}
function open(i) { show(i); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb-close").focus(); }
function close() { lb.hidden = true; document.body.style.overflow = ""; }
$(".lb-close").onclick = close;
$(".lb-prev").onclick = () => show(current - 1);
$(".lb-next").onclick = () => show(current + 1);
lb.onclick = e => { if (e.target === lb) close(); };
document.addEventListener("keydown", e => {
  if (lb.hidden) return;
  if (e.key === "Escape") close();
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});

document.querySelectorAll("[data-src]").forEach(el => {
  const probe = new Image();
  probe.onload = () => (el.style.backgroundImage = `url(${el.dataset.src})`);
  probe.src = el.dataset.src;
});

const menu = $(".menu-btn");
const links = $("#links");
menu.onclick = () => menu.setAttribute("aria-expanded", links.classList.toggle("open"));
links.onclick = e => { if (e.target.tagName === "A") { links.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); } };

$("#year").textContent = new Date().getFullYear();

const form = $("#form");
const status = $("#status");
form.onsubmit = async e => {
  e.preventDefault();
  status.textContent = "Sending…";
  try {
    const r = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    if (!r.ok) throw 0;
    form.reset();
    status.textContent = "Thank you. I'll be in touch within two days.";
  } catch {
    status.textContent = "Something went wrong. Please email hello@example.com instead.";
  }
};
