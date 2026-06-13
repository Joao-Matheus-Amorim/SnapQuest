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
    description: '  Heroi guarda uma lenda propria escrita pela IA.  ',
  }));

  assert.equal(fighter.nome, 'Heroi');
  assert.equal(fighter.class_key, 'guerreiro');
  assert.equal(fighter.foto, 'file://photo.jpg');
  assert.equal(fighter.foto_storage_path, null);
  assert.equal(fighter.atk, 13);
  assert.equal(fighter.bonus_atributo, 'atk');
  assert.equal(fighter.bonus_intensidade, 5);
  assert.equal(fighter.golpe, 'Corte Final');
  assert.equal(fighter.erro, 'caiu sozinho');
  assert.equal(fighter.descricao, 'Heroi guarda uma lenda propria escrita pela IA.');
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
  assert.equal(card.foto_storage_path, null);
  assert.equal(card.polaridade, 'DEBUFF');
  assert.equal(card.atributo, 'HP');
  assert.equal(card.intensidade, 5);
  assert.equal(card.raridade, '🟡 Lendário');
});

test('createEffectCard preserves AI effect metadata when provided', () => {
  const card = withRandomSequence([0.9, 0, 0], () => createEffectCard({
    categoryKey: 'liquido',
    name: '  Fonte no Copo  ',
    photo: 'file://water.jpg',
    polarity: 'BÔNUS',
    attribute: 'HP',
    intensity: 2,
    description: 'Este copo d agua foi retirado da Fonte da Juventude; aumenta 2 de HP.',
  }));

  assert.equal(card.nome_efeito, 'Fonte no Copo');
  assert.equal(card.categoria_key, 'liquido');
  assert.equal(card.polaridade, 'BÔNUS');
  assert.equal(card.atributo, 'HP');
  assert.equal(card.intensidade, 2);
  // Raridade deriva da intensidade final (custo acompanha o beneficio), mesmo com
  // a intensidade vindo da IA e o sorteio interno tendo dado outro tier.
  assert.equal(card.raridade, '🟢 Incomum');
  assert.equal(card.descricao, 'Este copo d agua foi retirado da Fonte da Juventude; aumenta 2 de HP.');
});

test('seed factories provide battle-ready minimum inventories', () => {
  assert.equal(seedFighters().length, 6);
  assert.equal(seedCards().length, 6);
});
