/* ============================================================
   Studio Lucarelli e Associati — site.js
   Modalità: mpa (spa = file unico con router | mpa = pagine reali)
   ============================================================ */
(() => {
"use strict";

const MODE = "mpa";
const root = document.documentElement;
root.classList.remove("no-js");
root.classList.add("js");

const gsap = window.gsap || null;
const ST   = window.ScrollTrigger || null;
const HAS  = !!(gsap && ST);
const RM   = window.matchMedia("(prefers-reduced-motion: reduce)");
const FINE = window.matchMedia("(hover: hover) and (pointer: fine)");
const EASE = "power3.out";
const anim = () => HAS && !RM.matches;
if (HAS) gsap.registerPlugin(ST);

const visiblePage = () => document.querySelector(".page:not([hidden])") || document.querySelector(".page");

/* ---------- 1 · Tema ---------- */
const themeBtn = document.getElementById("theme-btn");
const store = {
  get(){ try { return localStorage.getItem("sla-theme"); } catch(e){ return null; } },
  set(v){ try { localStorage.setItem("sla-theme", v); } catch(e){} }
};
function setTheme(t){
  root.classList.add("theming");
  root.setAttribute("data-theme", t);
  store.set(t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0D0E10" : "#EDEBE6");
  window.setTimeout(() => root.classList.remove("theming"), 600);
}
themeBtn?.addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));
window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", e => {
  if (!store.get()) setTheme(e.matches ? "dark" : "light");
});

/* ---------- 2 · Smooth scroll ---------- */
let lenis = null;
if (typeof window.Lenis === "function" && !RM.matches) {
  try {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    if (HAS) {
      lenis.on("scroll", ST.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const loop = t => { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  } catch(e) { lenis = null; }
}
const toTop = () => { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };
const scrollToEl = el => { if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: RM.matches ? "auto" : "smooth" }); };
const lock = on => {
  if (on) { root.setAttribute("data-lock",""); lenis?.stop(); }
  else { root.removeAttribute("data-lock"); lenis?.start(); }
};

/* ---------- 3 · Header + barra avanzamento + rail attivo ---------- */
const header = document.querySelector(".site-header");
const sprog = document.querySelector(".sprog");
const railBox = document.querySelector(".rail");
let railSecs = [], railBtns = [], lastY = 0;

function onScroll(){
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle("solid", y > 60);
  if (y > 240 && y > lastY + 4) header.classList.add("up");
  else if (y < lastY - 4 || y < 240) header.classList.remove("up");
  lastY = y;
  if (sprog) sprog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
  if (railSecs.length){
    let cur = 0;
    for (let i = 0; i < railSecs.length; i++){
      if (railSecs[i].getBoundingClientRect().top <= window.innerHeight * 0.42) cur = i;
    }
    railBtns.forEach((b, i) => b.classList.toggle("on", i === cur));
  }
}
window.addEventListener("scroll", onScroll, { passive: true });

function buildRail(){
  if (!railBox) return;
  railBox.replaceChildren();
  railSecs = []; railBtns = [];
  const page = visiblePage();
  if (!page) return;
  const secs = [...page.querySelectorAll("section[aria-labelledby]")];
  if (secs.length < 2) return;
  secs.forEach(sec => {
    const h = document.getElementById(sec.getAttribute("aria-labelledby"));
    let label = "";
    if (sec.classList.contains("hero")) label = "Inizio";
    const eb = label ? null : sec.querySelector(".eyebrow");
    if (eb) label = eb.textContent.replace(/^\s*[\d→]+\s*/, "").trim();
    if (!label && h) label = h.textContent.trim();
    if (!label) return;
    if (label.length > 22) label = label.slice(0, 21) + "…";
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.label = label;
    b.setAttribute("aria-label", "Vai alla sezione " + label);
    b.innerHTML = "<i></i>";
    b.addEventListener("click", () => scrollToEl(sec));
    railBox.append(b);
    railSecs.push(sec); railBtns.push(b);
  });
}

/* ---------- 4 · Menu mobile ---------- */
const menuBtn = document.getElementById("menu-btn");
const mnav = document.getElementById("mnav");
function closeMenu(focus){
  if (!mnav) return;
  mnav.hidden = true;
  menuBtn.setAttribute("aria-expanded","false");
  menuBtn.setAttribute("aria-label","Apri il menu");
  lock(false);
  if (focus) menuBtn.focus();
}
function openMenu(){
  mnav.hidden = false;
  menuBtn.setAttribute("aria-expanded","true");
  menuBtn.setAttribute("aria-label","Chiudi il menu");
  lock(true);
  if (anim()) gsap.fromTo(mnav.querySelectorAll("a"), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .05, ease: EASE });
  mnav.querySelector("a")?.focus();
}
menuBtn?.addEventListener("click", () => menuBtn.getAttribute("aria-expanded") === "true" ? closeMenu(true) : openMenu());
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (mnav && !mnav.hidden) { closeMenu(true); return; }
  const d = document.getElementById("dlg");
  if (d && d.open) d.close();
});

