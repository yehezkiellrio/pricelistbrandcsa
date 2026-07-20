import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const file = path.join(process.cwd(), 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(file, 'utf8')).map((p) => ({
  ...p,
  packaging: p.packaging == null ? null : String(p.packaging),
  discount: p.discount == null ? null : String(p.discount),
  tax: p.tax == null ? null : String(p.tax),
}));
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
for (let i = 0; i < products.length; i += 100) {
  const chunk = products.slice(i, i + 100);
  const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
  if (error) throw error;
  console.log(`Imported ${Math.min(i + chunk.length, products.length)}/${products.length}`);
}
console.log('Import complete.');
