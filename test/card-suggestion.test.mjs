import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EFFECT_CATEGORIES } from '../src/js/core/balance.js';
import {
  CARD_SUGGESTION_SCHEMA_VERSION,
  normalizeCardSuggestion,
  suggestCardFromPhoto,
} from '../src/js/services/cardSuggestionService.js';

const categoryKeys = new Set(EFFECT_CATEGORIES.map((category) => category[0]));

test('suggestCardFromPhoto requires a photo', async () => {
  await assert.rejects(() => suggestCardFromPhoto({ visualHint: 'sem foto' }), /Foto obrigatoria/);
});

test('suggestCardFromPhoto returns a reviewed structured suggestion', async () => {
  const suggestion = await suggestCardFromPhoto({
    photoUri: 'file://snapquest-test-photo.jpg',
    visualHint: 'livro azul',
  });

  assert.equal(suggestion.schemaVersion, CARD_SUGGESTION_SCHEMA_VERSION);
  assert.equal(suggestion.requiresReview, true);
  assert.equal(suggestion.categoryKey, 'conhecimento');
  assert.equal(suggestion.attributeHint, 'LCK');
  assert.equal(suggestion.polarityHint, 'BÔNUS');
  assert.equal(categoryKeys.has(suggestion.categoryKey), true);
});

test('normalizeCardSuggestion clamps and falls back invalid model output', () => {
  const normalized = normalizeCardSuggestion({
    suggestedName: '   ',
    shortLore: '',
    categoryKey: 'invalid-category',
    polarityHint: 'INVALID',
    attributeHint: 'INVALID',
    intensityHint: 99,
    source: 'unknown',
  });

  assert.equal(normalized.suggestedName, 'Carta sem nome');
  assert.equal(normalized.shortLore, 'Lore pendente de revisao.');
  assert.equal(normalized.categoryKey, 'natural');
  assert.equal(normalized.polarityHint, 'BÔNUS');
  assert.equal(normalized.attributeHint, 'LCK');
  assert.equal(normalized.intensityHint, 3);
  assert.equal(normalized.rarityHint, '🔵 Raro');
  assert.equal(normalized.source, 'mock');
  assert.equal(normalized.requiresReview, true);
});

test('normalizeCardSuggestion accepts backend source only for the expected provider', () => {
  assert.equal(normalizeCardSuggestion({ source: 'gemini-backend' }).source, 'gemini-backend');
  assert.equal(normalizeCardSuggestion({ source: 'gemini' }).source, 'mock');
});