/* ---------- 5 · Reveal ---------- */
let batches = [];
function killReveals(){
  batches.forEach(t => { try { t.kill(); } catch(e){} });
  batches = [];
}
function buildReveals(){
  killReveals();
  const page = visiblePage();
  const items = page ? [...page.querySelectorAll(".rv, .rv-y")] : [];
  const cta = document.getElementById("cta");
  if (cta && !cta.hidden) items.push(...cta.querySelectorAll(".rv, .rv-y"));
  if (!items.length) return;
  if (!anim()) { items.forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; }); return; }
  items.forEach(el => gsap.set(el, { opacity: 0, y: el.classList.contains("rv-y") ? 32 : 0 }));
  batches = ST.batch(items, {
    start: "top 88%",
    once: true,
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: .95, stagger: .08, ease: EASE, overwrite: "auto" })
  });
}

/* ---------- 6 · Ingresso pagina + tavole tecniche ---------- */
let plateSTs = [];
function killPlates(){
  plateSTs.forEach(t => { try { t.kill(); } catch(e){} });
  plateSTs = [];
}
function collectLayer(g){
  const draw = [], fade = [...g.querySelectorAll("text")];
  g.querySelectorAll("path,circle,rect,line,polyline,ellipse").forEach(el => {
    const cl = el.classList;
    if (cl.contains("dd") || cl.contains("fc") || cl.contains("wt") || cl.contains("wo") || cl.contains("ndf")) { fade.push(el); return; }
    let L = 300;
    try { L = el.getTotalLength() || 300; } catch(e){}
    draw.push({ el, L });
  });
  return { draw, fade };
}
function setLayer(l, k){
  l.draw.forEach(o => { o.el.style.strokeDashoffset = String(o.L * (1 - k)); });
  l.fade.forEach(el => { el.style.opacity = k.toFixed(3); });
}
function buildPlates(){
  killPlates();
  const page = visiblePage();
  if (!page || !anim()) return;
  page.querySelectorAll("svg.plate").forEach(svg => {
    const isIntro = !!svg.closest(".intro-fig");
    const layers = [...svg.querySelectorAll("g[data-l]")].map(g => ({ i: +g.dataset.l, ...collectLayer(g) }))
      .sort((a, b) => a.i - b.i);
    if (!layers.length) return;
    // stato iniziale nascosto
    layers.forEach(l => {
      l.draw.forEach(o => { o.el.style.strokeDasharray = o.L; o.el.style.strokeDashoffset = o.L; });
      l.fade.forEach(el => { el.style.opacity = "0"; });
    });
    let scrubbed = layers;
    if (isIntro){
      // il primo livello si disegna subito all'ingresso; il dettaglio si compone scorrendo
      const l0 = layers[0];
      scrubbed = layers.slice(1);
      const els = l0.draw.map(o => o.el);
      if (els.length) gsap.to(els, { strokeDashoffset: 0, duration: 1.1, stagger: { amount: .8 }, ease: "power2.out", delay: .4 });
      if (l0.fade.length) gsap.to(l0.fade, { opacity: 1, duration: .8, delay: 1.1 });
    }
    if (!scrubbed.length) return;
    const n = scrubbed.length;
    const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
    // sotto i 640px la tavola non e' sticky (altezza automatica, piu' corta del viewport):
    // "top top"/"bottom bottom" darebbe un intervallo nullo e il disegno non si comporrebbe mai.
    // la tavola e' sticky a tutte le larghezze: intervallo unico
    const flat = false;
    plateSTs.push(ST.create({
      trigger: isIntro ? (svg.closest(".intro") || svg) : (svg.closest(".plate-band") || svg),
      start: isIntro ? "top top" : (flat ? "top 88%" : "top top"),
      end: isIntro ? "+=520" : (flat ? "bottom 42%" : "bottom bottom"),
      scrub: .5,
      onUpdate: self => {
        const p = self.progress;
        scrubbed.forEach((l, idx) => setLayer(l, clamp((p - idx * (0.86 / n)) / (0.95 / n))));
      }
    }));
  });
}
function introAnim(){
  const page = visiblePage();
  if (!page || !anim()) return;
  const lines = page.querySelectorAll("[data-lines] .ln > i");
  const bits  = page.querySelectorAll("[data-hero]");
  const num   = page.querySelector(".intro-num");
  const tl = gsap.timeline();
  if (lines.length) tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: 1.05, stagger: .09, ease: EASE }, 0);
  if (bits.length)  tl.fromTo(bits,  { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .08, ease: EASE }, .12);
  if (num) tl.fromTo(num, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 1.2, ease: EASE }, .2);
  const media = page.querySelector(".hero-media img");
  if (media) tl.fromTo(media, { scale: 1.07 }, { scale: 1, duration: 1.8, ease: "power2.out" }, 0);
}

