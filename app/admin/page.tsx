'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/AuthProvider';
import AdminCatalogManager from '@/components/admin/AdminCatalogManager';

export default function AdminPage() {
  const { status } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') router.replace('/admin/login');
  }, [router, status]);

  if (status !== 'admin') return <div className="shell admin-loading">Memeriksa akses admin…</div>;
  return <AdminCatalogManager />;
}
