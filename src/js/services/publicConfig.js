export function getPublicConfig() {
  const env = import.meta.env || {};

  return {
    supabaseUrl: env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  };
}
