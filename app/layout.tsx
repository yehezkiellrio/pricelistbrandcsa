import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'CSA Master Pricelist',
  description: 'Master pricelist produk CSA Wonogiri',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/csa-logo.svg' },
  appleWebApp: { capable: true, title: 'CSA Pricelist', statusBarStyle: 'default' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><PwaRegister/><Header /><main>{children}</main></body></html>;
}
