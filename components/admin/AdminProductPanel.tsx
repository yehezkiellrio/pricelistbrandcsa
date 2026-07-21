'use client';

import { FormEvent, useState } from 'react';
import type { AdminCatalog, AdminProduct } from '@/lib/admin';
import { createBrowserSupabaseClient } from '@/lib/supabase';

type Props = {
  catalog: AdminCatalog;
  product: AdminProduct | null;
  reload: (preferredProductId?: number) => Promise<void>;
};

const optional = (data: FormData, key: string) => String(data.get(key) ?? '').trim() || null;

export default function AdminProductPanel({ catalog, product, reload }: Props) {
  const client = createBrowserSupabaseClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    const payload = {
      brand_id: optional(data, 'brand_id') ? Number(data.get('brand_id')) : null,
      category_id: optional(data, 'category_id') ? Number(data.get('category_id')) : null,
      name: String(data.get('name') ?? '').trim(),
      size_label: optional(data, 'size_label'),
      unit: optional(data, 'unit'),
      packaging: optional(data, 'packaging'),
      tax_note: optional(data, 'tax_note'),
      description: optional(data, 'description'),
      source: optional(data, 'source') ?? 'Master Pricelist Admin',
      is_active: data.get('is_active') === 'on',
    };

    try {
      if (!payload.name) throw new Error('nama produk wajib diisi');
      if (product) {
        const { error } = await client.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
        await reload(product.id);
      } else {
        const { data: created, error } = await client.from('products').insert({
          ...payload,
          sort_order: Math.max(0, ...catalog.products.map((item) => item.sort_order)) + 1,
        }).select('id').single();
        if (error) throw error;
        await reload(Number(created.id));
      }
      setMessage('perubahan tersimpan');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'gagal menyimpan produk');
    } finally {
      setBusy(false);
    }
  };

  const addLookup = async (table: 'brands' | 'categories', label: string) => {
    if (!client) return;
    const name = window.prompt(`Nama ${label}`)?.trim();
    if (!name) return;
    const { error } = await client.from(table).insert({ name });
    if (error) setMessage(error.message.includes('duplicate') ? `${label} sudah ada` : error.message);
    else await reload(product?.id);
  };

  return <form className="admin-form" onSubmit={save}>
    {!product && <div className="admin-form-intro"><h2>Produk baru</h2><p>Buat tipe atau ukuran utama. SKU dan gambar ditambahkan setelah produk tersimpan.</p></div>}
    <div className="admin-form-grid">
      <label className="wide"><span>Nama produk</span><input name="name" defaultValue={product?.name ?? ''} required /></label>
      <label><span>Brand</span><div className="field-with-action"><select name="brand_id" defaultValue={product?.brand_id ?? ''}><option value="">Tanpa brand</option>{catalog.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><button type="button" onClick={() => void addLookup('brands', 'brand')}>+</button></div></label>
      <label><span>Kategori</span><div className="field-with-action"><select name="category_id" defaultValue={product?.category_id ?? ''}><option value="">Tanpa kategori</option>{catalog.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button type="button" onClick={() => void addLookup('categories', 'kategori')}>+</button></div></label>
      <label><span>Ukuran</span><input name="size_label" defaultValue={product?.size_label ?? ''} placeholder="contoh: 50x50" /></label>
      <label><span>Satuan</span><input name="unit" defaultValue={product?.unit ?? ''} placeholder="dus, pcs, sak" /></label>
      <label className="wide"><span>Isi kemasan</span><input name="packaging" defaultValue={product?.packaging ?? ''} /></label>
      <label><span>PPN</span><input name="tax_note" defaultValue={product?.tax_note ?? ''} /></label>
      <label><span>Sumber</span><input name="source" defaultValue={product?.source ?? 'Master Pricelist Admin'} /></label>
      <label className="wide"><span>Keterangan</span><textarea name="description" defaultValue={product?.description ?? ''} rows={3} /></label>
    </div>
    <label className="switch-field"><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} /><span>Produk aktif dan tampil di aplikasi</span></label>
    <div className="admin-form-actions"><button className="save" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : product ? 'Simpan produk' : 'Buat produk'}</button>{message && <span>{message}</span>}</div>
  </form>;
}
