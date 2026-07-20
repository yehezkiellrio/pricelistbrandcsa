# CSA Master Harga — Wonogiri

MVP website master harga yang dibangun dari file **Master_Harga_All_Produk_CSA_Wonogiri_Juli_2026(1).xlsx**.

## Fitur MVP
- Dashboard ringkasan 296 baris harga dan 16 brand.
- Master harga dengan pencarian dan filter brand/kategori.
- Detail produk dan prioritas harga aktif: **Harga Program → Harga Net → Harga List**.
- Tier Blesscon tetap dipisah berdasarkan area/minimum order.
- Kalkulator order dan tombol copy template penawaran WhatsApp.
- Responsive untuk HP.
- Bisa langsung jalan memakai data JSON lokal, tanpa Supabase.
- Sudah disiapkan schema + script import untuk migrasi ke Supabase.

## Menjalankan lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000`.

## Deploy ke Vercel
1. Push folder ini ke GitHub/GitLab/Bitbucket.
2. Import repository tersebut dari dashboard Vercel.
3. Framework akan terdeteksi sebagai Next.js.
4. Deploy. Untuk mode data lokal, environment variable tidak diperlukan.

## Mengaktifkan Supabase (opsional tahap berikutnya)
1. Buat project Supabase.
2. Jalankan isi `supabase/schema.sql` melalui SQL Editor.
3. Salin `.env.example` menjadi `.env.local` dan isi URL, anon key, dan service role key.
4. Jalankan:
```bash
npm run import:supabase
```

> Service role key hanya untuk proses import lokal/server dan jangan pernah dimasukkan ke client-side code atau dipublikasikan.

Saat ini frontend membaca `data/products.json` agar deployment pertama langsung berfungsi. Langkah lanjutan adalah mengubah data layer agar membaca tabel `products` dari Supabase dan menambahkan login/role admin-supervisor-sales.

## Struktur penting
- `data/products.json` — hasil normalisasi 296 baris master Excel.
- `app/master-harga` — halaman pencarian/filter.
- `app/master-harga/[id]` — detail produk.
- `app/kalkulator` — kalkulator order.
- `supabase/schema.sql` — schema database awal.
- `scripts/import-to-supabase.mjs` — import JSON ke Supabase.
