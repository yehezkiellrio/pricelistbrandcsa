import { createClient } from '@supabase/supabase-js';

let browserClient: ReturnType<typeof createClient> | null | undefined;

export function createBrowserSupabaseClient() {
  if (typeof window === 'undefined') return null;
  if (browserClient !== undefined) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    browserClient = null;
    return browserClient;
  }
  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return browserClient;
}
