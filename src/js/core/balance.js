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

// Etiquetas de raridade por tier (1..5). O tier também é a força do bônus.
export const RARITY_TIER_LABELS = {
  1: '⚪ Comum',
  2: '🟢 Incomum',
  3: '🔵 Raro',
  4: '🟣 Épico',
  5: '🟡 Lendário',
};

// Roleta de raridade — pura sorte, igual pra fighters e cartas.
// Comum 50% · Incomum 29% · Raro 15% · Épico 5% · Lendário 1%
export function rollRarity(random = Math.random) {
  const r = Math.floor(random() * 100) + 1; // 1..100
  if (r <= 50) return 1; // Comum
  if (r <= 79) return 2; // Incomum (29%)
  if (r <= 94) return 3; // Raro (15%)
  if (r <= 99) return 4; // Épico (5%)
  return 5;              // Lendário (1%)
}

export function rollFighterBonus(random = Math.random) {
  const attr = ['atk', 'def', 'lck', 'spd'][Math.floor(random() * 4)];
  const value = rollRarity(random);
  return { attr, value };
}

// Gerador de golpe determinístico (fallback quando a IA não fornece um).
// Mesma semente (nome) => mesmo golpe, mas varia entre fighters diferentes.
const GOLPE_ACTIONS = [
  'Corte', 'Investida', 'Fúria', 'Impacto', 'Rajada', 'Explosão',
  'Golpe', 'Uivo', 'Lâmina', 'Estocada', 'Tempestade', 'Esmagamento',
];
const GOLPE_QUALIFIERS = [
  'Brutal', 'Veloz', 'Sombrio', 'Flamejante', 'Glacial', 'Trovejante',
  'Sagrado', 'Fantasma', 'Selvagem', 'Arcano', 'Cósmico', 'Imortal',
];

export function generateGolpe(seed = '') {
  const h = String(seed).split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const action = GOLPE_ACTIONS[h % GOLPE_ACTIONS.length];
  const qualifier = GOLPE_QUALIFIERS[(h * 7) % GOLPE_QUALIFIERS.length];
  return `${action} ${qualifier}`;
}

// Vacilo do fighter quando rola 1 no d20 (falha crítica). Texto engraçado.
const MISS_FAILS = [
  'tropeçou na própria sombra',
  'se distraiu com uma borboleta',
  'escorregou e caiu sentado',
  'bocejou no meio do ataque',
  'espirrou na hora errada',
  'esqueceu o que ia fazer',
  'se atrapalhou com as próprias patas',
  'mirou no lugar errado',
  'travou de vergonha',
  'foi cegado pelo próprio brilho',
  'parou pra coçar a cabeça',
  'pisou no próprio pé',
];

export function generateMiss(seed = '') {
  const h = String(seed).split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return MISS_FAILS[(h * 13) % MISS_FAILS.length];
}

export function rollEffect(random = Math.random) {
  const polarityRoll = Math.floor(random() * 20) + 1;
  const polaridade = polarityRoll <= 5 ? 'DEBUFF' : 'BÔNUS';

  const attrRoll = Math.floor(random() * 100) + 1;
  const atributo = attrRoll <= 25 ? 'ATK' : attrRoll <= 50 ? 'DEF' : attrRoll <= 75 ? 'LCK' : 'SPD';

  const intensidade = rollRarity(random);
  const raridade = RARITY_TIER_LABELS[intensidade];

  return { polaridade, atributo, intensidade, raridade };
}
