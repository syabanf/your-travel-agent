/* ================================================================
   Icon Holiday — kerangka bersama seluruh halaman landing
   Menyuntikkan icon sprite, header dan footer, lalu menyalakan
   interaksi umum. Muat SETELAH data.js:

     <script src="./data.js"></script>
     <script src="./common.js"></script>
   ================================================================ */

/* ── Tautan ke aplikasi & CMS ────────────────────────────────── */
const APP_ORIGIN = (window.ICON_APP_ORIGIN || "").replace(/\/$/, "");
const IS_FILE = location.protocol === "file:";
// Landing owns "/", so the app is mounted at "/app/". "/admin" is a friendly
// alias that redirects to the CMS.
window.LINKS = {
  app: APP_ORIGIN ? `${APP_ORIGIN}/app/` : IS_FILE ? "../index.html" : "/app/",
  cms: APP_ORIGIN ? `${APP_ORIGIN}/admin` : IS_FILE ? "../index.html" : "/admin",
};

/* ── Util ────────────────────────────────────────────────────── */
window.rp = (n) => "IDR " + Number(n || 0).toLocaleString("id-ID");
window.qs = (k) => new URLSearchParams(location.search).get(k);
window.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ── Icon sprite ─────────────────────────────────────────────── */
const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<symbol id="i-plane" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.4-.2c.4-.3.6-.7.6-1.2Z"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></symbol>
<symbol id="i-map" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 15h6M9 11h3"/></symbol>
<symbol id="i-bed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8h20v8M2 12V6M22 20v-4"/><circle cx="7" cy="10" r="2"/><path d="M11 12V9h9v3"/></symbol>
<symbol id="i-ship" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a4 4 0 0 0 4-2 4 4 0 0 0 8 0 4 4 0 0 0 8 0"/><path d="M4 16 3 11h18l-1 5M12 3v8M8 6h8"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5 5L20 6"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="i-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4.5a4 4 0 0 1 0 7M22 21a6 6 0 0 0-4-5.6"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2Z"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>
<symbol id="i-phone-app" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></symbol>
<symbol id="i-wa" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.8 14.2c-.3.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3.1-1.3-5.1-4.4-5.3-4.6-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.6c.2 0 .4 0 .6.5l.9 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.6-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.2.1.4.2.4.3.1.2.1.7-.1 1.3Z"/></symbol>
<symbol id="i-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></symbol>
<symbol id="i-fb" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></symbol>
</svg>`;

/* ── Navigasi ────────────────────────────────────────────────── */
const NAV = [
  { href: "layanan.html", label: "Layanan" },
  { href: "tour.html", label: "Tour 2026" },
  { href: "destinasi.html", label: "Destinasi" },
  { href: "tentang.html", label: "Tentang" },
  { href: "artikel.html", label: "Artikel" },
  { href: "kontak.html", label: "Kontak" },
];

const C = window.COMPANY;
const here = location.pathname.split("/").pop() || "index.html";

const HEADER = `
<div class="topbar">
  <div class="wrap topbar__in">
    <span class="topbar__item"><svg class="i"><use href="#i-phone"/></svg> ${C.offices.map((o) => `${o.city} ${o.tel}`).join(" &nbsp;·&nbsp; ")}</span>
    <span class="topbar__socials">
      <a href="${C.social.ig}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg class="i"><use href="#i-ig"/></svg></a>
      <a href="${C.social.fb}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg class="i"><use href="#i-fb"/></svg></a>
    </span>
  </div>
</div>

<header class="nav" id="nav">
  <div class="wrap nav__in">
    <a class="brand" href="index.html">
      <span class="brand__mark"><svg class="i"><use href="#i-plane"/></svg></span>
      <span class="brand__text">Icon Holiday<small>Indonesia</small></span>
    </a>
    <nav class="nav__links" id="navLinks" aria-label="Menu utama">
      ${NAV.map((n) => `<a href="${n.href}"${n.href === here ? ' aria-current="page" class="is-active"' : ""}>${n.label}</a>`).join("")}
      <a class="btn btn--primary nav__cta" data-link="app" href="#"><svg class="i"><use href="#i-phone-app"/></svg> Buka Aplikasi</a>
    </nav>
    <button class="nav__toggle" id="navToggle" aria-label="Buka menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;

