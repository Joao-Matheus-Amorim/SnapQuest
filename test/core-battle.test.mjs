import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  attackSelectedTarget,
  canStartBattle,
  canAttackSelectedTarget,
  canUseSelectedCard,
  createBattle,
  drawCard,
  getMatchupHint,
  getTurnGuidance,
  getWinner,
  passTurn,
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
    bonus_intensidade: 1,
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
    raridade: 'Comum',
    criado_em: '2026-06-10T00:00:00.000Z',
  };
}

function makeFighters() {
  return [
    fighter({ id: 'p1-a', nome: 'P1 A', class_key: 'guerreiro', spd: 1 }),
    fighter({ id: 'p1-b', nome: 'P1 B', class_key: 'arqueiro', spd: 1 }),
    fighter({ id: 'p1-c', nome: 'P1 C', class_key: 'mago', spd: 1 }),
    fighter({ id: 'p2-a', nome: 'P2 A', class_key: 'paladino', spd: 8 }),
    fighter({ id: 'p2-b', nome: 'P2 B', class_key: 'guerreiro', spd: 8 }),
    fighter({ id: 'p2-c', nome: 'P2 C', class_key: 'arqueiro', spd: 8 }),
  ];
}

function makeCards() {
  return [
    card({ id: 'p1-card-a', nome_efeito: 'P1 Boost', polaridade: 'BÔNUS', atributo: 'ATK', intensidade: 2 }),
    card({ id: 'p1-card-b', nome_efeito: 'P1 Debuff', polaridade: 'DEBUFF', atributo: 'DEF', intensidade: 1 }),
    card({ id: 'p1-card-c', nome_efeito: 'P1 Speed', polaridade: 'BÔNUS', atributo: 'SPD', intensidade: 1 }),
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

  assert.throws(
    () => createBattle({ fighters: makeFighters().slice(0, 5), cards: makeCards() }),
    /Precisa de 6 lutadores/
  );
});

test('createBattle splits teams and starts with the fastest total SPD', () => {
  const battle = makeBattle();

  assert.equal(battle.players[0].fighters.length, 3);
  assert.equal(battle.players[1].fighters.length, 3);
  assert.equal(battle.players[0].deck.length, 3);
  assert.equal(battle.players[1].deck.length, 3);
  assert.equal(battle.turn, 1);
  assert.match(battle.log[0], /Player 2/);
});

test('drawCard adds one card to hand and only works once per turn', () => {
  const battle = makeBattle();
  battle.turn = 0;

  const first = drawCard(battle);
  const second = drawCard(battle);

  assert.deepEqual(first, { ok: true });
  assert.equal(second.ok, false);
  assert.equal(battle.players[0].hand.length, 1);
  assert.equal(battle.players[0].deck.length, 2);
  assert.equal(battle.players[0].drawn_this_turn, true);
});

test('useSelectedCard applies bonus to own fighter and removes used cards on passTurn', () => {
  const battle = makeBattle();
  battle.turn = 0;

  drawCard(battle);
  battle.selectedOwnId = 'p1-a';
  battle.selectedCardId = 'p1-card-a';

  assert.equal(canUseSelectedCard(battle), true);
  const result = useSelectedCard(battle);

  assert.deepEqual(result, { ok: true });
  assert.equal(battle.players[0].fighters[0].buffs.atk, 2);
  assert.equal(battle.players[0].hand[0].used, true);

  passTurn(battle);

  assert.equal(battle.players[0].hand.length, 0);
  assert.equal(battle.turn, 1);
});

test('useSelectedCard applies debuff to enemy fighter', () => {
  const battle = makeBattle();
  battle.turn = 0;

  battle.players[0].hand = [card({ id: 'manual-debuff', polaridade: 'DEBUFF', atributo: 'DEF', intensidade: 3 })];
  battle.selectedCardId = 'manual-debuff';
  battle.selectedEnemyId = 'p2-a';

  const result = useSelectedCard(battle);

  assert.deepEqual(result, { ok: true });
  assert.equal(battle.players[1].fighters[0].buffs.def, -3);
});

test('attackSelectedTarget requires draw, damages target, and passes turn', () => {
  const battle = makeBattle();
  battle.turn = 0;

  assert.equal(attackSelectedTarget(battle).ok, false);

  drawCard(battle);
  battle.selectedOwnId = 'p1-a';
  battle.selectedEnemyId = 'p2-a';

  assert.equal(canAttackSelectedTarget(battle), true);
  const result = withRandom(0.49, () => attackSelectedTarget(battle)); // d20 = 10

  assert.equal(result.ok, true);
  assert.equal(result.d20, 10);
  assert.equal(battle.players[1].fighters[0].current_hp < battle.players[1].fighters[0].max_hp, true);
  assert.equal(battle.turn, 1);
  assert.equal(battle.selectedOwnId, null);
  assert.equal(battle.selectedEnemyId, null);
});

