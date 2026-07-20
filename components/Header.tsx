"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Beranda', icon: 'home' },
  { href: '/master-harga', label: 'Harga', icon: 'search' },
  { href: '/kalkulator', label: 'Kalkulator', icon: 'calculator' },
];

function NavIcon({ name }: { name: string }) {
  if (name === 'home') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.1a1.1 1.1 0 0 1-1.1 1.1h-5.3v-6.7H9.4V21H4.1A1.1 1.1 0 0 1 3 19.9Z"/></svg>;
  if (name === 'search') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16.2 16.2 4.5 4.5"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3"/><path d="M7.5 6.5h9M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h.01M16 18.5h.01"/></svg>;
}

export default function Header() {
  const pathname = usePathname();
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className="topbar">
        <div className="shell nav-wrap">
          <Link href="/" className="brand-lockup" aria-label="CSA Master Harga">
            <Image src="/csa-logo.svg" alt="PT Catur Sentosa Adiprana Tbk" width={184} height={58} priority />
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {items.map((item) => <Link key={item.href} className={active(item.href) ? 'active' : ''} href={item.href}>{item.label}</Link>)}
          </nav>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Navigasi utama">
        {items.map((item) => <Link key={item.href} className={active(item.href) ? 'active' : ''} href={item.href}><NavIcon name={item.icon}/><span>{item.label}</span></Link>)}
      </nav>
    </>
  );
}
