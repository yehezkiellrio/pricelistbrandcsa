'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { AdminPanelProps } from '@/components/admin/AdminCatalogManager';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function AdminSkuPanel({ catalog, productId, reload }: AdminPanelProps) {
  const client = createBrowserSupabaseClient();
  const skus = useMemo(() => catalog.skus.filter((sku) => sku.product_id === productId), [catalog.skus, productId]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const editing = skus.find((sku) => sku.id === editingId) ?? null;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;
    const form = event.currentTarget;
    setBusy(true);
    setMessage('');
    const data = new FormData(form);
    const payload = {
      product_id: productId,
      code: String(data.get('code') ?? '').trim() || null,
      name: String(data.get('name') ?? '').trim(),
      description: String(data.get('description') ?? '').trim() || null,
      is_active: data.get('is_active') === 'on',
    };
    try {
      if (!payload.name) throw new Error('nama sku wajib diisi');
      if (editing) {
        const { error } = await client.from('product_skus').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('product_skus').insert({
          ...payload,
          sort_order: Math.max(0, ...skus.map((sku) => sku.sort_order)) + 1,
        });
        if (error) throw error;
      }
      setEditingId(null);
      await reload(productId);
      setMessage('sku tersimpan');
      form.reset();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'gagal menyimpan sku');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: number, isActive: boolean) => {
    if (!client) return;
    const { error } = await client.from('product_skus').update({ is_active: !isActive }).eq('id', id);
    if (error) setMessage(error.message);
    else await reload(productId);
  };

  return <div className="admin-panel-stack">
    <div className="admin-section-head"><div><h3>SKU produk</h3><p>Satu tipe atau ukuran dapat memiliki banyak motif, warna, atau kode barang.</p></div><strong>{skus.length}</strong></div>
    <div className="admin-record-list">
      {skus.length === 0 && <div className="admin-empty-row">Belum ada SKU. Tambahkan SKU pertama di bawah.</div>}
      {skus.map((sku) => <div className={!sku.is_active ? 'inactive' : ''} key={sku.id}><div><span>{sku.code || 'Tanpa kode'}</span><strong>{sku.name}</strong>{sku.description && <small>{sku.description}</small>}</div><div className="record-actions"><button onClick={() => setEditingId(sku.id)}>Edit</button><button onClick={() => void toggle(sku.id, sku.is_active)}>{sku.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></div></div>)}
    </div>
    <form className="admin-form compact" key={editing?.id ?? 'new-sku'} onSubmit={save}>
      <div className="admin-form-intro"><h3>{editing ? 'Edit SKU' : 'Tambah SKU'}</h3></div>
      <div className="admin-form-grid">
        <label><span>Kode SKU</span><input name="code" defaultValue={editing?.code ?? ''} placeholder="opsional" /></label>
        <label><span>Nama SKU</span><input name="name" defaultValue={editing?.name ?? ''} placeholder="contoh: carrara white" required /></label>
        <label className="wide"><span>Keterangan</span><input name="description" defaultValue={editing?.description ?? ''} /></label>
      </div>
      <label className="switch-field"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /><span>SKU aktif</span></label>
      <div className="admin-form-actions"><button className="save" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan SKU' : 'Tambah SKU'}</button>{editing && <button type="button" onClick={() => setEditingId(null)}>Batal</button>}{message && <span>{message}</span>}</div>
    </form>
  </div>;
}
