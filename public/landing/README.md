# Landing Page — Icon Holiday Indonesia

Company-profile website yang tampil **sebelum** pengunjung masuk ke aplikasi.
Berdiri sendiri: HTML + CSS + JS biasa, **tanpa build step**, tanpa dependency.

Folder ini ada di `public/` supaya di-serve dari origin yang sama dengan
aplikasi — dengan begitu tombol **Buka Aplikasi** (`/`) dan **CMS**
(`/dashboard`) benar-benar berfungsi, baik saat `npm run dev` maupun di hasil
`npm run build`.

```
public/landing/
├── index.html   ← seluruh struktur halaman
├── styles.css   ← desain (mengikuti design system aplikasi)
├── script.js    ← konten (tour, destinasi, artikel) + interaksi
└── README.md
```

## Menjalankan

```bash
npm run dev
```

Lalu buka <http://localhost:5173/landing/>. Aplikasi ada di `/`, CMS di `/dashboard`.

Setelah `npm run build`, halaman ini otomatis ikut ter-copy ke `dist/landing/`.

## Isi halaman

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

Konten ditaruh sebagai array di bagian atas `script.js` — tidak perlu menyentuh HTML:

- `TOURS` — paket keberangkatan (`price: null` menampilkan "Hubungi kami"; `seats <= 6` memunculkan badge sisa kursi)
- `DESTS` — destinasi populer
- `REVIEWS` — testimoni
- `NEWS` — artikel

Teks tetap (headline, layanan, tentang, kontak) ada di `index.html`.

## Tombol pindah ke Aplikasi / CMS

Ada tombol di tiga tempat: **navbar** (CMS + Buka Aplikasi), bagian **"Masuk ke
Sistem"** (dua kartu portal), dan **footer**.

Semua tautan itu ditandai `data-link="app"` atau `data-link="cms"`, lalu
`script.js` mengisi `href`-nya otomatis:

| Kondisi | Aplikasi | CMS |
|---|---|---|
| Di-serve bersama aplikasi (default) | `/` | `/dashboard` |
| Di-deploy terpisah | `${ICON_APP_ORIGIN}/` | `${ICON_APP_ORIGIN}/dashboard` |
| Dibuka via `file://` | `../../index.html` | `../../index.html` * |

\* Deep-link ke `/dashboard` butuh server (aplikasi memakai BrowserRouter, bukan
hash routing), jadi lewat `file://` tombol CMS hanya membuka aplikasi.

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