test('attackSelectedTarget returns winner when last enemy falls', () => {
  const battle = makeBattle();
  battle.turn = 0;

  for (const defender of battle.players[1].fighters) {
    defender.current_hp = 0;
    defender.alive = false;
  }
  battle.players[1].fighters[0].current_hp = 1;
  battle.players[1].fighters[0].alive = true;

  drawCard(battle);
  battle.selectedOwnId = 'p1-a';
  battle.selectedEnemyId = 'p2-a';

  const result = withRandom(0.99, () => attackSelectedTarget(battle)); // d20 = 20

  assert.equal(result.ok, true);
  assert.equal(result.winner.name, 'Player 1');
  assert.equal(getWinner(battle).name, 'Player 1');
});

test('getTurnGuidance walks the expected player action phases', () => {
  const battle = makeBattle();
  battle.turn = 0;

  assert.equal(getTurnGuidance(battle).nextAction, 'draw');

  drawCard(battle);
  assert.equal(getTurnGuidance(battle).nextAction, 'select-attacker');

  battle.selectedOwnId = 'p1-a';
  assert.equal(getTurnGuidance(battle).nextAction, 'select-target');

  battle.selectedEnemyId = 'p2-a';
  assert.equal(getTurnGuidance(battle).nextAction, 'attack');
});

test('class advantage and disadvantage are exposed for selected matchup', () => {
  const battle = makeBattle();
  battle.turn = 0;

  battle.selectedOwnId = 'p1-a'; // guerreiro
  battle.selectedEnemyId = 'p2-c'; // arqueiro
  assert.equal(getMatchupHint(battle), 'vantagem');

  battle.selectedOwnId = 'p1-b'; // arqueiro
  battle.selectedEnemyId = 'p2-b'; // guerreiro
  assert.equal(getMatchupHint(battle), 'desvantagem');
});

test('class advantage changes final damage after the d20 roll', () => {
  const battle = makeBattle();
  battle.turn = 0;
  const defender = battle.players[1].fighters[2]; // arqueiro
  defender.hp = 100;
  defender.max_hp = 100;
  defender.current_hp = 100;
  defender.def = 4;

  drawCard(battle);
  battle.selectedOwnId = 'p1-a'; // guerreiro has advantage over arqueiro
  battle.selectedEnemyId = 'p2-c';

  const result = withRandom(0.49, () => attackSelectedTarget(battle)); // d20 = 10

  assert.equal(result.damage, 18);
  assert.equal(defender.current_hp, 82);
});

test('high LCK expands critical hit threshold', () => {
  const battle = makeBattle();
  battle.turn = 0;
  const attacker = battle.players[0].fighters[0];
  const defender = battle.players[1].fighters[0];
  attacker.lck = 9; // crit threshold becomes 17
  attacker.atk = 8;
  defender.class_key = 'mago';
  defender.def = 4;
  defender.hp = 100;
  defender.max_hp = 100;
  defender.current_hp = 100;

  drawCard(battle);
  battle.selectedOwnId = attacker.id;
  battle.selectedEnemyId = defender.id;

  const result = withRandom(0.8, () => attackSelectedTarget(battle)); // d20 = 17

  assert.equal(result.d20, 17);
  assert.equal(result.damage, 42);
  assert.match(battle.log.at(-2), /CRÍTICO/);
});

test('natural 1 causes critical failure with minimum damage', () => {
  const battle = makeBattle();
  battle.turn = 0;
  const defender = battle.players[1].fighters[0];
  defender.hp = 100;
  defender.max_hp = 100;
  defender.current_hp = 100;

  drawCard(battle);
  battle.selectedOwnId = 'p1-a';
  battle.selectedEnemyId = 'p2-a';

  const result = withRandom(0, () => attackSelectedTarget(battle)); // d20 = 1

  assert.equal(result.damage, 1);
  assert.equal(defender.current_hp, 99);
  assert.match(battle.log.at(-2), /FALHA/);
});

test('reserve fighter enters the field when an active fighter falls', () => {
  const battle = makeBattle();
  battle.turn = 0;
  const activeDefender = battle.players[1].fighters[0];
  const reserve = battle.players[1].fighters[2];
  activeDefender.current_hp = 1;
  reserve.reserve = true;
  reserve.active = false;
  reserve.alive = true;

  drawCard(battle);
  battle.selectedOwnId = 'p1-a';
  battle.selectedEnemyId = activeDefender.id;

  const result = withRandom(0.99, () => attackSelectedTarget(battle)); // d20 = 20

  assert.equal(result.ok, true);
  assert.equal(activeDefender.alive, false);
  assert.equal(reserve.reserve, false);
  assert.equal(reserve.active, true);
  assert.equal(battle.log.some((line) => line.includes('colocou')), true);
});
