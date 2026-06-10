import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EFFECT_CATEGORIES,
  CLASSES,
  generateGolpe,
  generateMiss,
  rollEffect,
  rollFighterBonus,
  rollRarity,
} from '../src/js/core/balance.js';

function sequenceRandom(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

test('classes and effect categories expose stable gameplay keys', () => {
  assert.deepEqual(CLASSES.map((item) => item.key), ['guerreiro', 'arqueiro', 'mago', 'paladino']);
  assert.deepEqual(
    EFFECT_CATEGORIES.map((item) => item[0]),
    ['natural', 'consumivel', 'ferramenta', 'criatura', 'vestimenta', 'fogo', 'liquido', 'conhecimento']
  );
});

test('rollRarity preserves tier boundaries', () => {
  assert.equal(rollRarity(() => 0), 1);
  assert.equal(rollRarity(() => 0.5), 2);
  assert.equal(rollRarity(() => 0.79), 3);
  assert.equal(rollRarity(() => 0.94), 4);
  assert.equal(rollRarity(() => 0.99), 5);
});

test('rollFighterBonus returns one allowed stat and rarity-scaled value', () => {
  assert.deepEqual(rollFighterBonus(sequenceRandom([0, 0.99])), { attr: 'atk', value: 5 });
  assert.deepEqual(rollFighterBonus(sequenceRandom([0.26, 0])), { attr: 'def', value: 1 });
  assert.deepEqual(rollFighterBonus(sequenceRandom([0.51, 0.8])), { attr: 'lck', value: 3 });
  assert.deepEqual(rollFighterBonus(sequenceRandom([0.76, 0.95])), { attr: 'spd', value: 4 });
});

test('rollEffect normalizes polarity, attribute, intensity and rarity', () => {
  assert.deepEqual(rollEffect(sequenceRandom([0, 0, 0])), {
    polaridade: 'DEBUFF',
    atributo: 'ATK',
    intensidade: 1,
    raridade: '⚪ Comum',
  });

  assert.deepEqual(rollEffect(sequenceRandom([0.9, 0.99, 0.99])), {
    polaridade: 'BÔNUS',
    atributo: 'SPD',
    intensidade: 5,
    raridade: '🟡 Lendário',
  });
});

test('generated attack and miss names are deterministic by seed', () => {
  assert.equal(generateGolpe('Guardiao'), generateGolpe('Guardiao'));
  assert.notEqual(generateGolpe('Guardiao'), generateGolpe('Outro'));
  assert.equal(generateMiss('Guardiao'), generateMiss('Guardiao'));
  assert.notEqual(generateMiss('Guardiao'), generateMiss('Outro'));
});
