import rawProducts from '@/data/products.json';
import type { Product } from '@/lib/types';

export const products = rawProducts as Product[];

export const brands = Array.from(
  new Set(products.map((p) => p.brand).filter(Boolean) as string[]),
).sort((a, b) => a.localeCompare(b));

export const categories = Array.from(
  new Set(products.map((p) => p.category).filter(Boolean) as string[]),
).sort((a, b) => a.localeCompare(b));

export function getProduct(id: number) {
  return products.find((product) => product.id === id);
}

export function effectivePrice(product: Product): number | null {
  return product.program_price ?? product.net_price ?? product.list_price ?? null;
}

export function formatRupiah(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}
