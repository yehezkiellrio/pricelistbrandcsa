import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rows = JSON.parse(
  fs.readFileSync(path.join(root, 'data', 'products.json'), 'utf8'),
);

const clean = (value) => String(value ?? '').trim();
const normalized = (value) => clean(value).toLocaleLowerCase('id-ID');
const sql = (value) => {
  if (value === null || value === undefined || value === '') return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replaceAll("'", "''")}'`;
};

const groupSource = (row) => [
  row.brand,
  row.category,
  row.name,
  row.unit,
  row.packaging,
  row.tax,
].map(normalized).join('|');

const legacyKey = (row) => createHash('sha256')
  .update(groupSource(row))
  .digest('hex')
  .slice(0, 32);

const brands = [...new Set(rows.map((row) => clean(row.brand)).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, 'id'));
const categories = [...new Set(rows.map((row) => clean(row.category)).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, 'id'));

const productGroups = new Map();
for (const row of rows) {
  const key = legacyKey(row);
  if (!productGroups.has(key)) productGroups.set(key, row);
}
const products = [...productGroups.entries()];

const skuMap = new Map();
for (const row of rows) {
  if (!clean(row.sku)) continue;
  const key = `${legacyKey(row)}|${normalized(row.sku)}`;
  if (!skuMap.has(key)) skuMap.set(key, row);
}
const skus = [...skuMap.values()];

const values = (items, mapper) => items.map((item, index) =>
  `  (${mapper(item, index).join(', ')})`,
).join(',\n');

const output = `-- Data awal CSA Master Pricelist
-- Dibuat otomatis dari data/products.json. Jangan diedit manual.

begin;

insert into public.brands (name)
values
${values(brands, (name) => [sql(name)])}
on conflict do nothing;

insert into public.categories (name)
values
${values(categories, (name) => [sql(name)])}
on conflict do nothing;

with seed (
  legacy_key, brand_name, category_name, name, unit, packaging,
  tax_note, source, sort_order
) as (
  values
${values(products, ([key, row], index) => [
  sql(key), sql(row.brand), sql(row.category), sql(row.name), sql(row.unit),
  sql(row.packaging), sql(row.tax), sql(row.source), sql(index),
])}
)
insert into public.products (
  legacy_key, brand_id, category_id, name, unit, packaging,
  tax_note, source, sort_order
)
select
  seed.legacy_key,
  brands.id,
  categories.id,
  seed.name,
  seed.unit,
  seed.packaging,
  seed.tax_note,
  seed.source,
  seed.sort_order
from seed
left join public.brands
  on lower(btrim(brands.name)) = lower(btrim(seed.brand_name))
left join public.categories
  on lower(btrim(categories.name)) = lower(btrim(seed.category_name))
on conflict (legacy_key) do update set
  brand_id = excluded.brand_id,
  category_id = excluded.category_id,
  name = excluded.name,
  unit = excluded.unit,
  packaging = excluded.packaging,
  tax_note = excluded.tax_note,
  source = excluded.source,
  sort_order = excluded.sort_order,
  is_active = true;

with seed (legacy_key, code, name, sort_order) as (
  values
${values(skus, (row, index) => [
  sql(legacyKey(row)), sql(row.sku), sql(row.name), sql(index),
])}
)
insert into public.product_skus (product_id, code, name, sort_order)
select products.id, seed.code, seed.name, seed.sort_order
from seed
join public.products on products.legacy_key = seed.legacy_key
on conflict do nothing;

with seed (
  legacy_id, legacy_key, sku_code, list_price, discount_text,
  net_price, program_price, minimum_order, area,
  price_per_piece, price_per_sqm, price_per_meter,
  promo_valid_until, source, sort_order
) as (
  values
${values(rows, (row, index) => [
  sql(row.id),
  sql(legacyKey(row)),
  sql(row.sku),
  sql(row.list_price),
  sql(row.discount),
  sql(row.net_price),
  sql(row.program_price),
  sql(row.minimum_order),
  sql(normalized(row.name).includes('area wonogiri') ? 'Wonogiri' : null),
  sql(row.price_per_piece),
  sql(row.price_per_sqm),
  sql(row.price_per_meter),
  sql(row.promo_valid_until),
  sql(row.source),
  sql(index),
])}
)
insert into public.price_tiers (
  legacy_id, product_id, sku_id, list_price, discount_text,
  net_price, program_price, minimum_order, area,
  price_per_piece, price_per_sqm, price_per_meter,
  promo_valid_until, source, sort_order
)
select
  seed.legacy_id,
  products.id,
  product_skus.id,
  seed.list_price,
  seed.discount_text,
  seed.net_price,
  seed.program_price,
  seed.minimum_order,
  seed.area,
  seed.price_per_piece,
  seed.price_per_sqm,
  seed.price_per_meter,
  seed.promo_valid_until::date,
  seed.source,
  seed.sort_order
from seed
join public.products on products.legacy_key = seed.legacy_key
left join public.product_skus
  on product_skus.product_id = products.id
  and lower(btrim(product_skus.code)) = lower(btrim(seed.sku_code))
on conflict (legacy_id) do update set
  product_id = excluded.product_id,
  sku_id = excluded.sku_id,
  list_price = excluded.list_price,
  discount_text = excluded.discount_text,
  net_price = excluded.net_price,
  program_price = excluded.program_price,
  minimum_order = excluded.minimum_order,
  area = excluded.area,
  price_per_piece = excluded.price_per_piece,
  price_per_sqm = excluded.price_per_sqm,
  price_per_meter = excluded.price_per_meter,
  promo_valid_until = excluded.promo_valid_until,
  source = excluded.source,
  sort_order = excluded.sort_order,
  is_active = true;

update public.catalog_versions
set note = 'impor awal: ${products.length} produk, ${skus.length} sku, ${rows.length} tier harga',
    updated_at = now()
where key = 'catalog';

commit;

-- Hasil yang diharapkan:
-- products: ${products.length}
-- product_skus: ${skus.length}
-- price_tiers: ${rows.length}
`;

fs.writeFileSync(path.join(root, 'supabase', 'seed-products.sql'), output);
console.log(`Generated ${products.length} products, ${skus.length} SKUs, ${rows.length} price tiers.`);
