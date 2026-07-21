import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import PwaRegister from '@/components/PwaRegister';
import CatalogProvider from '@/components/CatalogProvider';

export const metadata: Metadata = {
  title: 'CSA Master Pricelist',
  description: 'Master pricelist produk CSA Wonogiri',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/csa-logo.svg' },
  appleWebApp: { capable: true, title: 'CSA Pricelist', statusBarStyle: 'default' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><PwaRegister/><CatalogProvider><Header /><main>{children}</main></CatalogProvider></body></html>;
}
