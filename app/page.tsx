import Link from 'next/link';
import StatCard from '@/components/StatCard';
import { brands, categories, products } from '@/lib/products';

export default function Dashboard() {
  const withSku = products.filter((p) => p.sku).length;
  const withProgram = products.filter((p) => p.program_price !== null).length;
  const brandCounts = brands.map((brand) => ({ brand, count: products.filter((p) => p.brand === brand).length })).sort((a, b) => b.count - a.count).slice(0, 6);
  return <div className="shell page-stack">
    <section className="hero"><div><span className="eyebrow">CSA WONOGIRI · JULI 2026</span><h1>Satu tempat untuk cek harga seluruh produk.</h1><p>Cari harga lebih cepat, lihat tier program, dan hitung estimasi order sebelum penawaran ke customer.</p><div className="hero-actions"><Link className="button primary" href="/master-harga">Cari harga</Link><Link className="button secondary" href="/kalkulator">Hitung order</Link></div></div></section>
    <section className="stats-grid"><StatCard label="Total baris harga" value={products.length} hint="Sumber master Excel"/><StatCard label="Brand" value={brands.length}/><StatCard label="Kategori" value={categories.length}/><StatCard label="Harga program" value={withProgram} hint={`${withSku} baris memiliki SKU`}/></section>
    <section className="panel"><div className="section-head"><div><span className="eyebrow">RINGKASAN</span><h2>Brand dengan data terbanyak</h2></div><Link className="text-link" href="/master-harga">Lihat semua →</Link></div><div className="brand-list">{brandCounts.map((item) => <div key={item.brand}><span>{item.brand}</span><strong>{item.count}</strong></div>)}</div></section>
    <section className="note-card"><strong>Catatan data</strong><p>Harga aktif di aplikasi diprioritaskan dari harga program, lalu harga net, lalu harga list. Untuk produk bertingkat seperti Blesscon, setiap minimum order tetap disimpan sebagai baris harga terpisah agar tidak kehilangan konteks tier.</p></section>
  </div>;
}
