import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminBrand = { id: number; name: string };
export type AdminCategory = { id: number; name: string };
export type AdminProduct = {
  id: number;
  brand_id: number | null;
  category_id: number | null;
  name: string;
  size_label: string | null;
  unit: string | null;
  packaging: string | null;
  tax_note: string | null;
  description: string | null;
  source: string | null;
  is_active: boolean;
  sort_order: number;
};
export type AdminSku = {
  id: number;
  product_id: number;
  code: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};
export type AdminImage = {
  id: number;
  product_id: number;
  sku_id: number | null;
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  public_url: string;
};
export type AdminPrice = {
  id: number;
  legacy_id: number | null;
  product_id: number;
  sku_id: number | null;
  list_price: number | null;
  discount_text: string | null;
  net_price: number | null;
  program_price: number | null;
  minimum_order: string | null;
  area: string | null;
  promo_valid_until: string | null;
  source: string | null;
  note: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AdminCatalog = {
  brands: AdminBrand[];
  categories: AdminCategory[];
  products: AdminProduct[];
  skus: AdminSku[];
  images: AdminImage[];
  prices: AdminPrice[];
};

const dataOrThrow = <T>(result: { data: T[] | null; error: { message: string } | null }, name: string) => {
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  return result.data ?? [];
};

export async function fetchAdminCatalog(client: SupabaseClient): Promise<AdminCatalog> {
  const [brands, categories, products, skus, images, prices] = await Promise.all([
    client.from('brands').select('id, name').order('name'),
    client.from('categories').select('id, name').order('name'),
    client.from('products').select('id, brand_id, category_id, name, size_label, unit, packaging, tax_note, description, source, is_active, sort_order').order('sort_order').order('name'),
    client.from('product_skus').select('id, product_id, code, name, description, is_active, sort_order').order('sort_order').order('name'),
    client.from('product_images').select('id, product_id, sku_id, storage_path, alt_text, is_primary, sort_order, width, height').order('sort_order').order('id'),
    client.from('price_tiers').select('id, legacy_id, product_id, sku_id, list_price, discount_text, net_price, program_price, minimum_order, area, promo_valid_until, source, note, is_active, sort_order').order('sort_order').order('id'),
  ]);

  const imageRows = dataOrThrow(images as { data: Omit<AdminImage, 'public_url'>[] | null; error: { message: string } | null }, 'product_images');
  return {
    brands: dataOrThrow(brands as { data: AdminBrand[] | null; error: { message: string } | null }, 'brands'),
    categories: dataOrThrow(categories as { data: AdminCategory[] | null; error: { message: string } | null }, 'categories'),
    products: dataOrThrow(products as { data: AdminProduct[] | null; error: { message: string } | null }, 'products'),
    skus: dataOrThrow(skus as { data: AdminSku[] | null; error: { message: string } | null }, 'product_skus'),
    images: imageRows.map((image) => ({
      ...image,
      public_url: client.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl,
    })),
    prices: dataOrThrow(prices as { data: AdminPrice[] | null; error: { message: string } | null }, 'price_tiers'),
  };
}

export async function imageFileToWebp(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('browser tidak dapat memproses gambar');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('gagal mengompres gambar')), 'image/webp', 0.82);
  });
  return { blob, width, height };
}
