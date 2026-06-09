export type EffectCard = {
  id: string;
  type: 'effect_card';
  foto: string | null;
  foto_fake: string;
  categoria_key: string;
  categoria: string;
  icon: string;
  polaridade: 'BÔNUS' | 'DEBUFF';
  atributo: 'ATK' | 'DEF' | 'LCK' | 'SPD' | string;
  intensidade: number;
  raridade: string;
  nome_efeito: string;
  criado_em: string;
};

export function seedCards(): EffectCard[];