/* ---------- 7 · Scena Metodo (home): cantiere in quattro fasi ---------- */
let methodST = null;
function buildMethod(){
  methodST?.kill(); methodST = null;
  const sec = document.getElementById("method");
  if (!sec) return;
  const svg = sec.querySelector(".method-canvas");
  // sugli schermi stretti il disegno sta sopra il testo: inquadratura ritagliata
  // e "meet" (tavola intera); su desktop copre la scena dietro il velo ("slice")
  const narrow = window.innerWidth <= 900;
  if (svg){
    svg.setAttribute("preserveAspectRatio", narrow ? "xMidYMid meet" : "xMidYMid slice");
    svg.setAttribute("viewBox", narrow ? "668 124 753 668" : "0 0 1440 900");
  }
  if (!anim()) return;
  const layers = [...(svg ? svg.querySelectorAll("g[data-l]") : [])]
    .map(g => ({ i: +g.dataset.l, k: -1, ...collectLayer(g) }))
    .sort((a, b) => a.i - b.i);
  layers.forEach(l => {
    l.draw.forEach(o => { o.el.style.strokeDasharray = o.L; o.el.style.strokeDashoffset = o.L; });
    l.fade.forEach(el => { el.style.opacity = "0"; });
  });
  const steps = [...sec.querySelectorAll(".mstep")];
  const ticks = [...sec.querySelectorAll(".method-ticks span")];
  const bar = sec.querySelector(".method-bar");
  let cur = -1;
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  methodST = ST.create({
    trigger: sec, start: "top top", end: "bottom bottom", scrub: .5,
    onUpdate: self => {
      const p = self.progress;
      // ogni fase si disegna nel quarto di scorrimento del proprio passo
      layers.forEach((l, i) => {
        const k = clamp((p - (i * 0.25 + 0.015)) / 0.215);
        if (k !== l.k){ l.k = k; setLayer(l, k); }
      });
      if (bar) bar.style.setProperty("--mp", p.toFixed(4));
      const s = p < .25 ? 0 : p < .5 ? 1 : p < .75 ? 2 : 3;
      if (s !== cur) {
        cur = s;
        steps.forEach(el => el.classList.toggle("on", +el.dataset.step === s));
        ticks.forEach((el, i) => el.classList.toggle("on", i === s));
      }
    }
  });
}

/* ---------- 8 · Progetti: filtri + scheda ---------- */
const items = [...document.querySelectorAll("[data-project]")];
const fbtns = [...document.querySelectorAll(".fbtn")];
let filter = "all";
function applyFilter(f){
  filter = f;
  let n = 0;
  fbtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
  items.forEach(el => {
    const show = f === "all" || el.dataset.cat === f;
    el.hidden = !show;
    if (show) n++;
  });
  const count = document.getElementById("pj-count");
  if (count) count.textContent = n + (n === 1 ? " progetto" : " progetti");
  const emptyBox = document.getElementById("pj-empty");
  if (emptyBox) emptyBox.hidden = n !== 0;
  const feat = document.getElementById("pj-featured");
  const arch = document.getElementById("pj-archive");
  if (feat) feat.hidden = !feat.querySelector("[data-project]:not([hidden])");
  if (arch) arch.hidden = !arch.querySelector("[data-project]:not([hidden])");
  if (anim()){
    const vis = items.filter(el => !el.hidden);
    gsap.fromTo(vis, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .025, ease: EASE, overwrite: "auto" });
  }
  ST?.refresh();
}
fbtns.forEach(b => b.addEventListener("click", () => applyFilter(b.dataset.filter)));
document.getElementById("pj-reset")?.addEventListener("click", () => { applyFilter("all"); fbtns[0]?.focus(); });

