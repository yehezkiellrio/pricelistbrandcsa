import ProductTable from '@/components/ProductTable';
import { brands, categories, products } from '@/lib/products';
export default function MasterHargaPage() { return <div className="shell page-stack"><div className="page-title"><h1>Master Harga</h1></div><ProductTable products={products} brands={brands} categories={categories}/></div>; }
