'use client';

import { useCatalog } from '@/components/CatalogProvider';

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
};

export default function CatalogStatus() {
  const { configured, source, status, updatedAt, refresh } = useCatalog();
  const date = formatDate(updatedAt);
  const busy = status === 'checking' || status === 'syncing';

  let label = 'data bawaan';
  if (!configured) label = 'supabase belum terhubung';
  else if (status === 'checking') label = 'memeriksa pembaruan';
  else if (status === 'syncing') label = 'mengunduh data terbaru';
  else if (status === 'offline') label = date ? `offline · data ${date}` : 'offline · data bawaan';
  else if (status === 'error') label = 'sinkronisasi gagal · coba lagi';
  else if (date) label = `data diperbarui ${date}`;
  else if (source === 'cache') label = 'menggunakan data tersimpan';

  return (
    <button
      className={`catalog-status ${status}`}
      type="button"
      onClick={() => void refresh()}
      disabled={!configured || busy || status === 'offline'}
      aria-live="polite"
    >
      <span aria-hidden="true" />
      {label}
    </button>
  );
}
