export type Product = {
  id: number;
  brand: string | null;
  category: string | null;
  name: string | null;
  sku: string | null;
  unit: string | null;
  packaging: string | number | null;
  list_price: number | null;
  discount: string | number | null;
  net_price: number | null;
  tax: string | number | null;
  program_price: number | null;
  minimum_order: string | null;
  source: string;
  price_per_piece?: number | null;
  price_per_sqm?: number | null;
  price_per_meter?: number | null;
  promo_valid_until?: string | null;
  sku_name?: string | null;
  image_paths?: string[];
};

export type CatalogSource = 'bundled' | 'cache' | 'supabase';

export type CatalogSnapshot = {
  version: number;
  updatedAt: string | null;
  products: Product[];
};
