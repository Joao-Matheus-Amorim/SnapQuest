import type { Fighter } from "./fighters";
import type { EffectCard } from "./cards";

export type BattleAbility = "provocar" | "escudo" | "veneno";

export type BattleFighter = Fighter & {
  ability: BattleAbility;
  max_hp: number;
  current_hp: number;
  alive: boolean;
  eliminated?: boolean;
  active: boolean;
  reserve: boolean;
  buffs: { atk: number; def: number; lck: number; spd: number; hp?: number };
  shield_active?: boolean;
  poison?: { turns: number; damage: number; sourceId?: string } | null;
  attacked?: boolean;
};

export type BattleCard = EffectCard & { used: boolean; cost: number };

export interface BattlePlayer {
  name: string;
  fighters: BattleFighter[];
  deck: BattleCard[];
  hand: BattleCard[];
  drawn_this_turn: boolean;
  attacked_this_turn: boolean;
  energy: number;
  max_energy: number;
}

export interface Battle {
  players: [BattlePlayer, BattlePlayer];
  turn: 0 | 1;
  selectedOwnId: string | null;
  selectedEnemyId: string | null;
  selectedCardId: string | null;
  log: string[];
  history: { id: string; text: string; createdAt: number }[];
  startedAt: number;
  stats: { damageByPlayer: [number, number]; cardsEliminated: number };
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  winner?: BattlePlayer | { name: string };
  damage?: number;
  d20?: number;
  speedModifier?: number;
  needsPass?: boolean;
  moveName?: string;
  missName?: string;
  critical?: boolean;
  procName?: string;
  miss?: boolean;
  effectName?: string;
  targetId?: string;
  targetName?: string;
  attr?: string;
  value?: number;
  isDebuff?: boolean;
  energyCost?: number;
  cardId?: string;
  attackerId?: string;
  blocked?: boolean;
}

export interface TurnGuidance {
  phase: string;
  hint: string;
  nextAction: string;
}

export function canStartBattle(fighters: unknown[], cards: unknown[]): boolean;
export function cardEnergyCost(card: Partial<BattleCard> | unknown): number;
export function canAffordCard(player: BattlePlayer, card: BattleCard): boolean;
export function effectiveStat(fighter: BattleFighter, stat: "atk" | "def" | "lck" | "spd"): number;
export function effectiveBattleStats(fighter: BattleFighter): {
  atk: number;
  def: number;
  lck: number;
  spd: number;
};
export function createBattle(opts: {
  fighters: unknown[];
  cards: unknown[];
  playerName?: string;
  player2Name?: string;
}): Battle;
export function currentPlayer(battle: Battle): BattlePlayer;
export function enemyPlayer(battle: Battle): BattlePlayer;
export function totalHp(player: BattlePlayer): number;
export function getTurnGuidance(battle: Battle): TurnGuidance;
export function getMatchupHint(battle: Battle): "vantagem" | "desvantagem" | null;
export function previewAttack(battle: Battle, attackerId?: string | null, defenderId?: string | null): { attackerName: string; defenderName: string; min: number; max: number } | null;
export function canUseSelectedCard(battle: Battle): boolean;
export function canAttackSelectedTarget(battle: Battle): boolean;
export function drawCard(battle: Battle): ActionResult;
export function useSelectedCard(battle: Battle): ActionResult;
export function attackSelectedTarget(battle: Battle): ActionResult;
export function passTurn(battle: Battle): void;
export function getWinner(battle: Battle): BattlePlayer | { name: string } | null;
