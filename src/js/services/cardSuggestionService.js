import { EFFECT_CATEGORIES } from '../core/balance.js';

export const CARD_SUGGESTION_SCHEMA_VERSION = 'card-suggestion-v1';

const CATEGORY_KEYS = EFFECT_CATEGORIES.map(category => category[0]);
const POLARITIES = ['BÔNUS', 'DEBUFF'];
const ATTRIBUTES = ['ATK', 'DEF', 'LCK', 'SPD'];
const RARITY_BY_INTENSITY = {
  1: '⚪ Comum',
  2: '🟢 Incomum',
  3: '🔵 Raro',
};

/**
 * Adapter local para sugestao de carta.
 *
 * A saida ainda nao e carta do jogo. Ela precisa passar por revisao humana
 * e validacao do core antes de ser salva no inventario.
 */
export async function suggestCardFromPhoto({ photoUri, visualHint = '' } = {}) {
  if (!photoUri) {
    throw new Error('Foto obrigatoria para sugerir carta.');
  }

  const hint = String(visualHint || '').trim();

  return normalizeCardSuggestion({
    suggestedName: hint ? `Eco de ${hint}` : 'Artefato Misterioso',
    shortLore: hint
      ? `Uma foto comum ganhou poder de aventura: ${hint}.`
      : 'Uma foto real virou inspiracao para uma carta de aventura.',
    categoryKey: inferCategoryKey(hint),
    polarityHint: 'BÔNUS',
    attributeHint: inferAttribute(hint),
    intensityHint: 1,
    visualReason: hint
      ? `Sugestao baseada na pista visual: ${hint}.`
      : 'Sugestao local aguardando analise visual em etapa futura.',
    source: 'mock',
  });
}

export function normalizeCardSuggestion(suggestion = {}) {
  const intensity = clampIntensity(suggestion.intensityHint);

  return {
    schemaVersion: CARD_SUGGESTION_SCHEMA_VERSION,
    suggestedName: safeText(suggestion.suggestedName, 'Carta sem nome'),
    shortLore: safeText(suggestion.shortLore, 'Lore pendente de revisao.'),
    categoryKey: pickAllowed(suggestion.categoryKey, CATEGORY_KEYS, 'natural'),
    polarityHint: pickAllowed(suggestion.polarityHint, POLARITIES, 'BÔNUS'),
    attributeHint: pickAllowed(suggestion.attributeHint, ATTRIBUTES, 'LCK'),
    intensityHint: intensity,
    rarityHint: RARITY_BY_INTENSITY[intensity],
    visualReason: safeText(suggestion.visualReason, 'Sem justificativa visual.'),
    requiresReview: true,
    source: suggestion.source === 'gemini-backend' ? 'gemini-backend' : 'mock',
  };
}

function inferCategoryKey(hint) {
  const value = hint.toLowerCase();

  if (value.includes('agua') || value.includes('suco') || value.includes('garrafa')) return 'liquido';
  if (value.includes('livro') || value.includes('caderno') || value.includes('caneta')) return 'conhecimento';
  if (value.includes('roupa') || value.includes('camisa') || value.includes('sapato')) return 'vestimenta';
  if (value.includes('gato') || value.includes('cachorro') || value.includes('animal')) return 'criatura';
  if (value.includes('fogo') || value.includes('luz') || value.includes('sol')) return 'fogo';
  if (value.includes('controle') || value.includes('chave') || value.includes('martelo')) return 'ferramenta';
  if (value.includes('comida') || value.includes('biscoito') || value.includes('fruta')) return 'consumivel';

  return 'natural';
}

function inferAttribute(hint) {
  const value = hint.toLowerCase();

  if (value.includes('forte') || value.includes('ataque') || value.includes('espada')) return 'ATK';
  if (value.includes('escudo') || value.includes('protecao') || value.includes('parede')) return 'DEF';
  if (value.includes('rapido') || value.includes('veloz') || value.includes('vento')) return 'SPD';

  return 'LCK';
}

function clampIntensity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.min(3, Math.round(number)));
}

function pickAllowed(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function safeText(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}
