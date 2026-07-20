import StatCard from '@/components/StatCard';
import OfflineManager from '@/components/OfflineManager';
import { brands, categories, products } from '@/lib/products';

export default function Dashboard() {
  const withProgram = products.filter((p) => p.program_price !== null).length;
  const brandCounts = brands.map((brand) => ({ brand, count: products.filter((p) => p.brand === brand).length })).sort((a, b) => b.count - a.count).slice(0, 6);
  return <div className="shell page-stack dashboard">
    <section className="hero">
      <span className="eyebrow">CSA WONOGIRI</span>
      <h1>Master Pricelist</h1>
      <div className="hero-actions"><a className="button primary" href="/master-harga">Cari harga</a><a className="button secondary" href="/kalkulator">Kalkulator</a><OfflineManager routes={['/', '/master-harga', '/kalkulator', ...products.map((product) => `/master-harga/${product.id}`)]}/></div>
    </section>
    <section className="stats-grid"><StatCard label="Harga" value={products.length}/><StatCard label="Brand" value={brands.length}/><StatCard label="Kategori" value={categories.length}/><StatCard label="Program" value={withProgram}/></section>
    <section className="panel brand-panel"><div className="section-head"><h2>Brand</h2><a className="text-link" href="/master-harga">Lihat semua</a></div><div className="brand-list">{brandCounts.map((item) => <div key={item.brand}><span>{item.brand}</span><strong>{item.count}</strong></div>)}</div></section>
  </div>;
}
