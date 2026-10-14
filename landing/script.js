/* ================================================================
   Icon Holiday: the home page. Every block renders from data.js;
   header, footer, icons, menu, reveal and the year come from
   common.js. Load after both.
   ================================================================ */

const el = (id) => document.getElementById(id);
const IMG = (u, w = 800) => (u.includes("?") ? u : `${u}?w=${w}&q=80`);
const MONTHS = window.MONTHS;

const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const detail = (t) => `tour-detail.html?id=${encodeURIComponent(t.id)}`;

// Every future departure, one per date, soonest first.
const departures = window.TOURS
  .flatMap((t) => t.dates.filter(isUpcoming).map((s) => ({ t, date: parseDate(s) })))
  .sort((a, b) => a.date - b.date);

/* ── Departure board ───────────────────────────────────────── */
el("boardRows").innerHTML = departures.slice(0, 6).map(({ t, date }) => `
  <li>
    <a class="board__row" href="${detail(t)}">
      <span class="board__date">${fmt(date)}</span>
      <span class="board__dest"><b>${esc(t.country)}</b><span>${t.days} days</span></span>
      <span class="board__seats${t.seats <= 6 ? " is-low" : ""}">${t.seats <= 6 ? `${t.seats} left` : "Open"}</span>
    </a>
  </li>`).join("") || `<li class="board__empty">No group dates right now. Ask us about a private trip.</li>`;

/* ── One route in full: the next departure's itinerary ─────── */
const lead = departures[0]?.t;
if (lead) {
  const off = lead.priceBefore > lead.price ? Math.round((1 - lead.price / lead.priceBefore) * 100) : 0;
  const dates = departures.filter((x) => x.t === lead).map((x) => fmt(x.date));
  el("tour").innerHTML = `
    <div class="route__media">
      <img src="${IMG(lead.gallery?.[1] || lead.img, 1400)}" alt="${esc(lead.country)}" loading="lazy" />
      ${off ? `<span class="route__off">${off}% off until the seats go</span>` : ""}
    </div>
    <div class="route__body">
      <p class="route__eyebrow">${esc(lead.country)} · ${lead.days} days · leaves ${dates.join(", ")}</p>
      <h2 id="route-title">${esc(lead.title)}</h2>
      <ol class="route__days">
        ${lead.itinerary.map((d) => `<li><span class="route__d">Day ${d.d}</span><b>${esc(d.t)}</b><span>${esc(d.x)}</span></li>`).join("")}
      </ol>
      <div class="route__foot">
        <div class="route__price">
          <b>${lead.price ? rp(lead.price) : "Price on request"}</b>
          <span>${off ? `<s>${rp(lead.priceBefore)}</s> · ` : ""}per person, ${lead.seats} seats left</span>
        </div>
        <div class="route__incl">
          <p><b>Included</b> ${lead.includes.slice(0, 3).map(esc).join(", ")}</p>
          <p><b>Not included</b> ${lead.excludes.slice(0, 2).map(esc).join(", ")}</p>
        </div>
        <a class="btn btn--primary" href="${detail(lead)}">Full itinerary and booking</a>
      </div>
    </div>`;
} else {
  el("tour").remove();
}

/* ── Destinations with a 12-month strip ────────────────────── */
el("destGrid").innerHTML = window.DESTS.slice(0, 7).map((d, i) => {
  const on = bestMonths(d.best);
  return `
  <a class="tile2${i === 0 ? " tile2--big" : ""}" href="destinasi-detail.html?id=${encodeURIComponent(d.id)}">
    <img src="${IMG(d.img, i === 0 ? 1200 : 640)}" alt="" loading="lazy" decoding="async" />
    <span class="tile2__info">
      <b>${esc(d.name)}</b>
      <span class="months" role="img" aria-label="Best months: ${esc(d.best)}">
        ${MONTHS.map((m, k) => `<span class="${on.has(k) ? "is-on" : ""}">${m[0]}</span>`).join("")}
      </span>
    </span>
  </a>`;
}).join("");

/* ── Visa countries by region ──────────────────────────────── */
el("visaList").innerHTML = window.VISA_COUNTRIES.map((g) => `
  <div class="visa2__group">
    <h3>${esc(g.g)}</h3>
    <p>${g.c.map(esc).join(" · ")}</p>
  </div>`).join("");

/* ── Reviews: one quoted large, the rest as a list ─────────── */
const [first, ...rest] = window.REVIEWS;
el("revLead").innerHTML = `
  <blockquote>${esc(first.text)}</blockquote>
  <figcaption>${esc(first.who)}, ${esc(first.trip)}</figcaption>`;
el("revMore").innerHTML = rest.slice(0, 4).map((r) => `
  <li><p>${esc(r.text)}</p><span>${esc(r.who)}, ${esc(r.trip)}</span></li>`).join("");

/* ── Offices ───────────────────────────────────────────────── */
const company = window.COMPANY;
el("waLink").href = `https://wa.me/${company.wa}`;
el("officeList").innerHTML = company.offices.map((o) => `
  <div class="office2">
    <h3>${esc(o.city)}</h3>
    <a class="office2__tel" href="tel:${esc(o.telHref)}">${esc(o.tel)}</a>
    <p>${esc(o.addr)}</p>
    <p class="office2__legal">${esc(o.legal)}</p>
  </div>`).join("") + `
  <div class="office2">
    <h3>Hours</h3>
    ${company.hours.map((h) => `<p>${esc(h)}</p>`).join("")}
  </div>`;
