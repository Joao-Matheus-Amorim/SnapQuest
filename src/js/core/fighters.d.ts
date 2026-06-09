export type Fighter = {
  id: string;
  type: 'fighter';
  foto: string | null;
  foto_fake: string;
  classe: string;
  class_key: string;
  icon: string;
  hp: number;
  atk: number;
  def: number;
  lck: number;
  spd: number;
  bonus_atributo: string;
  bonus_intensidade: number;
  nome: string;
  criado_em: string;
};

export type CreateFighterInput = {
  classKey: string;
  name: string;
  photo?: string | null;
};

export function createFighter(input: CreateFighterInput): Fighter;
export function seedFighters(): Fighter[];
