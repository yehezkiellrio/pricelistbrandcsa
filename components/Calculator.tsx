'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { effectivePrice, formatRupiah } from '@/lib/products';

export default function Calculator({ products }: { products: Product[] }) {
  const eligible = useMemo(() => products.filter((p) => effectivePrice(p) !== null), [products]);
  const [productId, setProductId] = useState(String(eligible[0]?.id ?? ''));
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [copied, setCopied] = useState(false);
  const product = eligible.find((p) => String(p.id) === productId);
  const base = product ? effectivePrice(product) ?? 0 : 0;
  const finalUnit = Math.max(0, base - discount);
  const total = finalUnit * Math.max(0, qty || 0);

  const copyOffer = async () => {
    if (!product) return;
    const text = `Selamat siang Pak/Bu, untuk ${product.name} saat ini harga ${formatRupiah(finalUnit)}/${product.unit || 'unit'}. Untuk pengambilan ${qty} ${product.unit || 'unit'}, totalnya ${formatRupiah(total)}. Barangkali berminat, untuk pengiriman bisa kami koordinasikan.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="calculator-grid">
      <section className="panel form-panel">
        <label><span>Produk</span><select value={productId} onChange={(e) => setProductId(e.target.value)}>{eligible.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name}{p.minimum_order ? ` (${p.minimum_order})` : ''}</option>)}</select></label>
        <div className="input-row"><label><span>Jumlah</span><input type="number" min="0" inputMode="numeric" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label><label><span>Potongan/unit</span><input type="number" min="0" inputMode="numeric" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></label></div>
      </section>
      <section className="panel calc-result">
        <span>Harga dasar</span><strong>{formatRupiah(base)}</strong>
        <span>Harga setelah potongan</span><strong>{formatRupiah(finalUnit)}</strong>
        <span>Jumlah</span><strong>{qty} {product?.unit || 'unit'}</strong>
        <div className="total-line"><span>Total estimasi</span><strong>{formatRupiah(total)}</strong></div>
        <button onClick={copyOffer}>{copied ? 'Tersalin' : 'Salin penawaran'}</button>
      </section>
    </div>
  );
}
