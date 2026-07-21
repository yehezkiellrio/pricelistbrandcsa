'use client';

import ProductTable from '@/components/ProductTable';
import { useCatalog } from '@/components/CatalogProvider';

export default function MasterHargaPage() {
  const { brands, categories, products } = useCatalog();
  return <div className="shell page-stack"><div className="page-title"><h1>Master Pricelist</h1></div><ProductTable products={products} brands={brands} categories={categories}/></div>;
}
