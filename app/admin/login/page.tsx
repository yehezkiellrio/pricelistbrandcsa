'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/AuthProvider';

export default function AdminLoginPage() {
  const { signIn, status } = useAdminAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'admin') router.replace('/admin');
  }, [router, status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(username, password);
      router.replace('/admin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'login gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="shell admin-login-shell">
    <section className="admin-login-card">
      <a className="back-link" href="/"><span>‹</span> Kembali</a>
      <div className="admin-login-heading"><span className="admin-shield">⌾</span><h1>Mode Admin</h1><p>Masuk untuk mengelola produk, SKU, harga, dan gambar.</p></div>
      <form onSubmit={submit} className="admin-login-form">
        <label><span>Username</span><input autoCapitalize="none" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={submitting || status === 'loading'}>{submitting ? 'Memeriksa…' : 'Masuk'}</button>
      </form>
    </section>
  </div>;
}
