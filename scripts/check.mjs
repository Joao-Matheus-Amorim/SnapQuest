import fs from 'node:fs';
import { EFFECT_CATEGORIES } from '../src/js/core/balance.js';
import {
  CARD_SUGGESTION_SCHEMA_VERSION,
  normalizeCardSuggestion,
  suggestCardFromPhoto,
} from '../src/js/services/cardSuggestionService.js';

const required = [
  'index.html',
  'src/styles/app.css',
  'src/js/app.js',
  'src/js/core/balance.js',
  'src/js/core/battle.js',
  'src/js/core/cards.js',
  'src/js/core/photoPaths.d.ts',
  'src/js/core/photoPaths.js',
  'src/js/core/fighters.js',
  'src/js/services/inventoryRepository.js',
  'src/js/services/localStore.js',
  'src/js/services/photoCloudStorage.js',
  'src/js/services/supabaseClient.js',
  'src/js/services/cardSuggestionService.js',
  'src/lib/mobileStorage.ts',
  'src/hooks/useCapturedPhotos.ts',
  'src/hooks/usePlayerDeck.ts',
  'src/services/accountProfile.ts',
  'src/services/geminiTransform.ts',
  'src/services/photoCloudStorage.ts',
  'scripts/validate-catalog-rls.mjs',
  'test/core-balance.test.mjs',
  'test/core-battle.test.mjs',
  'test/core-factories.test.mjs',
  'test/card-suggestion.test.mjs',
  'test/photo-paths.test.mjs',
  'docs/gemini-card-suggestions.md',
  'docs/gemini-transform-flow.md',
  'docs/catalog-rls-validation.md',
  'supabase/functions/gemini-transform/index.ts',
  'supabase/functions/README.md',
  'supabase/schema.sql',
];

let ok = true;

function fail(message) {
  console.error(message);
  ok = false;
}

for (const file of required) {
  if (!fs.existsSync(file)) {
    fail(`Missing required file: ${file}`);
  }
}

const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('type="module"')) {
  fail('index.html must load src/js/app.js as type="module".');
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts?.test !== 'npm run test:core') {
  fail('package.json must expose npm test as the standard automated test entrypoint.');
}

if (packageJson.scripts?.['test:core'] !== 'node --test "test/*.test.mjs"') {
  fail('package.json must expose npm run test:core for automated core coverage.');
}

if (packageJson.main !== 'expo-router/entry') {
  fail('package.json must keep Expo Router as the mobile entrypoint.');
}

if (packageJson.dependencies?.['@react-navigation/native'] || packageJson.dependencies?.['@react-navigation/native-stack']) {
  fail('package.json must not keep legacy React Navigation dependencies after TD-005.');
}

if (fs.existsSync('App.tsx')) {
  fail('App.tsx should be removed after Expo Router becomes the single mobile entrypoint.');
}

if (packageJson.dependencies?.['@expo/ngrok']) {
  fail('package.json must not keep @expo/ngrok after TD-010 cleanup.');
}

if (packageJson.devDependencies?.vite !== '^6.4.3') {
  fail('package.json must pin vite to ^6.4.3 or an explicitly reviewed replacement.');
}

if (packageJson.overrides?.postcss !== '^8.5.10' || packageJson.overrides?.uuid !== '^11.1.1') {
  fail('package.json must keep reviewed overrides for postcss and uuid.');
}

const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
if (!schema.includes('alter table public.snapquest_fighters enable row level security')) {
  fail('schema.sql must enable RLS for fighters.');
}

if (!schema.includes('auth.uid()')) {
  fail('schema.sql must scope policies by auth.uid().');
}

if (!schema.includes('is_catalog boolean not null default false')) {
  fail('schema.sql must define is_catalog for catalog-backed inventory.');
}

if (!schema.includes('can_manage_catalog boolean not null default false')) {
  fail('schema.sql must define can_manage_catalog for catalog write control.');
}

if (!schema.includes('to authenticated') || !schema.includes('to anon, authenticated')) {
  fail('schema.sql policies must explicitly target authenticated users and public catalog reads.');
}

if (!schema.includes('revoke update (can_manage_catalog)')) {
  fail('schema.sql must prevent users from self-promoting catalog admin access.');
}