const dlg = document.getElementById("dlg");
const dlgMedia = document.getElementById("dlg-media");
let returnTo = null;
function openCard(el, trigger){
  if (!dlg) return;
  const d = el.dataset;
  document.getElementById("dlg-title").textContent  = d.client || "";
  document.getElementById("dlg-cat").textContent    = d.catlabel || "";
  document.getElementById("dlg-client").textContent = d.client || "";
  document.getElementById("dlg-place").textContent  = d.place || "";
  document.getElementById("dlg-desc").textContent   = d.desc || "";
  dlgMedia.replaceChildren();
  const imgSrc = d.img || el.querySelector("img")?.getAttribute("src") || "";
  if (imgSrc){
    const img = new Image();
    img.src = imgSrc; img.alt = (d.client || "") + " — " + (d.place || "");
    img.decoding = "async";
    dlgMedia.append(img);
  } else {
    const s = document.createElement("span");
    s.className = "ph"; s.textContent = "Immagine non disponibile";
    dlgMedia.append(s);
  }
  returnTo = trigger;
  if (dlg.open) dlg.close();
  lock(true);
  /* la scheda entra nel top layer: il cursore personalizzato resterebbe sotto,
     quindi torna quello di sistema finche' la scheda e' aperta */
  root.setAttribute("data-modal","");
  dlg.showModal();
}
document.addEventListener("click", e => {
  const t = e.target instanceof Element ? e.target.closest("[data-open]") : null;
  if (!t) return;
  openCard(t.closest("[data-project]") || t, t);
});
document.getElementById("dlg-close")?.addEventListener("click", () => dlg.close());
dlg?.addEventListener("click", e => {
  const r = dlg.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
});
dlg?.addEventListener("close", () => {
  root.removeAttribute("data-modal");
  lock(false);
  returnTo?.focus({ preventScroll: true });
  returnTo = null;
});

/* ---------- 9 · (rimossa) anteprima al passaggio del mouse ---------- */
/* ---------- 10 · Cursore personalizzato ---------- */
function initCursor(){
  const dot = document.querySelector(".cur-dot");
  const ring = document.querySelector(".cur-ring");
  if (!dot || !ring || !HAS || !FINE.matches || RM.matches) return;
  root.classList.add("cur-on");
  const dx = gsap.quickTo(dot, "x", { duration: .12, ease: "power3.out" });
  const dy = gsap.quickTo(dot, "y", { duration: .12, ease: "power3.out" });
  const rx = gsap.quickTo(ring, "x", { duration: .3, ease: "power3.out" });
  const ry = gsap.quickTo(ring, "y", { duration: .3, ease: "power3.out" });
  let seen = false;
  document.addEventListener("mousemove", e => {
    if (!seen){ seen = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); gsap.to([dot, ring], { opacity: 1, duration: .3 }); }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  }, { passive: true });
  document.addEventListener("mouseleave", () => gsap.to([dot, ring], { opacity: 0, duration: .25 }));
  document.addEventListener("mouseenter", () => { if (seen) gsap.to([dot, ring], { opacity: 1, duration: .25 }); });
  const HOT = "a,button,[data-open],summary,input,select,textarea";
  document.addEventListener("mouseover", e => {
    const hot = e.target instanceof Element && e.target.closest(HOT);
    gsap.to(ring, { scale: hot ? 1.7 : 1, opacity: hot ? .9 : 1, duration: .3, ease: EASE });
    gsap.to(dot, { scale: hot ? .4 : 1, duration: .3, ease: EASE });
  });
}

/* ---------- 11 · Mappa (contatti) ---------- */
let mapDone = false;
function initMap(){
  if (mapDone) return;
  const shell = document.querySelector(".map");
  if (!shell || shell.closest(".page")?.hidden) return;
  mapDone = true;
  const f = shell.querySelector("iframe");
  const fail = () => { shell.dataset.state = "error"; shell.setAttribute("aria-busy","false"); };
  f.addEventListener("load", () => { shell.dataset.state = "ready"; shell.setAttribute("aria-busy","false"); }, { once: true });
  f.addEventListener("error", fail, { once: true });
  f.src = f.dataset.src;
  window.setTimeout(() => { if (shell.dataset.state === "loading") fail(); }, 8000);
}

