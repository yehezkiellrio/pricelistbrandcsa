'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import type { AdminPanelProps } from '@/components/admin/AdminCatalogManager';
import { imageFileToWebp, type AdminImage } from '@/lib/admin';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function AdminImagePanel({ catalog, productId, reload }: AdminPanelProps) {
  const client = createBrowserSupabaseClient();
  const product = catalog.products.find((item) => item.id === productId)!;
  const skus = useMemo(() => catalog.skus.filter((sku) => sku.product_id === productId), [catalog.skus, productId]);
  const images = useMemo(() => catalog.images.filter((image) => image.product_id === productId), [catalog.images, productId]);
  const [target, setTarget] = useState('product');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!client || !event.target.files?.length) return;
    const input = event.target;
    const files = [...event.target.files].slice(0, 10);
    const skuId = target === 'product' ? null : Number(target);
    const targetImages = images.filter((image) => image.sku_id === skuId);
    setBusy(true);
    setMessage('');
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} bukan file gambar`);
        if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} terlalu besar`);
        setProgress(`Memproses ${index + 1}/${files.length}`);
        const converted = await imageFileToWebp(file);
        const path = `${productId}/${skuId ?? 'product'}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await client.storage.from('product-images').upload(path, converted.blob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const sku = skus.find((item) => item.id === skuId);
        const { error: insertError } = await client.from('product_images').insert({
          product_id: productId,
          sku_id: skuId,
          storage_path: path,
          alt_text: sku?.name ?? product.name,
          is_primary: targetImages.length === 0 && index === 0,
          sort_order: Math.max(0, ...targetImages.map((image) => image.sort_order)) + index + 1,
          width: converted.width,
          height: converted.height,
        });
        if (insertError) {
          await client.storage.from('product-images').remove([path]);
          throw insertError;
        }
      }
      await reload(productId);
      setMessage(`${files.length} gambar berhasil diunggah`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'gagal mengunggah gambar');
    } finally {
      setBusy(false);
      setProgress('');
      input.value = '';
    }
  };

  const setPrimary = async (image: AdminImage) => {
    if (!client) return;
    let query = client.from('product_images').update({ is_primary: false }).eq('product_id', productId);
    query = image.sku_id === null ? query.is('sku_id', null) : query.eq('sku_id', image.sku_id);
    const { error: resetError } = await query;
    if (resetError) return setMessage(resetError.message);
    const { error } = await client.from('product_images').update({ is_primary: true }).eq('id', image.id);
    if (error) setMessage(error.message);
    else await reload(productId);
  };

  const remove = async (image: AdminImage) => {
    if (!client || !window.confirm('Hapus gambar ini?')) return;
    const { error } = await client.from('product_images').delete().eq('id', image.id);
    if (error) return setMessage(error.message);
    await client.storage.from('product-images').remove([image.storage_path]);
    await reload(productId);
  };

  const move = async (image: AdminImage, direction: -1 | 1) => {
    if (!client) return;
    const sameTarget = images.filter((item) => item.sku_id === image.sku_id).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    const index = sameTarget.findIndex((item) => item.id === image.id);
    const other = sameTarget[index + direction];
    if (!other) return;
    const firstOrder = image.sort_order;
    await client.from('product_images').update({ sort_order: other.sort_order }).eq('id', image.id);
    await client.from('product_images').update({ sort_order: firstOrder }).eq('id', other.id);
    await reload(productId);
  };

  return <div className="admin-panel-stack">
    <div className="admin-section-head"><div><h3>Gambar produk dan SKU</h3><p>Gambar dikompres otomatis ke WebP. Maksimal 10 gambar sekali unggah.</p></div><strong>{images.length}</strong></div>
    <div className="image-upload-box">
      <label><span>Gambar untuk</span><select value={target} onChange={(event) => setTarget(event.target.value)}><option value="product">Produk utama</option>{skus.map((sku) => <option key={sku.id} value={sku.id}>{sku.code ? `${sku.code} — ` : ''}{sku.name}</option>)}</select></label>
      <label className={`image-drop ${busy ? 'busy' : ''}`}><input type="file" accept="image/*" multiple onChange={(event) => void upload(event)} disabled={busy} /><span>{busy ? progress : 'Pilih atau jatuhkan gambar'}</span><small>JPG, PNG, WebP · otomatis diperkecil</small></label>
      {message && <p className="admin-message">{message}</p>}
    </div>
    <div className="admin-image-groups">
      {[{ id: null, name: 'Produk utama' }, ...skus.map((sku) => ({ id: sku.id, name: sku.name }))].map((group) => {
        const groupImages = images.filter((image) => image.sku_id === group.id).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
        if (groupImages.length === 0) return null;
        return <section key={group.id ?? 'product'}><h4>{group.name}</h4><div className="admin-image-grid">{groupImages.map((image) => <article key={image.id}><div className="admin-image-preview"><img src={image.public_url} alt={image.alt_text ?? group.name} />{image.is_primary && <span>Utama</span>}</div><div className="image-actions"><button title="Geser kiri" onClick={() => void move(image, -1)}>←</button><button title="Geser kanan" onClick={() => void move(image, 1)}>→</button>{!image.is_primary && <button onClick={() => void setPrimary(image)}>Jadikan utama</button>}<button className="danger" onClick={() => void remove(image)}>Hapus</button></div></article>)}</div></section>;
      })}
    </div>
  </div>;
}
