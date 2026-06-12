import { useState } from "react";
import {
  createBattle,
  drawCard,
  useSelectedCard,
  attackSelectedTarget,
  passTurn,
  currentPlayer,
  enemyPlayer,
  getTurnGuidance,
  getMatchupHint,
  previewAttack,
  canUseSelectedCard,
  canAttackSelectedTarget,
  type Battle,
  type BattlePlayer,
  type ActionResult,
} from "../js/core/battle.js";

const ATTACK_RESOLUTION_MS = 1200;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function useBattle() {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [winner, setWinner] = useState<BattlePlayer | { name: string } | null>(null);
  const [waitingPass, setWaitingPass] = useState(false);
  const [resolvingAttack, setResolvingAttack] = useState(false);

  function refresh(b: Battle) {
    setBattle(deepClone(b));
  }

  function start(fighters: unknown[], cards: unknown[], p1 = "Jogador 1", p2 = "Jogador 2") {
    const b = createBattle({ fighters, cards, playerName: p1, player2Name: p2 });
    setWinner(null);
    setWaitingPass(false);
    setResolvingAttack(false);
    setBattle(deepClone(b));
  }

  function draw() {
    if (!battle || waitingPass || resolvingAttack) return;
    drawCard(battle);
    refresh(battle);
  }

  function selectOwn(id: string) {
    if (!battle || waitingPass || resolvingAttack) return;
    battle.selectedOwnId = battle.selectedOwnId === id ? null : id;
    refresh(battle);
  }

  function selectEnemy(id: string) {
    if (!battle || waitingPass || resolvingAttack) return;
    battle.selectedEnemyId = battle.selectedEnemyId === id ? null : id;
    refresh(battle);
  }

  function selectCard(id: string) {
    if (!battle || waitingPass || resolvingAttack) return;
    battle.selectedCardId = battle.selectedCardId === id ? null : id;
    refresh(battle);
  }

  function useCard() {
    if (!battle || waitingPass || resolvingAttack) return undefined;
    const result = useSelectedCard(battle);
    refresh(battle);
    return result;
  }

  function useCardFrom(id: string, targetId?: string | null) {
    if (!battle || waitingPass || resolvingAttack) return undefined;
    const card = battle.players[battle.turn].hand.find((item) => item.id === id && !item.used);
    battle.selectedCardId = id;
    if (targetId) {
      if (card?.polaridade === "DEBUFF") battle.selectedEnemyId = targetId;
      else battle.selectedOwnId = targetId;
    }
    const result = useSelectedCard(battle);
    refresh(battle);
    return result;
  }

  function resolveAttack(): ActionResult | undefined {
    if (!battle) return undefined;
    const result = attackSelectedTarget(battle);
    refresh(battle);
    if (result.ok) {
      setResolvingAttack(true);
      setTimeout(() => {
        setResolvingAttack(false);
        if (result.winner) setWinner(result.winner ?? null);
      }, ATTACK_RESOLUTION_MS);
    }
    return result;
  }

  function attack() {
    if (!battle || waitingPass || resolvingAttack) return undefined;
    return resolveAttack();
  }

  function attackFrom(id: string, targetId?: string | null) {
    if (!battle || waitingPass || resolvingAttack) return undefined;
    battle.selectedOwnId = id;
    if (targetId) battle.selectedEnemyId = targetId;
    return resolveAttack();
  }

  function endTurn() {
    if (!battle || waitingPass || resolvingAttack) return;
    passTurn(battle);
    refresh(battle);
    setWaitingPass(true);
  }

  function confirmPass() {
    setWaitingPass(false);
  }

  function reset() {
    setBattle(null);
    setWinner(null);
    setWaitingPass(false);
    setResolvingAttack(false);
  }

  const curPlayer = battle ? currentPlayer(battle) : null;
  const foePlayer = battle ? enemyPlayer(battle) : null;
  const guidance = battle && !waitingPass && !resolvingAttack ? getTurnGuidance(battle) : null;
  const matchup = battle && !waitingPass && !resolvingAttack ? getMatchupHint(battle) : null;
  const canUseCard = battle && !resolvingAttack ? canUseSelectedCard(battle) : false;
  const canAttack = battle && !resolvingAttack ? canAttackSelectedTarget(battle) : false;
  const attackPreview = battle && !resolvingAttack ? previewAttack(battle) : null;

  return {
    battle,
    winner,
    waitingPass,
    resolvingAttack,
    guidance,
    matchup,
    canUseCard,
    canAttack,
    attackPreview,
    curPlayer,
    foePlayer,
    start,
    draw,
    selectOwn,
    selectEnemy,
    selectCard,
    useCard,
    useCardFrom,
    attack,
    attackFrom,
    endTurn,
    confirmPass,
    reset,
  };
}
