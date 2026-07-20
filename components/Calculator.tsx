'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { effectivePrice, formatRupiah } from '@/lib/products';

export default function Calculator({ products }: { products: Product[] }) {
  const eligible = useMemo(() => products.filter((p) => effectivePrice(p) !== null), [products]);
  const [productId, setProductId] = useState(String(eligible[0]?.id ?? ''));
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const product = eligible.find((p) => String(p.id) === productId);
  const base = product ? effectivePrice(product) ?? 0 : 0;
  const finalUnit = Math.max(0, base - discount);
  const total = finalUnit * Math.max(0, qty || 0);

  const copyOffer = async () => {
    if (!product) return;
    const text = `Selamat siang Pak/Bu, untuk ${product.name} saat ini harga ${formatRupiah(finalUnit)}/${product.unit || 'unit'}. Untuk pengambilan ${qty} ${product.unit || 'unit'}, totalnya ${formatRupiah(total)}. Barangkali berminat, untuk pengiriman bisa kami koordinasikan.`;
    await navigator.clipboard.writeText(text);
    alert('Penawaran berhasil disalin.');
  };

  return (
    <div className="calculator-grid">
      <section className="panel form-panel">
        <label>Produk<select value={productId} onChange={(e) => setProductId(e.target.value)}>{eligible.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name}{p.minimum_order ? ` (${p.minimum_order})` : ''}</option>)}</select></label>
        <label>Jumlah<input type="number" min="0" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <label>Potongan per unit (Rp)<input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></label>
      </section>
      <section className="panel calc-result">
        <span>Harga dasar</span><strong>{formatRupiah(base)}</strong>
        <span>Harga setelah potongan</span><strong>{formatRupiah(finalUnit)}</strong>
        <span>Jumlah</span><strong>{qty} {product?.unit || 'unit'}</strong>
        <div className="total-line"><span>Total estimasi</span><strong>{formatRupiah(total)}</strong></div>
        <button onClick={copyOffer}>Copy penawaran WhatsApp</button>
        <small>Perhitungan ini estimasi berdasarkan master harga. Verifikasi kebijakan pajak, ongkir, dan program sebelum dikirim ke customer.</small>
      </section>
    </div>
  );
}
