import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = { title: 'CSA Master Harga', description: 'Master harga produk CSA Wonogiri' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><Header /><main>{children}</main><footer className="shell footer">CSA Master Harga · Data awal Juli 2026</footer></body></html>;
}
