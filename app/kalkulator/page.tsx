import Calculator from '@/components/Calculator';
import { products } from '@/lib/products';
export default function KalkulatorPage() { return <div className="shell page-stack"><div className="page-title"><span className="eyebrow">SALES TOOL</span><h1>Kalkulator Order</h1><p>Hitung estimasi nilai order dan copy template penawaran untuk WhatsApp.</p></div><Calculator products={products}/></div>; }
