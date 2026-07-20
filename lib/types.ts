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
};
