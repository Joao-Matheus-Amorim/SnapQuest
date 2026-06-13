import { EFFECT_CATEGORIES, rollEffect, RARITY_TIER_LABELS } from './balance.js';
import { uid, pick, fakePhotos } from './utils.js';

const EFFECT_ATTRIBUTES = ['ATK', 'DEF', 'LCK', 'SPD', 'HP'];
const EFFECT_POLARITIES = ['BÔNUS', 'DEBUFF'];

function normalizeEffectOverride(effect, overrides = {}) {
  const polaridade = EFFECT_POLARITIES.includes(overrides.polarity) ? overrides.polarity : effect.polaridade;
  const atributo = EFFECT_ATTRIBUTES.includes(overrides.attribute) ? overrides.attribute : effect.atributo;
  const rawIntensity = Number(overrides.intensity);
  const intensidade = Number.isFinite(rawIntensity)
    ? Math.max(1, Math.min(5, Math.round(rawIntensity)))
    : effect.intensidade;

  return { polaridade, atributo, intensidade };
}

export function createEffectCard({ categoryKey, name, photo, polarity, attribute, intensity, description }) {
  const category = EFFECT_CATEGORIES.find(item => item[0] === categoryKey);
  if (!category) throw new Error('Categoria inválida.');
  if (!name?.trim()) throw new Error('Nome do efeito é obrigatório.');

  const effect = rollEffect();
  const resolvedEffect = normalizeEffectOverride(effect, { polarity, attribute, intensity });
  // Raridade SEMPRE deriva da intensidade final (tier == intensidade), senao o
  // custo de energia (por raridade) descola do beneficio (intensidade): uma carta
  // "rara" custaria 3 mas daria +1 igual a uma comum. Aqui custo e ganho andam juntos.
  const raridade = RARITY_TIER_LABELS[resolvedEffect.intensidade];

  return {
    id: uid(),
    type: 'effect_card',
    foto: photo || null,
    foto_storage_path: null,
    foto_fake: pick(fakePhotos),
    categoria_key: category[0],
    categoria: category[2],
    icon: category[1],
    polaridade: resolvedEffect.polaridade,
    atributo: resolvedEffect.atributo,
    intensidade: resolvedEffect.intensidade,
    raridade,
    descricao: description?.trim() || null,
    nome_efeito: name.trim(),
    criado_em: new Date().toISOString(),
  };
}

export function seedCards() {
  return [
    createEffectCard({ categoryKey:'natural', name:'Nuvem Travessa' }),
    createEffectCard({ categoryKey:'consumivel', name:'Suco Turbo' }),
    createEffectCard({ categoryKey:'ferramenta', name:'Martelo Cósmico' }),
    createEffectCard({ categoryKey:'criatura', name:'Latido Assustador' }),
    createEffectCard({ categoryKey:'liquido', name:'Poça Escorregadia' }),
    createEffectCard({ categoryKey:'conhecimento', name:'Livro Secreto' }),
  ];
}
