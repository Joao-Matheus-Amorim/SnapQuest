import { useRef, useState } from "react";
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
  // battleRef e a UNICA fonte da verdade mutavel. As acoes do core mutam ela
  // no lugar. O estado React abaixo guarda apenas um CLONE imutavel para render.
  // Isso evita stale closure (a ref e sempre a ultima) e divergencia de objeto
  // (a coisa mutada e exatamente a coisa que vira o proximo estado).
  const battleRef = useRef<Battle | null>(null);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [winner, setWinner] = useState<BattlePlayer | { name: string } | null>(null);
  const [waitingPass, setWaitingPass] = useState(false);
  const [resolvingAttack, setResolvingAttack] = useState(false);
  const resolvingRef = useRef(false);
  const waitingRef = useRef(false);

  function sync() {
    setBattle(battleRef.current ? deepClone(battleRef.current) : null);
  }

  function setResolving(value: boolean) {
    resolvingRef.current = value;
    setResolvingAttack(value);
  }

  function setWaiting(value: boolean) {
    waitingRef.current = value;
    setWaitingPass(value);
  }

  function blocked() {
    return !battleRef.current || waitingRef.current || resolvingRef.current;
  }

  function start(fighters: unknown[], cards: unknown[], p1 = "Jogador 1", p2 = "Jogador 2") {
    const b = createBattle({ fighters, cards, playerName: p1, player2Name: p2 });
    battleRef.current = b;
    setWinner(null);
    setWaiting(false);
    setResolving(false);
    sync();
  }

  function draw() {
    if (blocked()) return;
    drawCard(battleRef.current!);
    sync();
  }

  function selectOwn(id: string) {
    if (blocked()) return;
    const b = battleRef.current!;
    b.selectedOwnId = b.selectedOwnId === id ? null : id;
    sync();
  }

  function selectEnemy(id: string) {
    if (blocked()) return;
    const b = battleRef.current!;
    b.selectedEnemyId = b.selectedEnemyId === id ? null : id;
    sync();
  }

  function selectCard(id: string) {
    if (blocked()) return;
    const b = battleRef.current!;
    b.selectedCardId = b.selectedCardId === id ? null : id;
    sync();
  }

  function useCard() {
    if (blocked()) return undefined;
    const result = useSelectedCard(battleRef.current!);
    sync();
    return result;
  }

  function useCardFrom(id: string, targetId?: string | null) {
    if (blocked()) return undefined;
    const b = battleRef.current!;
    const card = b.players[b.turn].hand.find((item) => item.id === id && !item.used);
    b.selectedCardId = id;
    if (targetId) {
      if (card?.polaridade === "DEBUFF") b.selectedEnemyId = targetId;
      else b.selectedOwnId = targetId;
    }
    const result = useSelectedCard(b);
    sync();
    return result;
  }

  function resolveAttack(): ActionResult | undefined {
    const b = battleRef.current;
    if (!b) return undefined;
    const result = attackSelectedTarget(b);
    sync();
    if (result.ok) {
      setResolving(true);
      setTimeout(() => {
        setResolving(false);
        if (result.winner) setWinner(result.winner ?? null);
      }, ATTACK_RESOLUTION_MS);
    }
    return result;
  }

  function attack() {
    if (blocked()) return undefined;
    return resolveAttack();
  }

  function attackFrom(id: string, targetId?: string | null) {
    if (blocked()) return undefined;
    const b = battleRef.current!;
    b.selectedOwnId = id;
    if (targetId) b.selectedEnemyId = targetId;
    return resolveAttack();
  }

  function endTurn() {
    if (blocked()) return;
    passTurn(battleRef.current!);
    sync();
    setWaiting(true);
  }

  function confirmPass() {
    setWaiting(false);
  }

  function reset() {
    battleRef.current = null;
    setBattle(null);
    setWinner(null);
    setWaiting(false);
    setResolving(false);
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
