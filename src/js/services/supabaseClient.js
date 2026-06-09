let currentClient = null;

export async function createSupabaseClient({ url, anonKey }) {
  if (!url || !anonKey) throw new Error('URL e anon key são obrigatórios.');

  const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  currentClient = module.createClient(url, anonKey);
  return currentClient;
}

export function getSupabaseClient() {
  return currentClient;
}

export async function signUp({ email, password }) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user || null;
}
