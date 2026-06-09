import { EFFECT_CATEGORIES, rollEffect } from './balance.js';
import { uid, pick, fakePhotos } from './utils.js';

export function createEffectCard({ categoryKey, name, photo }) {
  const category = EFFECT_CATEGORIES.find(item => item[0] === categoryKey);
  if (!category) throw new Error('Categoria inválida.');
  if (!name?.trim()) throw new Error('Nome do efeito é obrigatório.');

  const effect = rollEffect();

  return {
    id: uid(),
    type: 'effect_card',
    foto: photo || null,
    foto_fake: pick(fakePhotos),
    categoria_key: category[0],
    categoria: category[2],
    icon: category[1],
    polaridade: effect.polaridade,
    atributo: effect.atributo,
    intensidade: effect.intensidade,
    raridade: effect.raridade,
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