const FOOTER = `
<footer class="foot">
  <div class="wrap foot__in">
    <div class="foot__brand">
      <a class="brand brand--light" href="index.html">
        <span class="brand__mark"><svg class="i"><use href="#i-plane"/></svg></span>
        <span class="brand__text">Icon Holiday<small>Indonesia</small></span>
      </a>
      <p>Biro perjalanan wisata untuk tour, tiket, visa, hotel dan cruise — dengan kantor di Medan dan Jakarta.</p>
      <div class="foot__socials">
        <a href="${C.social.ig}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg class="i"><use href="#i-ig"/></svg></a>
        <a href="${C.social.fb}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg class="i"><use href="#i-fb"/></svg></a>
      </div>
    </div>
    <div class="foot__col"><h4>Layanan</h4>
      ${window.SERVICES.map((s) => `<a href="layanan.html#${s.id}">${s.name}</a>`).join("")}
    </div>
    <div class="foot__col"><h4>Perusahaan</h4>
      <a href="tentang.html">Tentang Kami</a><a href="tour.html">Tour 2026</a><a href="destinasi.html">Destinasi</a>
      <a href="galeri.html">Galeri</a><a href="artikel.html">Artikel</a><a href="kontak.html">Kontak</a>
    </div>
    <div class="foot__col"><h4>Aplikasi</h4>
      <a data-link="app" href="#">Aplikasi Traveler</a>
      <a data-link="cms" href="#">CMS / Portal Admin</a>
    </div>
  </div>
  <div class="wrap foot__legal">
    <p>© <span id="yr"></span> PT. Inter Continent Indonesia · PT. Icon Holiday Indonesia</p>
    <p>${C.offices.map((o) => o.city).join(" · ")}</p>
  </div>
</footer>

<a class="wa" href="https://wa.me/${C.wa}" target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp">
  <svg class="i"><use href="#i-wa"/></svg><span>Chat kami</span>
</a>`;

/* ── Suntikkan kerangka ──────────────────────────────────────── */
document.body.insertAdjacentHTML("afterbegin", SPRITE + HEADER);
document.body.insertAdjacentHTML("beforeend", FOOTER);

/* ── Isi href aplikasi/CMS ─────────────────────────────────────
   Halaman boleh menyuntikkan tautan [data-link] kapan saja (mis. setelah
   render), jadi selain menyapu sekali di awal kita juga menangkap klik
   lewat delegasi — dengan begitu tautan yang muncul belakangan tetap
   bekerja tanpa perlu memanggil apa pun.                              */
window.wireLinks = (root = document) => {
  root.querySelectorAll("[data-link]").forEach((a) => {
    const t = window.LINKS[a.dataset.link];
    if (!t) return;
    a.href = t;
    if (IS_FILE && a.dataset.link === "cms") {
      a.title = "Buka lewat server untuk masuk langsung ke /admin";
    }
  });
};
window.wireLinks();

// Jaring pengaman untuk tautan yang disuntikkan setelah sapuan di atas.
document.addEventListener("click", (e) => {
  const a = e.target.closest?.("[data-link]");
  if (!a) return;
  const t = window.LINKS[a.dataset.link];
  if (!t) return;
  const href = a.getAttribute("href");
  if (href && href !== "#") return; // sudah terisi — biarkan browser bekerja
  e.preventDefault();
  location.href = t;
});

/* ── Interaksi umum ──────────────────────────────────────────── */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

window.REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
window.initReveal = () => {
  const nodes = document.querySelectorAll(".reveal:not(.is-in)");
  if (window.REDUCED) { nodes.forEach((n) => n.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  nodes.forEach((n) => io.observe(n));
};
window.initReveal();

const yr = document.getElementById("yr");
if (yr) yr.textContent = new Date().getFullYear();
