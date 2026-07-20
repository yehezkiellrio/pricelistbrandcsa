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
  return <div className="shell page-stack product-detail"><Link className="back-link" href="/master-harga"><span>‹</span> Master Harga</Link><section className="detail-hero"><span className="eyebrow">{product.brand || 'PRODUK'}</span><h1>{product.name}</h1><p>{product.category}</p><div className="active-price"><span>Harga aktif</span><strong>{formatRupiah(effectivePrice(product))}</strong>{product.program_price && <small>Harga program</small>}</div></section><section className="price-grid"><div className="price-box"><span>Harga list</span><strong>{formatRupiah(product.list_price)}</strong></div><div className="price-box"><span>Harga net</span><strong>{formatRupiah(product.net_price)}</strong></div><div className="price-box featured"><span>Harga program</span><strong>{formatRupiah(product.program_price)}</strong></div></section><section className="panel"><h2>Detail</h2><div className="detail-grid">{fields.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div></section></div>;
}
