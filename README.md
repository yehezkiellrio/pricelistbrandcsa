# CSA Master Pricelist — Wonogiri

Website master pricelist CSA Wonogiri dengan data Supabase, cache perangkat, dan fallback JSON lokal.

## Fitur

- 301 tier harga dari 288 produk utama.
- 18 brand dan 40 kategori.
- Struktur produk → banyak SKU → banyak gambar.
- Prioritas harga aktif: harga program → harga net → harga list.
- Tier minimum order tetap tersimpan terpisah.
- Pencarian, filter, detail produk, dan kalkulator.
- Sinkronisasi Supabase dengan indikator tanggal pembaruan.
- Tetap dapat dibuka saat offline setelah data tersimpan.
- JSON lokal tetap digunakan bila Supabase belum tersedia.
- Login mode admin melalui Supabase Auth.
- Kelola produk, SKU, tier harga, dan beberapa gambar langsung dari website.
- Gambar otomatis dikompres ke WebP dan dapat dipilih sebagai gambar utama.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Isi dua variabel publik berikut di `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Jangan menaruh secret key, service role, atau password database di frontend.

## Setup Supabase

1. Jalankan `supabase/schema.sql` melalui SQL Editor.
2. Jalankan `supabase/seed-products.sql` untuk mengimpor katalog awal.
3. Periksa hasil: 288 produk, 151 SKU lama, dan 301 tier harga.
4. Bucket `product-images` dibuat otomatis oleh schema.

## Akun admin

Form website menerima username dan memetakannya ke email internal
`username@admin.csa.local`. Buat akun tersebut melalui Supabase Auth, aktifkan
auto-confirm, kemudian ubah `profiles.role` menjadi `admin`.

Password tidak disimpan di source code dan selalu diverifikasi oleh Supabase.
Mode admin tersedia di `/admin`.

Jika `data/products.json` berubah, buat ulang seed dengan:

```bash
npm run generate:supabase-seed
```

## Deploy ke Vercel

Tambahkan environment variable berikut untuk Production, Preview, dan Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Setelah itu lakukan redeploy agar kedua nilai publik tertanam pada build frontend.

## Struktur penting

- `data/products.json` — fallback katalog lokal.
- `components/CatalogProvider.tsx` — sinkronisasi, cache, dan fallback.
- `lib/catalog.ts` — pengambilan serta normalisasi data Supabase.
- `supabase/schema.sql` — tabel, RLS, trigger versi, dan bucket gambar.
- `supabase/seed-products.sql` — data katalog awal.
- `public/sw.js` — cache PWA dan mode offline.
