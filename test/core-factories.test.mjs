import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEffectCard, seedCards } from '../src/js/core/cards.js';
import { createFighter, seedFighters } from '../src/js/core/fighters.js';

function withRandomSequence(values, fn) {
  const original = Math.random;
  let index = 0;
  Math.random = () => values[Math.min(index++, values.length - 1)];
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test('createFighter validates class and required name', () => {
  assert.throws(() => createFighter({ classKey: 'invalid', name: 'Hero' }), /Classe inválida/);
  assert.throws(() => createFighter({ classKey: 'guerreiro', name: '   ' }), /Nome do lutador/);
});

test('createFighter trims names, applies rarity bonus and preserves AI attack text', () => {
  const fighter = withRandomSequence([0, 0.99, 0], () => createFighter({
    classKey: 'guerreiro',
    name: '  Heroi  ',
    photo: 'file://photo.jpg',
    attackName: '  Corte Final  ',
    missName: '  caiu sozinho  ',
  }));

  assert.equal(fighter.nome, 'Heroi');
  assert.equal(fighter.class_key, 'guerreiro');
  assert.equal(fighter.foto, 'file://photo.jpg');
  assert.equal(fighter.atk, 13);
  assert.equal(fighter.bonus_atributo, 'atk');
  assert.equal(fighter.bonus_intensidade, 5);
  assert.equal(fighter.golpe, 'Corte Final');
  assert.equal(fighter.erro, 'caiu sozinho');
  assert.match(fighter.id, /\w+/);
});

test('createEffectCard validates category and required name', () => {
  assert.throws(() => createEffectCard({ categoryKey: 'invalid', name: 'Card' }), /Categoria inválida/);
  assert.throws(() => createEffectCard({ categoryKey: 'natural', name: '' }), /Nome do efeito/);
});

test('createEffectCard trims name and applies rolled effect metadata', () => {
  const card = withRandomSequence([0, 0.99, 0.99, 0], () => createEffectCard({
    categoryKey: 'natural',
    name: '  Carta Forte  ',
    photo: 'file://card.jpg',
  }));

  assert.equal(card.nome_efeito, 'Carta Forte');
  assert.equal(card.categoria_key, 'natural');
  assert.equal(card.foto, 'file://card.jpg');
  assert.equal(card.polaridade, 'DEBUFF');
  assert.equal(card.atributo, 'SPD');
  assert.equal(card.intensidade, 5);
  assert.equal(card.raridade, '🟡 Lendário');
});

test('seed factories provide battle-ready minimum inventories', () => {
  assert.equal(seedFighters().length, 6);
  assert.equal(seedCards().length, 6);
});
