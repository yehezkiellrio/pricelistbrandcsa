import ProductTable from '@/components/ProductTable';
import { brands, categories, products } from '@/lib/products';
export default function MasterHargaPage() { return <div className="shell page-stack"><div className="page-title"><span className="eyebrow">296 BARIS HARGA</span><h1>Master Harga</h1><p>Cari berdasarkan produk, brand, SKU, kategori, atau minimum order.</p></div><ProductTable products={products} brands={brands} categories={categories}/></div>; }
