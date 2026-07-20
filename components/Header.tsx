import Link from 'next/link';

export default function Header() {
  return (
    <header className="topbar">
      <div className="shell nav-wrap">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">CSA</span>
          <span><strong>Master Harga</strong><small>Wonogiri</small></span>
        </Link>
        <nav>
          <Link href="/">Dashboard</Link>
          <Link href="/master-harga">Master Harga</Link>
          <Link href="/kalkulator">Kalkulator</Link>
        </nav>
      </div>
    </header>
  );
}
