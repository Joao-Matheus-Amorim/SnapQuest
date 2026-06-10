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
  'src/js/core/fighters.js',
  'src/js/services/inventoryRepository.js',
  'src/js/services/localStore.js',
  'src/js/services/supabaseClient.js',
  'src/js/services/cardSuggestionService.js',
  'src/lib/mobileStorage.ts',
  'src/hooks/useCapturedPhotos.ts',
  'src/hooks/usePlayerDeck.ts',
  'src/services/geminiTransform.ts',
  'docs/gemini-card-suggestions.md',
  'docs/gemini-transform-flow.md',
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

const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
if (!schema.includes('alter table public.snapquest_fighters enable row level security')) {
  fail('schema.sql must enable RLS for fighters.');
}

if (!schema.includes('auth.uid()')) {
  fail('schema.sql must scope policies by auth.uid().');
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

const inventoryScreen = fs.readFileSync('src/app/inventory.tsx', 'utf8');
if (!inventoryScreen.includes('transformCapturedPhoto')) {
  fail('inventory conversion must route through transformCapturedPhoto.');
}

if (!inventoryScreen.includes('removeCapturedPhoto')) {
  fail('inventory conversion must remove raw captures after deck save.');
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
