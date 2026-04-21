import { createClient } from '@supabase/supabase-js';

// Lazy-loaded client-side Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

// Export singleton for backward compatibility
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabase();
    return client[prop as keyof typeof client];
  },
});
