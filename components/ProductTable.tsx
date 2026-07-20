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
        <input aria-label="Cari produk" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk, brand, SKU, minimum order..." />
        <select aria-label="Filter brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Semua brand</option>{brands.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Filter kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="result-meta">Menampilkan <strong>{filtered.length}</strong> dari {products.length} baris harga</div>
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
    </>
  );
}
