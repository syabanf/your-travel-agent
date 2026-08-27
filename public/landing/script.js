/* ================================================================
   Icon Holiday — landing page behaviour
   Content lives here so the page stays a single static folder with
   no build step. Swap these arrays for a CMS feed when you have one.
   ================================================================ */

/* ── Tautan ke aplikasi ──────────────────────────────────────────
   Halaman ini hidup di `public/landing/`, jadi saat di-serve bersama
   aplikasi (dev maupun hasil build) aplikasi ada di root: `/` dan
   `/dashboard`. Kalau landing di-deploy terpisah, cukup set:

     <script>window.ICON_APP_ORIGIN = "https://app.iconholiday.id"</script>

   sebelum <script src="./script.js">.                               */
const APP_ORIGIN = (window.ICON_APP_ORIGIN || "").replace(/\/$/, "");
const IS_FILE = location.protocol === "file:";

const LINKS = {
  // Aplikasi traveler (mobile app)
  app: APP_ORIGIN ? `${APP_ORIGIN}/` : IS_FILE ? "../../index.html" : "/",
  // Portal admin / CMS — BrowserRouter, jadi path asli (bukan hash)
  cms: APP_ORIGIN ? `${APP_ORIGIN}/dashboard` : IS_FILE ? "../../index.html" : "/dashboard",
};

// Terapkan ke setiap tautan yang menandai dirinya dengan data-link="app|cms".
document.querySelectorAll("[data-link]").forEach((a) => {
  const target = LINKS[a.dataset.link];
  if (target) a.href = target;
});
// Dibuka lewat file:// tidak bisa deep-link ke /dashboard (butuh server).
if (IS_FILE) {
  document.querySelectorAll('[data-link="cms"]').forEach((a) => {
    a.title = "Buka lewat server untuk masuk langsung ke /dashboard";
  });
}

const IMG = (u, w = 800) => `${u}?w=${w}&q=80`;
const rp = (n) => "IDR " + n.toLocaleString("id-ID");

/* ── Tour keberangkatan 2026 ─────────────────────────────────── */
const TOURS = [
  {
    country: "Korea Selatan", date: "23 Okt 2026", days: 7,
    title: "7 Hari South Korea — Incheon, Nami Island & Mt. Seorak",
    price: 22500000, seats: 6,
    img: "https://images.unsplash.com/photo-1538485399081-7191377e8241",
  },
  {
    country: "China", date: "11 & 14 Sep · 23 & 27 Okt 2026", days: 11,
    title: "11 Hari Chongqing + Gunung Avatar Zhangjiajie + Chengdu",
    price: 22500000, seats: 4,
    img: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d",
  },
  {
    country: "China", date: "8 Sep · 25 Okt · 14 Nov 2026", days: 9,
    title: "9 Hari Changsha, Fenghuang, Furong, Zhangjiajie & Changde",
    price: 17500000, seats: 9,
    img: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b",
  },
  {
    country: "New Zealand", date: "7 Nov 2026", days: 12,
    title: "12 Hari New Zealand North & South Island",
    price: null, seats: 8,
    img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad",
  },
];

