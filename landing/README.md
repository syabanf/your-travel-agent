# Landing Page — Icon Holiday Indonesia

Company-profile website yang tampil **sebelum** pengunjung masuk ke aplikasi.
Berdiri sendiri: HTML + CSS + JS biasa, **tanpa build step**, tanpa dependency.

Landing memegang **root** (`/`), sedangkan aplikasi ada di `/app/` dan CMS di
`/admin`. Membuka `/` akan diarahkan ke `/landing/`. Aturan yang sama berlaku di
`npm run dev` maupun hasil `npm run build`.

```
landing/
├── index.html            ← beranda
├── layanan.html          ← tour · tiket · visa · hotel · cruise
├── tour.html             ← daftar paket (filter per kawasan)
│   └── tour-detail.html  ← ?id= — itinerary harian, termasuk/tidak, harga
├── destinasi.html        ← daftar destinasi
│   └── destinasi-detail.html ← ?id= — info perjalanan + paket terkait
├── visa.html             ← negara yang dilayani (akordion + pencarian)
├── galeri.html           ← galeri foto + lightbox
├── artikel.html          ← daftar artikel (filter per topik)
│   └── artikel-detail.html   ← ?id= — isi artikel
├── tentang.html          ← profil perusahaan
├── kontak.html           ← formulir + kantor Medan & Jakarta
│
├── data.js      ← SEMUA konten (tour, destinasi, artikel, layanan, visa, galeri, testimoni, profil)
├── common.js    ← header, footer, ikon, menu, animasi — dipakai semua halaman
├── script.js    ← khusus beranda
├── styles.css   ← desain (mengikuti design system aplikasi)
└── README.md
```

## Menjalankan

```bash
npm run dev
```

Lalu buka <http://localhost:5173> — otomatis ke `/landing/`. Aplikasi di `/app/`, CMS di `/admin`.

Setelah `npm run build`, halaman ini otomatis ikut ter-copy ke `dist/landing/`.

## Isi halaman

### Beranda

| Bagian | Keterangan |
|---|---|
| Hero | Headline + pencarian destinasi & tanggal, statistik perusahaan |
| Layanan | Paket Tour · Tiket Pesawat · Visa · Hotel · Cruise |
| Tour 2026 | Kartu keberangkatan dengan harga, durasi, sisa kursi |
| Mengapa Icon Holiday | Tiga nilai utama |
| Destinasi | Grid destinasi populer |
| Testimoni | Ulasan pelanggan (contoh) |
| Artikel | Info perjalanan terbaru |
| Tentang | Profil singkat + keunggulan |
| Masuk ke Sistem | Dua kartu portal: **Aplikasi Traveler** dan **CMS / Portal Admin** |
| Kontak | Formulir + kantor Medan & Jakarta + jam operasional |

## Mengubah konten

Semua konten ada di **`data.js`** — satu file, dipakai seluruh halaman. Ubah di
sini, seluruh situs ikut berubah:

- `TOURS` — paket (`price: null` → "Hubungi kami"; `seats <= 6` → badge sisa kursi; `itinerary`, `includes`, `excludes`, `gallery` mengisi halaman detail)
- `DESTS` — destinasi (`best`, `visa`, `currency` tampil di halaman detail)
- `SERVICES` — layanan (mengisi beranda, `layanan.html`, dan menu footer)
- `VISA_COUNTRIES` — negara di `visa.html`
- `NEWS` — artikel (`body` = array paragraf untuk halaman detail)
- `GALLERY`, `REVIEWS`, `COMPANY` — galeri, testimoni, dan profil/kantor

Menambah paket atau artikel cukup menambah satu objek — halaman daftar **dan**
halaman detailnya langsung ikut.

Menu utama dan footer diatur di `common.js` (`const NAV`).

## Tombol pindah ke Aplikasi / CMS

**Header hanya menampilkan "Buka Aplikasi".** CMS sengaja tidak dipasang di menu
atas — aksesnya lewat **`/admin`** (ada di footer dan di bagian "Masuk ke
Sistem" pada beranda). `/admin` diarahkan ke `/dashboard` oleh aplikasi.

Tandai tautan dengan `data-link="app"` atau `data-link="cms"`; `common.js`
mengisi `href`-nya. Tautan yang disuntikkan belakangan oleh script halaman juga
tetap bekerja (ada penangkap klik terdelegasi), atau panggil `window.wireLinks()`
setelah render.

| Kondisi | Aplikasi | CMS |
|---|---|---|
| Di-serve bersama aplikasi (default) | `/app/` | `/admin` |
| Di-deploy terpisah | `${ICON_APP_ORIGIN}/` | `${ICON_APP_ORIGIN}/admin` |
| Dibuka via `file://` | `../../index.html` | `../../index.html` * |

\* Deep-link butuh server (aplikasi memakai BrowserRouter, bukan hash routing),
jadi lewat `file://` tombol CMS hanya membuka aplikasi.

Kalau landing di-deploy terpisah dari aplikasi, set origin-nya sebelum
`script.js` di `index.html`:

```html
<script>window.ICON_APP_ORIGIN = "https://app.iconholiday.id"</script>
<script src="./script.js"></script>
```

## Catatan

- **Formulir kontak belum terhubung ke backend.** Submit hanya menampilkan pesan
  konfirmasi di layar. Sambungkan ke email/CRM/WhatsApp API sebelum dipakai
  sungguhan.
- Nomor telepon, alamat kantor dan tautan media sosial diambil dari profil
  perusahaan — periksa kembali sebelum publikasi.
- Nomor pada tombol WhatsApp mengambang masih **placeholder**
  (`wa.me/6281200000000`) — ganti dengan nomor asli.
- Testimoni adalah **contoh**, bukan kutipan pelanggan sungguhan.
- Foto memakai Unsplash (hotlink). Untuk produksi, unduh dan taruh di
  `landing/assets/` agar tidak bergantung pada layanan luar.
