'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCatalog } from '@/components/CatalogProvider';
import { effectivePrice, formatRupiah } from '@/lib/products';

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(images[0]);
  useEffect(() => setSelected(images[0]), [images]);
  if (images.length === 0) return null;
  return <section className="panel public-gallery"><div className="gallery-main"><img src={selected} alt={name} /></div>{images.length > 1 && <div className="gallery-thumbs">{images.map((image, index) => <button className={selected === image ? 'active' : ''} key={image} onClick={() => setSelected(image)}><img src={image} alt={`${name} ${index + 1}`} loading="lazy" /></button>)}</div>}</section>;
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const { products } = useCatalog();
  const product = products.find((item) => item.id === Number(params.id));

  if (!product) return <div className="shell page-stack"><a className="back-link" href="/master-harga"><span>‹</span> Master Pricelist</a><section className="panel"><h2>Produk tidak ditemukan</h2></section></div>;

  const fields = [
    ['Brand', product.brand], ['Kategori', product.category], ['SKU / Kode Barang', product.sku], ['Nama SKU', product.sku_name], ['Satuan', product.unit],
    ['Isi Kemasan', product.packaging], ['Minimum Order', product.minimum_order], ['Diskon', product.discount], ['PPN', product.tax],
  ];
  const alternatePrices = [
    ['Harga/pcs', product.price_per_piece],
    ['Harga/m²', product.price_per_sqm],
    ['Harga/m', product.price_per_meter],
  ].filter(([, value]) => value !== null && value !== undefined);
  const images = product.image_paths ?? [];
  const skus = product.skus ?? [];

  return <div className="shell page-stack product-detail">
    <a className="back-link" href="/master-harga"><span>‹</span> Master Pricelist</a>
    <section className="detail-hero"><span className="eyebrow">{product.brand || 'PRODUK'}</span><h1>{product.name}</h1><p>{product.category}</p><div className="active-price"><span>Harga aktif</span><strong>{formatRupiah(effectivePrice(product))}</strong>{product.program_price !== null && <small>{product.promo_valid_until ? 'Harga promo aktif' : 'Harga program'}</small>}</div></section>
    <ProductGallery images={images} name={product.name ?? 'Produk'} />
    <section className="price-grid"><div className="price-box"><span>Harga list</span><strong>{formatRupiah(product.list_price)}</strong></div><div className="price-box"><span>Harga net</span><strong>{formatRupiah(product.net_price)}</strong></div><div className="price-box featured"><span>Harga program</span><strong>{formatRupiah(product.program_price)}</strong></div>{alternatePrices.map(([label, value]) => <div className="price-box" key={String(label)}><span>{label}</span><strong>{formatRupiah(value as number)}</strong></div>)}</section>
    {skus.length > 0 && <section className="panel public-skus"><div className="section-head"><h2>SKU</h2><span>{skus.length} pilihan</span></div><div className="public-sku-grid">{skus.map((sku) => <article key={sku.id}>{sku.image_paths[0] && <img src={sku.image_paths[0]} alt={sku.name} loading="lazy" />}<div><span>{sku.code || 'SKU'}</span><strong>{sku.name}</strong>{sku.description && <small>{sku.description}</small>}</div></article>)}</div></section>}
    <section className="panel"><h2>Detail</h2><div className="detail-grid">{fields.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div></section>
  </div>;
}