if (!schema.includes('snapquest_guard_catalog_admin_flag')) {
  fail('schema.sql must guard can_manage_catalog updates with a database trigger.');
}

if (!schema.includes('snapquest_fighters_catalog_idx') || !schema.includes('snapquest_effect_cards_catalog_idx')) {
  fail('schema.sql must index catalog lookups for fighters and cards.');
}

if (!schema.includes('photo_storage_path text')) {
  fail('schema.sql must version photo_storage_path for fighters and cards.');
}

if (!schema.includes('storage.buckets') || !schema.includes('snapquest-photos')) {
  fail('schema.sql must provision the snapquest-photos Storage bucket.');
}

if (!schema.includes('on storage.objects for select') || !schema.includes('storage.foldername(name)')) {
  fail('schema.sql must define Storage object policies scoped by folder path.');
}

const rlsValidation = fs.readFileSync('scripts/validate-catalog-rls.mjs', 'utf8');
for (const requiredRlsCheck of [
  'common cannot insert catalog fighter',
  'common cannot insert catalog card',
  'common cannot self-promote can_manage_catalog',
  'owner can insert catalog fighter',
  'owner can insert catalog card',
  'common can read catalog fighter',
  'anon can read catalog fighter',
  'common cannot delete catalog fighter',
]) {
  if (!rlsValidation.includes(requiredRlsCheck)) {
    fail(`catalog RLS validation must cover: ${requiredRlsCheck}.`);
  }
}

const mobileStorage = fs.readFileSync('src/lib/mobileStorage.ts', 'utf8');
if (!mobileStorage.includes('Platform.OS === "web"')) {
  fail('mobileStorage must fallback to localStorage on web.');
}

if (!mobileStorage.includes('SecureStore.getItemAsync')) {
  fail('mobileStorage must use SecureStore on native.');
}

const capturedPhotosHook = fs.readFileSync('src/hooks/useCapturedPhotos.ts', 'utf8');
if (capturedPhotosHook.includes('expo-secure-store')) {
  fail('useCapturedPhotos must use mobileStorage instead of SecureStore directly.');
}

if (!capturedPhotosHook.includes('removeCapturedPhoto')) {
  fail('useCapturedPhotos must expose removeCapturedPhoto for post-transform cleanup.');
}

const cameraScreen = fs.readFileSync('src/app/camera.tsx', 'utf8');
if (!cameraScreen.includes('getAssetInfoAsync')) {
  fail('camera screen must resolve native media assets to a renderable localUri.');
}

if (cameraScreen.includes('savedUri = asset.uri || capturedUri')) {
  fail('camera screen must not persist ph:// asset.uri directly on iOS.');
}

const transformService = fs.readFileSync('src/services/geminiTransform.ts', 'utf8');
if (!transformService.includes('provider: "mock-gemini"')) {
  fail('geminiTransform must identify the mock provider until real Gemini is wired.');
}

if (!transformService.includes('target: "fighter"') || !transformService.includes('target: "effect_card"')) {
  fail('geminiTransform must support fighter and effect_card targets.');
}

if (!transformService.includes('supabase.functions.invoke("gemini-transform"')) {
  fail('geminiTransform must call the gemini-transform edge function.');
}

if (transformService.includes('EXPO_PUBLIC_GEMINI_API_KEY')) {
  fail('geminiTransform must not read Gemini API keys from frontend env anymore.');
}

const edgeFunction = fs.readFileSync('supabase/functions/gemini-transform/index.ts', 'utf8');
if (!edgeFunction.includes('GEMINI_API_KEY') || !edgeFunction.includes('generateContent')) {
  fail('gemini-transform edge function must call Gemini with a private server-side key.');
}

const inventoryScreen = fs.readFileSync('src/app/inventory.tsx', 'utf8');
if (!inventoryScreen.includes('transformCapturedPhoto')) {
  fail('inventory conversion must route through transformCapturedPhoto.');
}

if (!inventoryScreen.includes('removeCapturedPhoto')) {
  fail('inventory conversion must remove raw captures after deck save.');
}

const authHook = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');
if (!authHook.includes('ensureProfileForUser')) {
  fail('useAuth must ensure a snapquest_profiles row for authenticated users.');
}