/* ---------- 12 · Router (solo file unico) ---------- */
const pages = [...document.querySelectorAll(".page")];
const ctaBox = document.getElementById("cta");
const cover = document.querySelector(".cover");
const META = {
  home:     ["Studio Lucarelli e Associati — Architettura e ingegneria, Perugia","Dal 1973 a Perugia: progettazione architettonica e strutturale, direzione lavori, sicurezza e coordinamento multidisciplinare."],
  studio:   ["Lo Studio — Studio Lucarelli e Associati","Architettura e ingegneria in un unico studio. Dal 1973 a Perugia, con responsabilità tecnica continua dal progetto al cantiere."],
  servizi:  ["Servizi — Studio Lucarelli e Associati","Progettazione architettonica e strutturale, direzione lavori, sicurezza, consolidamento, controllo economico e coordinamento multidisciplinare."],
  progetti: ["Progetti — Studio Lucarelli e Associati","Incarichi per imprese, enti pubblici e istituzioni: aree funzionali, residenziale, industriale, opere pubbliche, restauro."],
  partner:  ["Partner societari — Studio Lucarelli e Associati","Euroengineering, FLU.Project, Studio Drisaldi, Exid e CSP: rapporti societari stabili per impianti, strutture e sicurezza."],
  soci:     ["Soci — Studio Lucarelli e Associati","Danilo Lucarelli, David Kaczmarek e Diego Roscini: progettazione, direzione lavori e controllo economico del cantiere."],
  contatti: ["Contatti — Studio Lucarelli e Associati","Via della Madonna Alta 138/A, 06128 Perugia. Telefono +39 075 5867558, info@lucarelliassociati.it"]
};
let current = "";
let busy = false;

function pageInits(route){
  buildReveals();
  buildPlates();
  buildRail();
  if (route === "home") buildMethod(); else { methodST?.kill(); methodST = null; }
  if (route === "progetti") applyFilter(filter);
  if (route === "contatti" || MODE === "mpa") initMap();
  ST?.refresh();
}

if (MODE === "spa"){
  const byRoute = r => pages.find(p => p.dataset.page === r);
  const valid = r => pages.some(p => p.dataset.page === r);
  const fromHash = () => {
    const r = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split(/[?&]/)[0];
    return valid(r) ? r : "home";
  };
  const syncNav = route => {
    document.querySelectorAll(".nav a, .mnav a").forEach(a => {
      const on = a.getAttribute("href") === "#/" + route;
      if (on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
    });
    const m = META[route] || META.home;
    document.title = m[0];
    document.querySelector('meta[name="description"]')?.setAttribute("content", m[1]);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", m[0]);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", m[1]);
  };
  const apply = route => {
    pages.forEach(p => { p.hidden = p.dataset.page !== route; });
    current = route;
    root.setAttribute("data-route", route);
    if (ctaBox) ctaBox.hidden = (route === "contatti");
    syncNav(route);
    pageInits(route);
    return byRoute(route);
  };
  const go = (route, push = true) => {
    if (!valid(route)) route = "home";
    closeMenu(false);
    if (route === current){ toTop(); return; }
    if (busy) return;
    const setHash = () => {
      if (!push) return;
      if (location.hash !== "#/" + route){
        try { history.pushState({ r: route }, "", "#/" + route); } catch(e){ location.hash = "/" + route; }
      }
    };
    if (!anim() || !cover){
      toTop(); const p = apply(route); setHash(); p?.querySelector("h1")?.focus({ preventScroll: true }); return;
    }
    busy = true;
    cover.classList.add("on");
    window.setTimeout(() => {
      toTop();
      const page = apply(route);
      setHash();
      requestAnimationFrame(() => {
        cover.classList.remove("on");
        introAnim();
        page?.querySelector("h1")?.focus({ preventScroll: true });
        busy = false;
      });
    }, 270);
  };
  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest("a[data-link]") : null;
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#/")) return;
    e.preventDefault();
    go(href.slice(2));
  });
  window.addEventListener("popstate", () => go(fromHash(), false));
  window.addEventListener("hashchange", () => { const r = fromHash(); if (r !== current) go(r, false); });
  apply(fromHash());
} else {
  /* MPA: pagina unica reale; menu si chiude da solo alla navigazione */
  current = visiblePage()?.dataset.page || "home";
  root.setAttribute("data-route", current);
  pageInits(current);
}

/* ---------- 13 · Avvio ---------- */
const yr = document.getElementById("yr");
if (yr) yr.textContent = String(new Date().getFullYear());
document.querySelectorAll("img").forEach(img => {
  img.addEventListener("error", () => { img.style.visibility = "hidden"; }, { once: true });
});
let rz;
window.addEventListener("resize", () => {
  if (window.innerWidth > 1180) closeMenu(false);
  clearTimeout(rz);
  rz = setTimeout(() => { if (current === "home") buildMethod(); buildPlates(); ST?.refresh(); }, 180);
});
initCursor();
introAnim();
onScroll();
window.addEventListener("load", () => { ST?.refresh(); onScroll(); });
})();
