import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogSnapshot, Product } from '@/lib/types';

type DbRow = Record<string, unknown>;

const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const textOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const assertResult = <T extends DbRow>(
  result: { data: T[] | null; error: { message: string } | null },
  table: string,
) => {
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
  return result.data ?? [];
};

export async function fetchCatalogVersion(client: SupabaseClient) {
  const { data, error } = await client
    .from('catalog_versions')
    .select('version, updated_at')
    .eq('key', 'catalog')
    .maybeSingle();

  if (error) throw new Error(`catalog_versions: ${error.message}`);
  return {
    version: Number(data?.version ?? 1),
    updatedAt: data?.updated_at ? String(data.updated_at) : null,
  };
}

export async function fetchCatalogSnapshot(
  client: SupabaseClient,
  remoteVersion?: { version: number; updatedAt: string | null },
): Promise<CatalogSnapshot> {
  const [brandResult, categoryResult, productResult, skuResult, imageResult, priceResult] = await Promise.all([
    client.from('brands').select('id, name'),
    client.from('categories').select('id, name'),
    client.from('products').select('id, brand_id, category_id, name, unit, packaging, tax_note, source, sort_order').order('sort_order').order('id'),
    client.from('product_skus').select('id, product_id, code, name, sort_order').order('sort_order').order('id'),
    client.from('product_images').select('id, product_id, sku_id, storage_path, sort_order').order('sort_order').order('id'),
    client.from('price_tiers').select('id, legacy_id, product_id, sku_id, list_price, discount_text, net_price, program_price, minimum_order, price_per_piece, price_per_sqm, price_per_meter, promo_valid_until, source, sort_order').order('sort_order').order('id'),
  ]);

  const brandRows = assertResult(brandResult as { data: DbRow[] | null; error: { message: string } | null }, 'brands');
  const categoryRows = assertResult(categoryResult as { data: DbRow[] | null; error: { message: string } | null }, 'categories');
  const productRows = assertResult(productResult as { data: DbRow[] | null; error: { message: string } | null }, 'products');
  const skuRows = assertResult(skuResult as { data: DbRow[] | null; error: { message: string } | null }, 'product_skus');
  const imageRows = assertResult(imageResult as { data: DbRow[] | null; error: { message: string } | null }, 'product_images');
  const priceRows = assertResult(priceResult as { data: DbRow[] | null; error: { message: string } | null }, 'price_tiers');

  const brands = new Map(brandRows.map((row) => [Number(row.id), textOrNull(row.name)]));
  const categories = new Map(categoryRows.map((row) => [Number(row.id), textOrNull(row.name)]));
  const productMap = new Map(productRows.map((row) => [Number(row.id), row]));
  const skuMap = new Map(skuRows.map((row) => [Number(row.id), row]));

  const publicImageUrl = (storagePath: string) => client.storage
    .from('product-images')
    .getPublicUrl(storagePath).data.publicUrl;

  const imagesByTarget = new Map<string, string[]>();
  for (const row of imageRows) {
    const productId = Number(row.product_id);
    const skuId = numberOrNull(row.sku_id);
    const key = skuId === null ? `product:${productId}` : `sku:${skuId}`;
    const path = textOrNull(row.storage_path);
    if (!path) continue;
    const existing = imagesByTarget.get(key) ?? [];
    existing.push(publicImageUrl(path));
    imagesByTarget.set(key, existing);
  }

  const products: Product[] = priceRows.flatMap((priceRow) => {
    const productId = Number(priceRow.product_id);
    const productRow = productMap.get(productId);
    if (!productRow) return [];

    const skuId = numberOrNull(priceRow.sku_id);
    const skuRow = skuId === null ? undefined : skuMap.get(skuId);
    const imagePaths = [
      ...(imagesByTarget.get(`product:${productId}`) ?? []),
      ...(skuId === null ? [] : imagesByTarget.get(`sku:${skuId}`) ?? []),
    ];
    const tierId = Number(priceRow.id);
    const legacyId = numberOrNull(priceRow.legacy_id);

    return [{
      id: legacyId ?? 1_000_000_000 + tierId,
      brand: brands.get(Number(productRow.brand_id)) ?? null,
      category: categories.get(Number(productRow.category_id)) ?? null,
      name: textOrNull(productRow.name),
      sku: textOrNull(skuRow?.code),
      sku_name: textOrNull(skuRow?.name),
      unit: textOrNull(productRow.unit),
      packaging: textOrNull(productRow.packaging),
      list_price: numberOrNull(priceRow.list_price),
      discount: textOrNull(priceRow.discount_text),
      net_price: numberOrNull(priceRow.net_price),
      tax: textOrNull(productRow.tax_note),
      program_price: numberOrNull(priceRow.program_price),
      minimum_order: textOrNull(priceRow.minimum_order),
      source: textOrNull(priceRow.source) ?? textOrNull(productRow.source) ?? 'Supabase',
      price_per_piece: numberOrNull(priceRow.price_per_piece),
      price_per_sqm: numberOrNull(priceRow.price_per_sqm),
      price_per_meter: numberOrNull(priceRow.price_per_meter),
      promo_valid_until: textOrNull(priceRow.promo_valid_until),
      image_paths: imagePaths,
    } satisfies Product];
  });

  const version = remoteVersion ?? await fetchCatalogVersion(client);
  return { version: version.version, updatedAt: version.updatedAt, products };
}