/* ── Destinasi populer ───────────────────────────────────────── */
const DESTS = [
  { name: "Jepang", region: "Asia Timur", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e" },
  { name: "Korea Selatan", region: "Asia Timur", img: "https://images.unsplash.com/photo-1517154421773-0529f29ea451" },
  { name: "China", region: "Asia Timur", img: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d" },
  { name: "Eropa Barat", region: "Benua Eropa", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34" },
  { name: "Turki", region: "Asia Barat", img: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b" },
  { name: "New Zealand", region: "Oseania", img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad" },
];

/* ── Testimoni (contoh) ──────────────────────────────────────── */
const REVIEWS = [
  { text: "Perencanaannya rapi dari awal. Semua pertanyaan kami dijawab cepat, dan selama di sana tour leader-nya sangat membantu.", who: "Lisna Z.", trip: "Tour Korea Selatan" },
  { text: "Pengurusan visa keluarga kami dibantu sampai detail dokumennya. Prosesnya jauh lebih tenang dibanding urus sendiri.", who: "Willy C.", trip: "Visa Schengen" },
  { text: "Harga tiketnya masuk akal dan tim-nya responsif waktu kami perlu ubah jadwal mendadak. Recommended.", who: "Darius O.", trip: "Tiket & Hotel" },
];

/* ── Artikel ─────────────────────────────────────────────────── */
const NEWS = [
  { tag: "Info Visa", date: "2 Juni 2026", title: "Layanan visa global untuk berbagai negara",
    sum: "Ringkasan syarat dan alur pengajuan visa untuk destinasi yang paling sering ditanyakan.",
    img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828" },
  { tag: "Aturan Baru", date: "22 Mei 2026", title: "Sistem ETIAS Uni Eropa mulai berlaku akhir 2026",
    sum: "Apa yang berubah untuk pemegang paspor Indonesia yang bepergian ke kawasan Schengen.",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34" },
  { tag: "Cruise", date: "30 April 2026", title: "Ocean cruise atau river cruise — mana yang cocok?",
    sum: "Perbedaan rute, kapal dan suasana, supaya Anda tidak salah pilih untuk liburan pertama.",
    img: "https://images.unsplash.com/photo-1548574505-5e239809ee19" },
];

/* ── Render ──────────────────────────────────────────────────── */
const el = (id) => document.getElementById(id);

el("tourGrid").innerHTML = TOURS.map((t) => `
  <article class="tour">
    <div class="tour__media">
      <img src="${IMG(t.img, 640)}" alt="${t.country}" loading="lazy" decoding="async" />
      <span class="tour__country">${t.country}</span>
      <span class="tour__days">${t.days} hari</span>
    </div>
    <div class="tour__body">
      <p class="tour__date">${t.date}</p>
      <h3 class="tour__title">${t.title}</h3>
      <div class="tour__foot">
        <p class="tour__price">${t.price ? rp(t.price) : "Hubungi kami"}<small>${t.price ? "per orang" : "untuk harga terbaru"}</small></p>
        ${t.seats <= 6 ? `<span class="tour__seat">Sisa ${t.seats} kursi</span>` : ""}
      </div>
    </div>
  </article>`).join("");

el("destGrid").innerHTML = DESTS.map((d) => `
  <a class="dest" href="#kontak" aria-label="Tanya paket ke ${d.name}">
    <img src="${IMG(d.img, 500)}" alt="${d.name}" loading="lazy" decoding="async" />
    <span class="dest__ov"></span>
    <span class="dest__txt"><b>${d.name}</b><span>${d.region}</span></span>
  </a>`).join("");

el("revGrid").innerHTML = REVIEWS.map((r) => `
  <article class="rev">
    <p class="rev__stars" aria-label="5 dari 5 bintang">★★★★★</p>
    <p>“${r.text}”</p>
    <div class="rev__who">
      <span class="rev__av" aria-hidden="true">${r.who.charAt(0)}</span>
      <span><b>${r.who}</b><span>${r.trip}</span></span>
    </div>
  </article>`).join("");

el("newsGrid").innerHTML = NEWS.map((n) => `
  <a class="news" href="#artikel">
    <div class="news__media"><img src="${IMG(n.img, 640)}" alt="" loading="lazy" decoding="async" /></div>
    <div class="news__body">
      <p class="news__meta">${n.tag} · ${n.date}</p>
      <h3>${n.title}</h3>
      <p>${n.sum}</p>
    </div>
  </a>`).join("");

/* ── Nav: shadow on scroll + mobile menu ─────────────────────── */
const nav = el("nav");
const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

const toggle = el("navToggle");
const links = el("navLinks");
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

/* ── Reveal on scroll ────────────────────────────────────────── */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) {
  document.querySelectorAll(".reveal").forEach((n) => n.classList.add("is-in"));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((n) => io.observe(n));
}

/* ── Count-up stats ──────────────────────────────────────────── */
const stats = document.querySelectorAll("[data-count]");
if (reduced) {
  stats.forEach((n) => { n.textContent = fmtStat(+n.dataset.count, n.dataset.suffix); });
} else {
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const node = en.target;
      const target = +node.dataset.count;
      const started = performance.now();
      const dur = 1200;
      const step = (now) => {
        const p = Math.min(1, (now - started) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = fmtStat(Math.round(target * eased), node.dataset.suffix);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      sio.unobserve(node);
    });
  }, { threshold: 0.5 });
  stats.forEach((n) => sio.observe(n));
}
// `data-suffix=""` opts a stat out of the "+" (e.g. an exact office count).
function fmtStat(n, suffix) {
  const plus = suffix === undefined ? "+" : suffix;
  return n >= 1000 ? Math.round(n / 1000) + ".000" + plus : n + plus;
}

/* ── Hero search → filters the tour list ─────────────────────── */
el("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const dest = el("s-dest").value.trim().toLowerCase();
  const hint = el("searchHint");

  if (!dest) {
    hint.textContent = "Ketik nama destinasi untuk melihat paket yang tersedia.";
    return;
  }
  const hits = TOURS.filter((t) => `${t.country} ${t.title}`.toLowerCase().includes(dest));
  hint.textContent = hits.length
    ? `${hits.length} paket ditemukan untuk “${el("s-dest").value.trim()}”.`
    : `Belum ada paket ${el("s-dest").value.trim()} yang tayang — hubungi kami untuk penawaran khusus.`;
  document.getElementById(hits.length ? "tour" : "kontak").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
});

/* ── Contact form (demo — no backend) ────────────────────────── */
el("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const status = el("formStatus");
  const name = f.name.value.trim();
  const phone = f.phone.value.trim();

  if (!name || !phone) {
    status.className = "form__status err";
    status.textContent = "Mohon isi nama dan nomor WhatsApp Anda.";
    return;
  }
  status.className = "form__status ok";
  status.textContent = `Terima kasih, ${name.split(" ")[0]}! Tim kami akan menghubungi Anda di ${phone}.`;
  f.reset();
});

el("yr").textContent = new Date().getFullYear();
