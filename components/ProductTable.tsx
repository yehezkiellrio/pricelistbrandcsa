'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { effectivePrice, formatRupiah } from '@/lib/products';

type Props = { products: Product[]; brands: string[]; categories: string[] };

export default function ProductTable({ products, brands, categories }: Props) {
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const haystack = [product.brand, product.category, product.name, product.sku, product.minimum_order]
        .filter(Boolean).join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && (!brand || product.brand === brand) && (!category || product.category === category);
    });
  }, [products, query, brand, category]);

  return (
    <>
      <div className="filter-card">
        <div className="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/></svg><input aria-label="Cari produk" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk, brand, atau SKU" /></div>
        <select aria-label="Filter brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Semua brand</option>{brands.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Filter kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="result-meta"><strong>{filtered.length}</strong> hasil</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Produk</th><th>SKU</th><th>Satuan</th><th>Harga Aktif</th><th>Min. Order</th><th></th></tr></thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <td><strong>{product.name || 'Tanpa nama'}</strong><small>{product.brand || '—'} · {product.category || '—'}</small></td>
                <td>{product.sku || '—'}</td><td>{product.unit || '—'}</td>
                <td><strong>{formatRupiah(effectivePrice(product))}</strong>{product.program_price && <small className="program-label">harga program</small>}</td>
                <td>{product.minimum_order || '—'}</td>
                <td><Link className="text-link" href={`/master-harga/${product.id}`}>Detail →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="product-cards">
        {filtered.map((product) => <Link className="product-card" href={`/master-harga/${product.id}`} key={product.id}><div><span>{product.brand || product.category || 'Produk'}</span><strong>{product.name || 'Tanpa nama'}</strong><small>{[product.sku, product.unit, product.minimum_order].filter(Boolean).join(' · ')}</small></div><div className="card-price"><strong>{formatRupiah(effectivePrice(product))}</strong><span>›</span></div></Link>)}
      </div>
    </>
  );
}
