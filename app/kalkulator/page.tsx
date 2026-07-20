import Calculator from '@/components/Calculator';
import { products } from '@/lib/products';
export default function KalkulatorPage() { return <div className="shell page-stack"><div className="page-title"><h1>Kalkulator</h1></div><Calculator products={products}/></div>; }
