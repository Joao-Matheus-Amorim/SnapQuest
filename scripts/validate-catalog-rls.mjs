import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

loadDotEnv();

const configSpec = {
  url: ['SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'],
  anonKey: ['SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
  commonEmail: ['RLS_TEST_COMMON_EMAIL'],
  commonPassword: ['RLS_TEST_COMMON_PASSWORD'],
  ownerEmail: ['RLS_TEST_OWNER_EMAIL'],
  ownerPassword: ['RLS_TEST_OWNER_PASSWORD'],
};

const config = {
  url: pickEnv(...configSpec.url),
  anonKey: pickEnv(...configSpec.anonKey),
  commonEmail: pickEnv(...configSpec.commonEmail),
  commonPassword: pickEnv(...configSpec.commonPassword),
  ownerEmail: pickEnv(...configSpec.ownerEmail),
  ownerPassword: pickEnv(...configSpec.ownerPassword),
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => configSpec[key].join(' or '));

if (missing.length) {
  console.error(`Missing required RLS validation env values: ${missing.join(', ')}`);
  console.error('See docs/catalog-rls-validation.md for setup.');
  process.exit(1);
}

const runId = `rls_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const anon = createSupabaseClient();
const common = createSupabaseClient();
const owner = createSupabaseClient();

const commonUser = await signIn(common, config.commonEmail, config.commonPassword, 'common');
const ownerUser = await signIn(owner, config.ownerEmail, config.ownerPassword, 'owner');

const artifacts = {
  commonPersonalFighterId: `${runId}_common_personal_fighter`,
  commonCatalogFighterId: `${runId}_common_catalog_fighter`,
  ownerCatalogFighterId: `${runId}_owner_catalog_fighter`,
  commonPersonalCardId: `${runId}_common_personal_card`,
  commonCatalogCardId: `${runId}_common_catalog_card`,
  ownerCatalogCardId: `${runId}_owner_catalog_card`,
};

const results = [];

try {
  await ensureCommonProfile(common, commonUser.id);
  await assertOwnerCatalogPermission(owner, ownerUser.id);

  await expectAllowed('common can insert personal fighter', () =>
    common.from('snapquest_fighters').insert(fighterRow(artifacts.commonPersonalFighterId, commonUser.id, false)).select('id').single()
  );

  await expectAllowed('common can insert personal card', () =>
    common.from('snapquest_effect_cards').insert(cardRow(artifacts.commonPersonalCardId, commonUser.id, false)).select('id').single()
  );

  await expectDenied('common cannot insert catalog fighter', () =>
    common.from('snapquest_fighters').insert(fighterRow(artifacts.commonCatalogFighterId, commonUser.id, true)).select('id').single()
  );

  await expectDenied('common cannot insert catalog card', () =>
    common.from('snapquest_effect_cards').insert(cardRow(artifacts.commonCatalogCardId, commonUser.id, true)).select('id').single()
  );

  await expectDenied('common cannot self-promote can_manage_catalog', () =>
    common.from('snapquest_profiles').update({ can_manage_catalog: true }).eq('id', commonUser.id).select('can_manage_catalog').single()
  );

  await assertProfileIsNotCatalogManager(common, commonUser.id);

  await expectAllowed('owner can insert catalog fighter', () =>
    owner.from('snapquest_fighters').insert(fighterRow(artifacts.ownerCatalogFighterId, ownerUser.id, true)).select('id').single()
  );

  await expectAllowed('owner can insert catalog card', () =>
    owner.from('snapquest_effect_cards').insert(cardRow(artifacts.ownerCatalogCardId, ownerUser.id, true)).select('id').single()
  );

  await expectAllowed('common can read catalog fighter', () =>
    common.from('snapquest_fighters').select('id').eq('id', artifacts.ownerCatalogFighterId).eq('is_catalog', true).single()
  );

  await expectAllowed('common can read catalog card', () =>
    common.from('snapquest_effect_cards').select('id').eq('id', artifacts.ownerCatalogCardId).eq('is_catalog', true).single()
  );

  await expectAllowed('anon can read catalog fighter', () =>
    anon.from('snapquest_fighters').select('id').eq('id', artifacts.ownerCatalogFighterId).eq('is_catalog', true).single()
  );

  await expectAllowed('anon can read catalog card', () =>
    anon.from('snapquest_effect_cards').select('id').eq('id', artifacts.ownerCatalogCardId).eq('is_catalog', true).single()
  );

  await expectDenied('common cannot update catalog fighter', () =>
    common.from('snapquest_fighters').update({ name: 'Blocked rename' }).eq('id', artifacts.ownerCatalogFighterId).select('id').single()
  );

  await expectDenied('common cannot delete catalog fighter', () =>
    common.from('snapquest_fighters').delete().eq('id', artifacts.ownerCatalogFighterId).select('id').single()
  );

  await expectAllowed('owner can delete catalog card cleanup', () =>
    owner.from('snapquest_effect_cards').delete().eq('id', artifacts.ownerCatalogCardId).select('id').single()
  );

  await expectAllowed('owner can delete catalog fighter cleanup', () =>
    owner.from('snapquest_fighters').delete().eq('id', artifacts.ownerCatalogFighterId).select('id').single()
  );

  await cleanupPersonalRows(common, artifacts);
} catch (error) {
  await bestEffortCleanup(common, owner, artifacts);
  throw error;
}

console.log('SnapQuest catalog RLS validation passed.');
for (const result of results) {
  console.log(`- ${result}`);
}

function loadDotEnv() {
  if (!fs.existsSync('.env')) return;
  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function pickEnv(...names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return '';
}

function createSupabaseClient() {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Could not sign in ${label} RLS user: ${error.message}`);
  if (!data.user?.id) throw new Error(`Could not resolve ${label} RLS user id.`);
  return data.user;
}

