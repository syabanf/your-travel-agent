/* ================================================================
   Icon Holiday — perilaku khusus halaman depan.
   Konten datang dari data.js; header, footer, ikon, menu, reveal dan
   tahun copyright ditangani common.js. Muat setelah keduanya.
   ================================================================ */

const el = (id) => document.getElementById(id);
const IMG = (u, w = 800) => (u.includes("?") ? u : `${u}?w=${w}&q=80`);

/* ── Tour pilihan (4 teratas) ───────────────────────────────── */
el("tourGrid").innerHTML = window.TOURS.slice(0, 4).map((t) => `
  <a class="tour" href="tour-detail.html?id=${encodeURIComponent(t.id)}">
    <div class="tour__media">
      <img src="${IMG(t.img, 640)}" alt="${esc(t.country)}" loading="lazy" decoding="async" />
      <span class="tour__country">${esc(t.country)}</span>
      <span class="tour__days">${t.days} hari</span>
    </div>
    <div class="tour__body">
      <p class="tour__date">${esc(t.dates[0])}${t.dates.length > 1 ? ` +${t.dates.length - 1} tanggal` : ""}</p>
      <h3 class="tour__title">${esc(t.title)}</h3>
      <div class="tour__foot">
        <p class="tour__price">${t.price ? rp(t.price) : "Hubungi kami"}<small>${t.price ? "per orang" : "untuk harga terbaru"}</small></p>
        ${t.seats <= 6 ? `<span class="tour__seat">Sisa ${t.seats} kursi</span>` : ""}
      </div>
    </div>
  </a>`).join("");

/* ── Destinasi populer ──────────────────────────────────────── */
el("destGrid").innerHTML = window.DESTS.slice(0, 6).map((d) => `
  <a class="dest" href="destinasi-detail.html?id=${encodeURIComponent(d.id)}" aria-label="Lihat destinasi ${esc(d.name)}">
    <img src="${IMG(d.img, 500)}" alt="${esc(d.name)}" loading="lazy" decoding="async" />
    <span class="dest__ov"></span>
    <span class="dest__txt"><b>${esc(d.name)}</b><span>${esc(d.region)}</span></span>
  </a>`).join("");

/* ── Testimoni ──────────────────────────────────────────────── */
el("revGrid").innerHTML = window.REVIEWS.slice(0, 3).map((r) => `
  <article class="rev">
    <p class="rev__stars" aria-label="5 dari 5 bintang">★★★★★</p>
    <p>“${esc(r.text)}”</p>
    <div class="rev__who">
      <span class="rev__av" aria-hidden="true">${esc(r.who.charAt(0))}</span>
      <span><b>${esc(r.who)}</b><span>${esc(r.trip)}</span></span>
    </div>
  </article>`).join("");

/* ── Artikel terbaru ────────────────────────────────────────── */
el("newsGrid").innerHTML = window.NEWS.slice(0, 3).map((n) => `
  <a class="news" href="artikel-detail.html?id=${encodeURIComponent(n.id)}">
    <div class="news__media"><img src="${IMG(n.img, 640)}" alt="" loading="lazy" decoding="async" /></div>
    <div class="news__body">
      <p class="news__meta">${esc(n.tag)} · ${esc(n.date)}</p>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.sum)}</p>
    </div>
  </a>`).join("");

window.initReveal();

/* ── Statistik menghitung naik ──────────────────────────────── */
// `data-suffix=""` mematikan tanda "+" (mis. jumlah kantor yang pasti).
function fmtStat(n, suffix) {
  const plus = suffix === undefined ? "+" : suffix;
  return n >= 1000 ? Math.round(n / 1000) + ".000" + plus : n + plus;
}
const stats = document.querySelectorAll("[data-count]");
if (window.REDUCED) {
  stats.forEach((n) => { n.textContent = fmtStat(+n.dataset.count, n.dataset.suffix); });
} else {
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const node = en.target;
      const target = +node.dataset.count;
      const started = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - started) / 1200);
        node.textContent = fmtStat(Math.round(target * (1 - Math.pow(1 - p, 3))), node.dataset.suffix);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      sio.unobserve(node);
    });
  }, { threshold: 0.5 });
  stats.forEach((n) => sio.observe(n));
}

/* ── Pencarian di hero ──────────────────────────────────────── */
el("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = el("s-dest").value.trim();
  const hint = el("searchHint");

  if (!raw) {
    hint.textContent = "Ketik nama destinasi untuk melihat paket yang tersedia.";
    return;
  }
  const q = raw.toLowerCase();
  const hits = window.TOURS.filter((t) => `${t.country} ${t.region} ${t.title}`.toLowerCase().includes(q));

  if (hits.length) {
    // Lanjutkan ke halaman tour dengan filter sudah terisi.
    location.href = `tour.html?q=${encodeURIComponent(raw)}`;
    return;
  }
  hint.textContent = `Belum ada paket ${raw} yang tayang — hubungi kami untuk penawaran khusus.`;
  document.getElementById("kontak").scrollIntoView({ behavior: window.REDUCED ? "auto" : "smooth" });
});

/* ── Formulir kontak (demo — belum terhubung backend) ───────── */
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
