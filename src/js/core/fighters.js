import { CLASSES, rollFighterBonus, generateGolpe, generateMiss } from './balance.js';
import { uid, pick, fakePhotos } from './utils.js';

export function createFighter({ classKey, name, photo, attackName, missName }) {
  const cls = CLASSES.find(item => item.key === classKey);
  if (!cls) throw new Error('Classe inválida.');
  if (!name?.trim()) throw new Error('Nome do lutador é obrigatório.');

  const bonus = rollFighterBonus();
  const cleanName = name.trim();
  const fighter = {
    id: uid(),
    type: 'fighter',
    foto: photo || null,
    foto_fake: pick(fakePhotos),
    classe: cls.name,
    class_key: cls.key,
    icon: cls.icon,
    hp: cls.hp,
    atk: cls.atk,
    def: cls.def,
    lck: cls.lck,
    spd: cls.spd,
    bonus_atributo: bonus.attr,
    bonus_intensidade: bonus.value,
    nome: cleanName,
    golpe: attackName?.trim() || generateGolpe(cleanName),
    erro: missName?.trim() || generateMiss(cleanName),
    criado_em: new Date().toISOString(),
  };

  fighter[bonus.attr] += bonus.value;
  return fighter;
}

export function seedFighters() {
  return [
    createFighter({ classKey:'guerreiro', name:'Guardião do Sofá' }),
    createFighter({ classKey:'arqueiro', name:'Flecha do Quintal' }),
    createFighter({ classKey:'paladino', name:'Escudo do Pai' }),
    createFighter({ classKey:'mago', name:'Brasa do Controle' }),
    createFighter({ classKey:'arqueiro', name:'Olho de Águia' }),
    createFighter({ classKey:'guerreiro', name:'Espada de Almofada' }),
  ];
}
