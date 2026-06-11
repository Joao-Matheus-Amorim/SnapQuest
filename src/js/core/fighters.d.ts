export type Fighter = {
  id: string;
  type: 'fighter';
  foto: string | null;
  foto_storage_path?: string | null;
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
  golpe: string;
  erro: string;
  criado_em: string;
};

export type CreateFighterInput = {
  classKey: string;
  name: string;
  photo?: string | null;
  attackName?: string;
  missName?: string;
};

export function createFighter(input: CreateFighterInput): Fighter;
export function seedFighters(): Fighter[];