if (!authHook.includes('canManageCatalog')) {
  fail('useAuth must expose canManageCatalog from the account profile.');
}

const cloudSyncHook = fs.readFileSync('src/hooks/useCloudSync.ts', 'utf8');
if (!cloudSyncHook.includes('status: "syncing"') || !cloudSyncHook.includes('status: "synced"') || !cloudSyncHook.includes('status: "error"')) {
  fail('useCloudSync must expose explicit syncing, synced and error states.');
}

const loginScreen = fs.readFileSync('src/app/login.tsx', 'utf8');
if (!loginScreen.includes('Continuar sem conta')) {
  fail('login screen must support guest mode.');
}

const accountProfile = fs.readFileSync('src/services/accountProfile.ts', 'utf8');
if (!accountProfile.includes('Confirme o email')) {
  fail('account profile service must expose email confirmation messaging.');
}

const homeScreen = fs.readFileSync('src/app/index.tsx', 'utf8');
if (!homeScreen.includes('cloudSync.message')) {
  fail('home screen must surface cloud sync status to the user.');
}

const cloudSync = fs.readFileSync('src/services/cloudSync.ts', 'utf8');
if (!cloudSync.includes('photo_storage_path')) {
  fail('cloudSync must persist photo_storage_path for remote photos.');
}

if (!cloudSync.includes('resolvePhotoUrls')) {
  fail('cloudSync must resolve private storage photos through signed URLs.');
}

const inventoryRepository = fs.readFileSync('src/js/services/inventoryRepository.js', 'utf8');
if (!inventoryRepository.includes('photo_storage_path')) {
  fail('inventoryRepository must persist photo_storage_path for web sync.');
}

if (!inventoryRepository.includes('resolvePhotoUrls')) {
  fail('inventoryRepository must resolve private storage photos through signed URLs.');
}

const categoryKeys = new Set(EFFECT_CATEGORIES.map(category => category[0]));
const suggestion = await suggestCardFromPhoto({
  photoUri: 'file://snapquest-test-photo.jpg',
  visualHint: 'livro azul',
});

if (suggestion.schemaVersion !== CARD_SUGGESTION_SCHEMA_VERSION) {
  fail('card suggestion must expose the expected schema version.');
}

if (!suggestion.requiresReview) {
  fail('card suggestion must require human review before saving.');
}

if (!categoryKeys.has(suggestion.categoryKey)) {
  fail('card suggestion categoryKey must come from EFFECT_CATEGORIES.');
}

if (!['BÔNUS', 'DEBUFF'].includes(suggestion.polarityHint)) {
  fail('card suggestion polarityHint must be valid.');
}

if (!['ATK', 'DEF', 'LCK', 'SPD'].includes(suggestion.attributeHint)) {
  fail('card suggestion attributeHint must be valid.');
}

if (suggestion.intensityHint < 1 || suggestion.intensityHint > 3) {
  fail('card suggestion intensityHint must stay between 1 and 3.');
}

const normalized = normalizeCardSuggestion({
  categoryKey: 'invalid-category',
  polarityHint: 'INVALID',
  attributeHint: 'INVALID',
  intensityHint: 99,
});

if (normalized.categoryKey !== 'natural') {
  fail('normalizeCardSuggestion must fallback invalid categoryKey to natural.');
}

if (normalized.polarityHint !== 'BÔNUS') {
  fail('normalizeCardSuggestion must fallback invalid polarityHint to BÔNUS.');
}

if (normalized.attributeHint !== 'LCK') {
  fail('normalizeCardSuggestion must fallback invalid attributeHint to LCK.');
}

if (normalized.intensityHint !== 3) {
  fail('normalizeCardSuggestion must clamp intensityHint to 3.');
}

let missingPhotoFailed = false;
try {
  await suggestCardFromPhoto({ visualHint: 'sem foto' });
} catch {
  missingPhotoFailed = true;
}

if (!missingPhotoFailed) {
  fail('suggestCardFromPhoto must reject suggestions without photoUri.');
}

if (!ok) process.exit(1);

console.log('SnapQuest static checks passed.');
console.log('SnapQuest card suggestion checks passed.');
console.log('SnapQuest mobile transform guard checks passed.');
