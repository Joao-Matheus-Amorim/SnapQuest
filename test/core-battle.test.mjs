import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  attackSelectedTarget,
  canAffordCard,
  canStartBattle,
  cardEnergyCost,
  createBattle,
  drawCard,
  getWinner,
  passTurn,
  previewAttack,
  useSelectedCard,
} from '../src/js/core/battle.js';

function withRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function fighter(overrides = {}) {
  return {
    id: overrides.id ?? 'fighter-id',
    type: 'fighter',
    nome: overrides.nome ?? 'Fighter',
    class_key: overrides.class_key ?? 'guerreiro',
    classe: overrides.classe ?? 'Guerreiro',
    icon: overrides.icon ?? 'X',
    hp: overrides.hp ?? 10,
    atk: overrides.atk ?? 8,
    def: overrides.def ?? 4,
    lck: overrides.lck ?? 0,
    spd: overrides.spd ?? 3,
    bonus_atributo: 'atk',
    bonus_intensidade: overrides.bonus_intensidade ?? 1,
    habilidade: overrides.habilidade,
    golpe: overrides.golpe ?? 'Strike',
    erro: overrides.erro ?? 'missed',
    criado_em: '2026-06-10T00:00:00.000Z',
  };
}

function card(overrides = {}) {
  return {
    id: overrides.id ?? 'card-id',
    type: 'effect_card',
    nome_efeito: overrides.nome_efeito ?? 'Boost',
    categoria_key: 'natural',
    categoria: 'Natureza',
    icon: 'C',
    polaridade: overrides.polaridade ?? 'BÔNUS',
    atributo: overrides.atributo ?? 'ATK',
    intensidade: overrides.intensidade ?? 2,
    raridade: overrides.raridade ?? 'Comum',
    criado_em: '2026-06-10T00:00:00.000Z',
  };
}

function makeFighters() {
  return [
    fighter({ id: 'p1-a', nome: 'P1 A', class_key: 'guerreiro', habilidade: 'provocar' }),
    fighter({ id: 'p1-b', nome: 'P1 B', class_key: 'arqueiro', habilidade: 'veneno' }),
    fighter({ id: 'p1-c', nome: 'P1 C', class_key: 'mago', habilidade: 'veneno' }),
    fighter({ id: 'p2-a', nome: 'P2 A', class_key: 'paladino', habilidade: 'escudo' }),
    fighter({ id: 'p2-b', nome: 'P2 B', class_key: 'guerreiro', habilidade: 'provocar' }),
    fighter({ id: 'p2-c', nome: 'P2 C', class_key: 'arqueiro', habilidade: 'veneno' }),
  ];
}

function makeCards() {
  return [
    card({ id: 'p1-card-a', nome_efeito: 'P1 Boost', polaridade: 'BÔNUS', atributo: 'ATK', intensidade: 2, raridade: 'Comum' }),
    card({ id: 'p1-card-b', nome_efeito: 'P1 Debuff', polaridade: 'DEBUFF', atributo: 'DEF', intensidade: 1, raridade: 'Incomum' }),
    card({ id: 'p1-card-c', nome_efeito: 'P1 Rare', polaridade: 'BÔNUS', atributo: 'HP', intensidade: 2, raridade: 'Raro' }),
    card({ id: 'p2-card-a', nome_efeito: 'P2 Boost', polaridade: 'BÔNUS', atributo: 'ATK', intensidade: 2 }),
    card({ id: 'p2-card-b', nome_efeito: 'P2 Debuff', polaridade: 'DEBUFF', atributo: 'DEF', intensidade: 1 }),
    card({ id: 'p2-card-c', nome_efeito: 'P2 Luck', polaridade: 'BÔNUS', atributo: 'LCK', intensidade: 1 }),
  ];
}

function makeBattle() {
  return withRandom(0.5, () => createBattle({
    fighters: makeFighters(),
    cards: makeCards(),
    playerName: 'Player 1',
    player2Name: 'Player 2',
  }));
}

test('battle requires at least six fighters and six cards', () => {
  assert.equal(canStartBattle(makeFighters().slice(0, 5), makeCards()), false);
  assert.equal(canStartBattle(makeFighters(), makeCards().slice(0, 5)), false);
  assert.equal(canStartBattle(makeFighters(), makeCards()), true);
});

test('createBattle starts fixed on player 1 with energy and typed cards', () => {
  const battle = makeBattle();
  assert.equal(battle.turn, 0);
  assert.equal(battle.players[0].energy, 2);
  assert.equal(battle.players[0].max_energy, 5);
  assert.equal(battle.players[0].hand.length, 1);
  assert.equal(battle.players[0].drawn_this_turn, true);
  assert.equal(battle.players[0].deck[0].cost, cardEnergyCost(battle.players[0].deck[0]));
  assert.equal(battle.players[1].fighters[0].shield_active, true);
});

test('card energy cost follows rarity and blocks unaffordable cards', () => {
  assert.equal(cardEnergyCost(card({ raridade: 'Comum', intensidade: 1 })), 1);
  assert.equal(cardEnergyCost(card({ raridade: 'Incomum' })), 2);
  assert.equal(cardEnergyCost(card({ raridade: 'Raro' })), 3);
  const battle = makeBattle();
  const rare = card({ id: 'rare', raridade: 'Raro' });
  rare.cost = cardEnergyCost(rare);
  assert.equal(canAffordCard(battle.players[0], rare), false);
});

test('drawCard adds one card to hand once per turn', () => {
  const battle = makeBattle();
  assert.equal(battle.players[0].hand.length, 1);
  const first = drawCard(battle);
  assert.equal(first.ok, false);
  assert.equal(battle.players[0].hand.length, 1);
});

