import Link from 'next/link';
import { notFound } from 'next/navigation';
import { effectivePrice, formatRupiah, getProduct } from '@/lib/products';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) notFound();
  const fields = [
    ['Brand', product.brand], ['Kategori', product.category], ['SKU / Kode Barang', product.sku], ['Satuan', product.unit],
    ['Isi Kemasan', product.packaging], ['Minimum Order', product.minimum_order], ['Diskon', product.discount], ['PPN', product.tax],
  ];
  return <div className="shell page-stack"><Link className="text-link" href="/master-harga">← Kembali ke master harga</Link><section className="detail-hero"><span className="eyebrow">{product.brand || 'PRODUK'}</span><h1>{product.name}</h1><p>{product.category}</p><div className="active-price"><span>Harga aktif</span><strong>{formatRupiah(effectivePrice(product))}</strong>{product.program_price && <small>menggunakan harga program</small>}</div></section><section className="price-grid"><div className="price-box"><span>Harga List</span><strong>{formatRupiah(product.list_price)}</strong></div><div className="price-box"><span>Harga Net</span><strong>{formatRupiah(product.net_price)}</strong></div><div className="price-box featured"><span>Harga Program</span><strong>{formatRupiah(product.program_price)}</strong></div></section><section className="panel"><h2>Detail produk</h2><div className="detail-grid">{fields.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div></section><div className="note-card"><strong>Sumber</strong><p>{product.source}. Harga perlu diverifikasi kembali bila terdapat program terbaru atau kebijakan khusus customer.</p></div></div>;
}
