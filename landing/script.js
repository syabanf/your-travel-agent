/* ================================================================
   Icon Holiday: the home page. Every block renders from data.js;
   header, footer, icons, menu, reveal and the year come from
   common.js. Load after both.
   ================================================================ */

const el = (id) => document.getElementById(id);
const IMG = (u, w = 800) => (u.includes("?") ? u : `${u}?w=${w}&q=80`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const arrow = `<svg class="i"><use href="#i-arrow"/></svg>`;

// Dates in data.js read "23 Oct 2026"; parse them by hand so every browser agrees.
const parseDate = (s) => {
  const [d, m, y] = String(s).split(" ");
  const mi = MONTHS.indexOf(String(m).slice(0, 3));
  return mi < 0 ? null : new Date(Number(y), mi, Number(d));
};
const today = new Date(new Date().toDateString());
const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const detail = (t) => `tour-detail.html?id=${encodeURIComponent(t.id)}`;

// Each tour with its first departure still ahead, soonest first.
const upcoming = window.TOURS
  .map((t) => ({ ...t, next: t.dates.map(parseDate).filter((d) => d && d >= today).sort((a, b) => a - b)[0] }))
  .filter((t) => t.next)
  .sort((a, b) => a.next - b.next);

/* ── Hero corner: the next departure ───────────────────────── */
const first = upcoming[0];
if (first) {
  const corner = el("heroNext");
  corner.href = detail(first);
  corner.innerHTML = `<span class="hero2__card">
    <span class="hero2__thumbs">${upcoming.slice(0, 3).map((t) => `<img src="${IMG(t.img, 120)}" alt="" />`).join("")}</span>
    <span class="hero2__next">
      <b>Next departure</b>
      <span>${esc(first.country)} · ${fmt(first.next)} · ${first.seats} seats left</span>
    </span>
    <span class="round round--ink" aria-hidden="true">${arrow}</span></span>`;
  corner.setAttribute("aria-label", `Next departure: ${first.title}, ${fmt(first.next)}, ${first.seats} seats left`);
} else {
  el("heroNext").remove();
}

/* ── Destinations carousel ─────────────────────────────────── */
const slider = el("destGrid");
slider.innerHTML = window.DESTS.map((d) => `
  <a class="place2" href="destinasi-detail.html?id=${encodeURIComponent(d.id)}">
    <img src="${IMG(d.img, 560)}" alt="${esc(d.name)}" loading="lazy" decoding="async" />
    <span class="place2__row">
      <b>${esc(d.name)}</b>
      <span class="place2__tag">${esc(d.region)}</span>
    </span>
    <span class="place2__meta"><svg class="i"><use href="#i-cal"/></svg> ${esc(d.best)}</span>
  </a>`).join("");
const step = () => (slider.firstElementChild?.getBoundingClientRect().width || 300) + 16;
const slide = (dir) => slider.scrollBy({ left: dir * step(), behavior: window.REDUCED ? "auto" : "smooth" });
el("destPrev").addEventListener("click", () => slide(-1));
el("destNext").addEventListener("click", () => slide(1));

/* ── Promo: the soonest departure with a reduced price ─────── */
const deal = upcoming.find((t) => t.price && t.priceBefore > t.price);
if (deal) {
  const off = Math.round((1 - deal.price / deal.priceBefore) * 100);
  el("promo").innerHTML = `
    <img class="promo__img" src="${IMG(deal.gallery?.[1] || deal.img, 900)}" alt="${esc(deal.country)}" loading="lazy" />
    <div class="promo__text">
      <p class="kicker">Limited seats · ${esc(deal.country)}</p>
      <h2>${esc(deal.title)}</h2>
      <p>${esc(deal.summary)}</p>
    </div>
    <a class="promo__bar" href="${detail(deal)}">
      <span class="promo__off">${off}% off</span>
      <span class="promo__price"><b>${rp(deal.price)}</b><s>${rp(deal.priceBefore)}</s></span>
      <span class="promo__when">Departs ${fmt(deal.next)} · ${deal.seats} seats left</span>
      <span class="promo__go">Reserve a seat ${arrow}</span>
    </a>`;
} else {
  el("promo").remove();
}

/* ── Departure cards ───────────────────────────────────────── */
el("tourGrid").innerHTML = upcoming.slice(0, 3).map((t) => `
  <a class="card trip" href="${detail(t)}">
    <span class="trip__media">
      <img src="${IMG(t.img, 640)}" alt="${esc(t.country)}" loading="lazy" decoding="async" />
      <span class="trip__days">${t.days} days</span>
    </span>
    <span class="trip__country">${esc(t.country)} · ${fmt(t.next)}</span>
    <b class="trip__title">${esc(t.title)}</b>
    <span class="trip__sum">${esc(t.summary)}</span>
    <span class="trip__foot">
      <span class="trip__seats${t.seats <= 6 ? " is-low" : ""}">${t.seats} seats left</span>
      <span class="trip__price">${t.price ? rp(t.price) : "On request"}</span>
    </span>
  </a>`).join("") || `<p class="block__sub">No departures are scheduled right now. <a href="kontak.html">Ask about a private trip.</a></p>`;

/* ── Reviews: the middle one on ink ────────────────────────── */
el("revGrid").innerHTML = window.REVIEWS.slice(0, 3).map((r, i) => `
  <figure class="card voice3${i === 1 ? " voice3--on" : ""}">
    <span class="voice3__stars" role="img" aria-label="5 out of 5">★★★★★</span>
    <blockquote>${esc(r.text)}</blockquote>
    <figcaption>
      <span class="voice3__av" aria-hidden="true">${esc(r.who.charAt(0))}</span>
      <span><b>${esc(r.who)}</b><span>${esc(r.trip)}</span></span>
    </figcaption>
  </figure>`).join("");

/* ── Closing call: WhatsApp ────────────────────────────────── */
el("closerWa").href = `https://wa.me/${window.COMPANY.wa}`;
