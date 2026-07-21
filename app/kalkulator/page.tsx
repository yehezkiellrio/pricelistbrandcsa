'use client';

import Calculator from '@/components/Calculator';
import { useCatalog } from '@/components/CatalogProvider';

export default function KalkulatorPage() {
  const { products } = useCatalog();
  return <div className="shell page-stack"><div className="page-title"><h1>Kalkulator</h1></div><Calculator products={products}/></div>;
}
