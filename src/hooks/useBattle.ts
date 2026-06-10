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
  canUseSelectedCard,
  canAttackSelectedTarget,
  type Battle,
  type BattlePlayer,
} from "../js/core/battle.js";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function useBattle() {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [winner, setWinner] = useState<BattlePlayer | { name: string } | null>(null);
  const [waitingPass, setWaitingPass] = useState(false);

  function refresh(b: Battle) {
    setBattle(deepClone(b));
  }

  function start(fighters: unknown[], cards: unknown[], p1 = "Jogador 1", p2 = "Jogador 2") {
    const b = createBattle({ fighters, cards, playerName: p1, player2Name: p2 });
    setWinner(null);
    setWaitingPass(false);
    setBattle(deepClone(b));
  }

  function draw() {
    if (!battle || waitingPass) return;
    drawCard(battle);
    refresh(battle);
  }

  function selectOwn(id: string) {
    if (!battle || waitingPass) return;
    battle.selectedOwnId = battle.selectedOwnId === id ? null : id;
    refresh(battle);
  }

  function selectEnemy(id: string) {
    if (!battle || waitingPass) return;
    battle.selectedEnemyId = battle.selectedEnemyId === id ? null : id;
    refresh(battle);
  }

  function selectCard(id: string) {
    if (!battle || waitingPass) return;
    battle.selectedCardId = battle.selectedCardId === id ? null : id;
    refresh(battle);
  }

  function useCard() {
    if (!battle || waitingPass) return;
    useSelectedCard(battle);
    refresh(battle);
  }

  function attack() {
    if (!battle || waitingPass) return;
    const result = attackSelectedTarget(battle);
    if (result.winner) {
      refresh(battle);
      setWinner(result.winner);
    } else if (result.ok) {
      refresh(battle);
      setWaitingPass(true);
    }
  }

  function endTurn() {
    if (!battle || waitingPass) return;
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
  }

  const curPlayer = battle ? currentPlayer(battle) : null;
  const foePlayer = battle ? enemyPlayer(battle) : null;
  const guidance = battle && !waitingPass ? getTurnGuidance(battle) : null;
  const matchup = battle && !waitingPass ? getMatchupHint(battle) : null;
  const canUseCard = battle ? canUseSelectedCard(battle) : false;
  const canAttack = battle ? canAttackSelectedTarget(battle) : false;

  return {
    battle,
    winner,
    waitingPass,
    guidance,
    matchup,
    canUseCard,
    canAttack,
    curPlayer,
    foePlayer,
    start,
    draw,
    selectOwn,
    selectEnemy,
    selectCard,
    useCard,
    attack,
    endTurn,
    confirmPass,
    reset,
  };
}