async function ensureCommonProfile(client, userId) {
  const { error } = await client
    .from('snapquest_profiles')
    .upsert({ id: userId, display_name: 'RLS Common User' }, { onConflict: 'id' });

  if (error) throw new Error(`Could not ensure common profile: ${error.message}`);
}

async function assertOwnerCatalogPermission(client, userId) {
  const { data, error } = await client
    .from('snapquest_profiles')
    .select('can_manage_catalog')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Could not read owner profile: ${error.message}`);
  if (!data) {
    throw new Error(
      'Owner RLS user has no visible snapquest_profiles row. Run the owner promotion SQL in docs/catalog-rls-validation.md for RLS_TEST_OWNER_EMAIL.'
    );
  }
  if (data?.can_manage_catalog !== true) {
    throw new Error(
      'Owner RLS user must have can_manage_catalog=true. Run the SQL in docs/catalog-rls-validation.md first.'
    );
  }
}

async function assertProfileIsNotCatalogManager(client, userId) {
  const { data, error } = await client
    .from('snapquest_profiles')
    .select('can_manage_catalog')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Could not verify common profile after self-promotion attempt: ${error.message}`);
  if (data?.can_manage_catalog !== false) {
    throw new Error('Common user self-promotion was not blocked.');
  }
  results.push('common self-promotion left can_manage_catalog=false');
}

async function expectAllowed(label, operation) {
  const { error } = await operation();
  if (error) throw new Error(`${label} failed: ${error.message}`);
  results.push(label);
}

async function expectDenied(label, operation) {
  const { error } = await operation();
  if (!error) throw new Error(`${label} unexpectedly succeeded.`);
  results.push(`${label}: denied`);
}

function fighterRow(id, userId, isCatalog) {
  return {
    id,
    user_id: userId,
    name: `RLS Fighter ${id}`,
    photo_fake: 'linear-gradient(135deg,#111827,#2563eb)',
    class_key: 'guerreiro',
    class_name: 'Guerreiro',
    icon: 'X',
    hp: 10,
    atk: 8,
    def: 4,
    lck: 1,
    spd: 3,
    bonus_attribute: 'atk',
    bonus_intensity: 1,
    is_catalog: isCatalog,
  };
}

function cardRow(id, userId, isCatalog) {
  return {
    id,
    user_id: userId,
    name: `RLS Card ${id}`,
    photo_fake: 'linear-gradient(135deg,#111827,#16a34a)',
    category_key: 'natural',
    category_name: 'Natureza',
    icon: 'C',
    polarity: 'DEBUFF',
    attribute: 'DEF',
    intensity: 1,
    rarity: 'Comum',
    is_catalog: isCatalog,
  };
}

async function cleanupPersonalRows(client, ids) {
  await expectAllowed('common can delete personal fighter cleanup', () =>
    client.from('snapquest_fighters').delete().eq('id', ids.commonPersonalFighterId).select('id').single()
  );
  await expectAllowed('common can delete personal card cleanup', () =>
    client.from('snapquest_effect_cards').delete().eq('id', ids.commonPersonalCardId).select('id').single()
  );
}

async function bestEffortCleanup(commonClient, ownerClient, ids) {
  await Promise.allSettled([
    commonClient.from('snapquest_fighters').delete().eq('id', ids.commonPersonalFighterId),
    commonClient.from('snapquest_effect_cards').delete().eq('id', ids.commonPersonalCardId),
    ownerClient.from('snapquest_fighters').delete().eq('id', ids.ownerCatalogFighterId),
    ownerClient.from('snapquest_effect_cards').delete().eq('id', ids.ownerCatalogCardId),
  ]);
}
