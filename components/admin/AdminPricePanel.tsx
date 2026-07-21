'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { AdminPanelProps } from '@/components/admin/AdminCatalogManager';
import { createBrowserSupabaseClient } from '@/lib/supabase';

const rupiah = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const nullableNumber = (data: FormData, key: string) => {
  const value = String(data.get(key) ?? '').trim();
  return value === '' ? null : Number(value);
};
const nullableText = (data: FormData, key: string) => String(data.get(key) ?? '').trim() || null;

export default function AdminPricePanel({ catalog, productId, reload }: AdminPanelProps) {
  const client = createBrowserSupabaseClient();
  const prices = useMemo(() => catalog.prices.filter((price) => price.product_id === productId), [catalog.prices, productId]);
  const skus = useMemo(() => catalog.skus.filter((sku) => sku.product_id === productId), [catalog.skus, productId]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const editing = prices.find((price) => price.id === editingId) ?? null;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage('');
    const payload = {
      product_id: productId,
      sku_id: nullableNumber(data, 'sku_id'),
      list_price: nullableNumber(data, 'list_price'),
      discount_text: nullableText(data, 'discount_text'),
      net_price: nullableNumber(data, 'net_price'),
      program_price: nullableNumber(data, 'program_price'),
      minimum_order: nullableText(data, 'minimum_order'),
      area: nullableText(data, 'area'),
      promo_valid_until: nullableText(data, 'promo_valid_until'),
      source: nullableText(data, 'source') ?? 'Master Pricelist Admin',
      note: nullableText(data, 'note'),
      is_active: data.get('is_active') === 'on',
    };

    try {
      if (payload.list_price === null && payload.net_price === null && payload.program_price === null) throw new Error('isi minimal satu harga');
      if (editing) {
        const { error } = await client.from('price_tiers').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('price_tiers').insert({
          ...payload,
          sort_order: Math.max(0, ...prices.map((price) => price.sort_order)) + 1,
        });
        if (error) throw error;
      }
      setEditingId(null);
      await reload(productId);
      setMessage('harga tersimpan');
      form.reset();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'gagal menyimpan harga');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: number, isActive: boolean) => {
    if (!client) return;
    const { error } = await client.from('price_tiers').update({ is_active: !isActive }).eq('id', id);
    if (error) setMessage(error.message);
    else await reload(productId);
  };

  return <div className="admin-panel-stack">
    <div className="admin-section-head"><div><h3>Tier harga</h3><p>Harga tanpa SKU berlaku umum. Pilih SKU jika harganya khusus motif tertentu.</p></div><strong>{prices.length}</strong></div>
    <div className="admin-record-list prices">
      {prices.map((price) => {
        const sku = skus.find((item) => item.id === price.sku_id);
        return <div className={!price.is_active ? 'inactive' : ''} key={price.id}><div><span>{sku ? `SKU · ${sku.name}` : price.minimum_order || 'Harga umum'}</span><strong>{rupiah(price.program_price ?? price.net_price ?? price.list_price)}</strong><small>{[price.area, price.promo_valid_until ? `promo s.d. ${price.promo_valid_until}` : null].filter(Boolean).join(' · ')}</small></div><div className="record-actions"><button onClick={() => setEditingId(price.id)}>Edit</button><button onClick={() => void toggle(price.id, price.is_active)}>{price.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></div></div>;
      })}
    </div>
    <form className="admin-form compact" key={editing?.id ?? 'new-price'} onSubmit={save}>
      <div className="admin-form-intro"><h3>{editing ? 'Edit harga' : 'Tambah harga'}</h3></div>
      <div className="admin-form-grid three">
        <label className="wide"><span>Berlaku untuk</span><select name="sku_id" defaultValue={editing?.sku_id ?? ''}><option value="">Semua SKU / umum</option>{skus.map((sku) => <option key={sku.id} value={sku.id}>{sku.code ? `${sku.code} — ` : ''}{sku.name}</option>)}</select></label>
        <label><span>Harga list</span><input type="number" min="0" name="list_price" defaultValue={editing?.list_price ?? ''} /></label>
        <label><span>Harga net</span><input type="number" min="0" name="net_price" defaultValue={editing?.net_price ?? ''} /></label>
        <label><span>Harga program</span><input type="number" min="0" name="program_price" defaultValue={editing?.program_price ?? ''} /></label>
        <label><span>Diskon</span><input name="discount_text" defaultValue={editing?.discount_text ?? ''} /></label>
        <label><span>Minimum order</span><input name="minimum_order" defaultValue={editing?.minimum_order ?? ''} /></label>
        <label><span>Area</span><input name="area" defaultValue={editing?.area ?? ''} /></label>
        <label><span>Promo berlaku sampai</span><input type="date" name="promo_valid_until" defaultValue={editing?.promo_valid_until ?? ''} /></label>
        <label><span>Sumber</span><input name="source" defaultValue={editing?.source ?? 'Master Pricelist Admin'} /></label>
        <label className="wide"><span>Catatan</span><input name="note" defaultValue={editing?.note ?? ''} /></label>
      </div>
      <label className="switch-field"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /><span>Harga aktif</span></label>
      <div className="admin-form-actions"><button className="save" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan harga' : 'Tambah harga'}</button>{editing && <button type="button" onClick={() => setEditingId(null)}>Batal</button>}{message && <span>{message}</span>}</div>
    </form>
  </div>;
}