test('useSelectedCard spends energy and applies buff or debuff to target', () => {
  const battle = makeBattle();
  battle.players[0].hand = [card({ id: 'manual-buff', polaridade: 'BÔNUS', atributo: 'ATK', intensidade: 2, raridade: 'Comum' })];
  battle.players[0].hand[0].cost = cardEnergyCost(battle.players[0].hand[0]);
  battle.selectedCardId = 'manual-buff';
  battle.selectedOwnId = 'p1-a';

  const result = useSelectedCard(battle);
  assert.equal(result.ok, true);
  assert.equal(result.value, 2);
  assert.equal(battle.players[0].fighters[0].buffs.atk, 2);
  assert.equal(battle.players[0].energy, 0);
});

test('previewAttack returns a visible damage range', () => {
  const battle = makeBattle();
  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';
  const preview = previewAttack(battle);
  assert.equal(preview.attackerName, 'P1 B');
  assert.equal(preview.defenderName, 'P2 A');
  assert.equal(preview.max > preview.min, true);
});

test('shield is a luck-based block, not consumed, and can fail', () => {
  const battle = makeBattle();
  battle.players[1].fighters[1].alive = false; // remove o taunt p2-b
  drawCard(battle);

  // rolagem baixa (0.05 -> escudo rola 6, dentro dos 30%) bloqueia
  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';
  const blocked = withRandom(0.05, () => attackSelectedTarget(battle));
  assert.equal(blocked.ok, true);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.damage, 0);
  // NAO consome: o escudo continua ativo
  assert.equal(battle.players[1].fighters[0].shield_active, true);

  // rolagem alta (0.9 -> escudo rola 91, fora dos 30%) NAO bloqueia
  battle.players[0].attacked_this_turn = false;
  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';
  const landed = withRandom(0.9, () => attackSelectedTarget(battle));
  assert.equal(landed.ok, true);
  assert.equal(landed.blocked, false);
});

test('natural miss returns miss name without showing dice mechanics', () => {
  const battle = makeBattle();
  battle.players[1].fighters[1].alive = false;
  drawCard(battle);
  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';
  battle.players[1].fighters[0].shield_active = false;

  const result = withRandom(0, () => attackSelectedTarget(battle));
  assert.equal(result.ok, true);
  assert.equal(result.miss, true);
  assert.equal(result.damage, 0);
  assert.equal(result.missName, 'missed');
});

test('poison applies damage at start of affected player turn', () => {
  const battle = makeBattle();
  battle.players[1].fighters[1].ability = 'veneno';
  drawCard(battle);
  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';
  battle.players[1].fighters[0].shield_active = false;

  withRandom(0.5, () => attackSelectedTarget(battle));
  const poisoned = battle.players[1].fighters[0];
  assert.equal(poisoned.poison.turns, 3);
  const before = poisoned.current_hp;
  passTurn(battle);
  assert.equal(poisoned.current_hp, before - 1);
});

test('defeated cards stay until end turn then are removed', () => {
  const battle = makeBattle();
  const defender = battle.players[1].fighters[1];
  defender.current_hp = 1;

  drawCard(battle);
  battle.selectedOwnId = 'p1-a';
  battle.selectedEnemyId = defender.id;
  const result = withRandom(0.99, () => attackSelectedTarget(battle));

  assert.equal(result.ok, true);
  assert.equal(defender.alive, false);
  assert.equal(battle.players[1].fighters.some((fighter) => fighter.id === defender.id), true);
  passTurn(battle);
  assert.equal(battle.players[1].fighters.some((fighter) => fighter.id === defender.id), false);
});

test('class luck: guerreiro lands a critical (x2) and reports it', () => {
  const battle = makeBattle();
  battle.players[1].fighters[1].alive = false; // remove o taunt p2-b para mirar livre
  drawCard(battle);
  battle.selectedOwnId = 'p1-a'; // guerreiro
  battle.selectedEnemyId = 'p2-c'; // arqueiro, sem escudo

  // 0.1 -> proc de classe rola 11 (<=30, ativa) e nao da vacilo
  const result = withRandom(0.1, () => attackSelectedTarget(battle));
  assert.equal(result.ok, true);
  assert.equal(result.blocked, false);
  assert.equal(result.critical, true);
  assert.equal(result.procName, 'Critico');
});

test('only one attack per turn is allowed and selection clears after attacking', () => {
  const battle = makeBattle();
  battle.players[1].fighters[1].alive = false; // remove taunt p2-b
  battle.players[1].fighters[0].shield_active = false; // p2-a sem escudo
  drawCard(battle);
  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';

  const first = withRandom(0.5, () => attackSelectedTarget(battle));
  assert.equal(first.ok, true);
  assert.equal(battle.players[0].attacked_this_turn, true);
  assert.equal(battle.selectedOwnId, null);
  assert.equal(battle.selectedEnemyId, null);

  battle.selectedOwnId = 'p1-b';
  battle.selectedEnemyId = 'p2-a';
  const second = withRandom(0.5, () => attackSelectedTarget(battle));
  assert.equal(second.ok, false);
  assert.match(second.message, /ja atacou/);

  passTurn(battle); // troca para o jogador 2
  passTurn(battle); // volta para o jogador 1, ataque deve estar liberado de novo
  assert.equal(battle.players[0].attacked_this_turn, false);
});

test('winner is returned when one side has no alive cards', () => {
  const battle = makeBattle();
  for (const fighter of battle.players[1].fighters) fighter.alive = false;
  assert.equal(getWinner(battle).name, 'Player 1');
});
