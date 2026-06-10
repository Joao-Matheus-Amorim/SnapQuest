import type { Fighter } from "./fighters";
import type { EffectCard } from "./cards";

export type BattleFighter = Fighter & {
  max_hp: number;
  current_hp: number;
  alive: boolean;
  active: boolean;
  reserve: boolean;
  buffs: { atk: number; def: number; lck: number; spd: number };
};

export type BattleCard = EffectCard & { used: boolean };

export interface BattlePlayer {
  name: string;
  fighters: BattleFighter[];
  deck: BattleCard[];
  hand: BattleCard[];
  drawn_this_turn: boolean;
}

export interface Battle {
  players: [BattlePlayer, BattlePlayer];
  turn: 0 | 1;
  selectedOwnId: string | null;
  selectedEnemyId: string | null;
  selectedCardId: string | null;
  log: string[];
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  winner?: BattlePlayer | { name: string };
  damage?: number;
  d20?: number;
}

export interface TurnGuidance {
  phase: string;
  hint: string;
  nextAction: string;
}

export function canStartBattle(fighters: unknown[], cards: unknown[]): boolean;
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
export function canUseSelectedCard(battle: Battle): boolean;
export function canAttackSelectedTarget(battle: Battle): boolean;
export function drawCard(battle: Battle): ActionResult;
export function useSelectedCard(battle: Battle): ActionResult;
export function attackSelectedTarget(battle: Battle): ActionResult;
export function passTurn(battle: Battle): void;
export function getWinner(battle: Battle): BattlePlayer | { name: string } | null;
