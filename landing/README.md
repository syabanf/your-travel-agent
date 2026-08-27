# Landing Page — Icon Holiday Indonesia

Company-profile website yang tampil **sebelum** pengunjung masuk ke aplikasi.
Berdiri sendiri: HTML + CSS + JS biasa, **tanpa build step**, tanpa dependency.

```
landing/
├── index.html   ← seluruh struktur halaman
├── styles.css   ← desain (mengikuti design system aplikasi)
├── script.js    ← konten (tour, destinasi, artikel) + interaksi
└── README.md
```

## Menjalankan

Buka `index.html` langsung di browser, atau lewat server statis:

```bash
cd landing && python3 -m http.server 5190
```

Lalu buka <http://127.0.0.1:5190>.

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
| CTA Aplikasi | Tautan ke aplikasi traveler & portal agen |
| Kontak | Formulir + kantor Medan & Jakarta + jam operasional |

## Mengubah konten

Konten ditaruh sebagai array di bagian atas `script.js` — tidak perlu menyentuh HTML:

- `TOURS` — paket keberangkatan (`price: null` menampilkan "Hubungi kami"; `seats <= 6` memunculkan badge sisa kursi)
- `DESTS` — destinasi populer
- `REVIEWS` — testimoni
- `NEWS` — artikel

Teks tetap (headline, layanan, tentang, kontak) ada di `index.html`.

## Tautan ke aplikasi

Tombol **Buka Aplikasi** dan **Portal Agen** menunjuk ke `../index.html`
(aplikasi React di root repo). Sesuaikan bila landing di-deploy terpisah —
ganti `../index.html` dengan URL aplikasi, mis. `https://app.iconholiday.id`.

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
