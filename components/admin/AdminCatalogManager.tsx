'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/components/AuthProvider';
import { useCatalog } from '@/components/CatalogProvider';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { fetchAdminCatalog, type AdminCatalog } from '@/lib/admin';
import AdminProductPanel from '@/components/admin/AdminProductPanel';
import AdminSkuPanel from '@/components/admin/AdminSkuPanel';
import AdminPricePanel from '@/components/admin/AdminPricePanel';
import AdminImagePanel from '@/components/admin/AdminImagePanel';

export type AdminPanelProps = {
  catalog: AdminCatalog;
  productId: number;
  reload: (preferredProductId?: number) => Promise<void>;
};

type Tab = 'product' | 'sku' | 'price' | 'image';

export default function AdminCatalogManager() {
  const client = createBrowserSupabaseClient();
  const { username, signOut } = useAdminAuth();
  const { refresh: refreshPublicCatalog } = useCatalog();
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('product');
  const [error, setError] = useState('');

  const reload = useCallback(async (preferredProductId?: number) => {
    if (!client) return;
    setError('');
    try {
      const next = await fetchAdminCatalog(client);
      setCatalog(next);
      setCreating(false);
      setSelectedId((current) => {
        const preferred = preferredProductId ?? current;
        return preferred && next.products.some((product) => product.id === preferred)
          ? preferred
          : next.products[0]?.id ?? null;
      });
      await refreshPublicCatalog();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'gagal memuat katalog');
    }
  }, [client, refreshPublicCatalog]);

  useEffect(() => { void reload(); }, [reload]);

  const brands = useMemo(() => new Map(catalog?.brands.map((brand) => [brand.id, brand.name]) ?? []), [catalog]);
  const categories = useMemo(() => new Map(catalog?.categories.map((category) => [category.id, category.name]) ?? []), [catalog]);
  const filtered = useMemo(() => {
    if (!catalog) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return catalog.products;
    return catalog.products.filter((product) => [
      product.name,
      brands.get(product.brand_id ?? -1),
      categories.get(product.category_id ?? -1),
    ].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [brands, catalog, categories, query]);

  const selectProduct = (id: number) => {
    setSelectedId(id);
    setCreating(false);
    setTab('product');
  };

  if (!catalog) return <div className="shell admin-loading">{error || 'Memuat katalog…'}</div>;
  const selected = catalog.products.find((product) => product.id === selectedId) ?? null;

  return <div className="shell admin-page">
    <div className="admin-page-head">
      <div><span className="eyebrow">MODE ADMIN</span><h1>Kelola Katalog</h1></div>
      <div className="admin-account"><span>{username}</span><button onClick={() => void signOut()}>Keluar</button></div>
    </div>
    {error && <div className="admin-alert">{error}<button onClick={() => void reload()}>Coba lagi</button></div>}
    <div className="admin-workspace">
      <aside className="admin-product-list">
        <div className="admin-list-tools">
          <input aria-label="Cari produk" placeholder="Cari produk" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button onClick={() => { setCreating(true); setSelectedId(null); setTab('product'); }}>+ Produk</button>
        </div>
        <div className="admin-list-scroll">
          {filtered.map((product) => {
            const skuCount = catalog.skus.filter((sku) => sku.product_id === product.id).length;
            const imageCount = catalog.images.filter((image) => image.product_id === product.id).length;
            return <button className={selectedId === product.id && !creating ? 'active' : ''} key={product.id} onClick={() => selectProduct(product.id)}>
              <span>{brands.get(product.brand_id ?? -1) ?? 'Tanpa brand'}</span>
              <strong>{product.name}</strong>
              <small>{skuCount} SKU · {imageCount} gambar{!product.is_active ? ' · nonaktif' : ''}</small>
            </button>;
          })}
        </div>
      </aside>
      <section className="admin-editor">
        {creating ? <AdminProductPanel key="new-product" catalog={catalog} product={null} reload={reload} /> : selected ? <>
          <div className="admin-editor-title"><div><span>{brands.get(selected.brand_id ?? -1) ?? 'Produk'}</span><h2>{selected.name}</h2></div><a href={`/master-harga/${catalog.prices.find((price) => price.product_id === selected.id)?.legacy_id ?? ''}`} target="_blank">Lihat publik ↗</a></div>
          <div className="admin-tabs" role="tablist">
            {([['product', 'Produk'], ['sku', 'SKU'], ['price', 'Harga'], ['image', 'Gambar']] as [Tab, string][]).map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
          </div>
          {tab === 'product' && <AdminProductPanel key={selected.id} catalog={catalog} product={selected} reload={reload} />}
          {tab === 'sku' && <AdminSkuPanel catalog={catalog} productId={selected.id} reload={reload} />}
          {tab === 'price' && <AdminPricePanel catalog={catalog} productId={selected.id} reload={reload} />}
          {tab === 'image' && <AdminImagePanel catalog={catalog} productId={selected.id} reload={reload} />}
        </> : <div className="admin-empty">Pilih produk untuk mulai mengedit.</div>}
      </section>
    </div>
  </div>;
}
