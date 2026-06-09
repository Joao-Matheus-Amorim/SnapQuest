export const CLASSES = [
  { key:'guerreiro', icon:'⚔️', name:'Guerreiro', hp:9, atk:8, def:7, lck:3, spd:3 },
  { key:'arqueiro', icon:'🏹', name:'Arqueiro', hp:6, atk:7, def:4, lck:6, spd:7 },
  { key:'mago', icon:'🔥', name:'Mago', hp:5, atk:9, def:3, lck:5, spd:4 },
  { key:'paladino', icon:'🛡️', name:'Paladino', hp:10, atk:5, def:9, lck:3, spd:3 },
];

export const EFFECT_CATEGORIES = [
  ['natural','☁️','Natureza'],
  ['consumivel','🥤','Comida'],
  ['ferramenta','🔧','Ferramenta'],
  ['criatura','🐾','Bicho'],
  ['vestimenta','👕','Roupa'],
  ['fogo','🔥','Fogo'],
  ['liquido','💧','Água'],
  ['conhecimento','📚','Livro'],
];

export const STAT_EMOJI = { hp:'❤️', atk:'⚔️', def:'🛡️', lck:'🍀', spd:'⚡' };

export function rollFighterBonus(random = Math.random) {
  const attr = ['atk', 'def', 'lck', 'spd'][Math.floor(random() * 4)];
  const r = Math.floor(random() * 100) + 1;
  const value = r <= 50 ? 1 : r <= 85 ? 2 : 3;
  return { attr, value };
}

export function rollEffect(random = Math.random) {
  const polarityRoll = Math.floor(random() * 20) + 1;
  const polaridade = polarityRoll <= 5 ? 'DEBUFF' : 'BÔNUS';

  const attrRoll = Math.floor(random() * 100) + 1;
  const atributo = attrRoll <= 25 ? 'ATK' : attrRoll <= 50 ? 'DEF' : attrRoll <= 75 ? 'LCK' : 'SPD';

  const intensityRoll = Math.floor(random() * 100) + 1;
  const intensidade = intensityRoll <= 60 ? 1 : intensityRoll <= 90 ? 2 : 3;
  const raridade = intensidade === 1 ? '⚪ Comum' : intensidade === 2 ? '🟢 Incomum' : '🔵 Raro';

  return { polaridade, atributo, intensidade, raridade };
}
