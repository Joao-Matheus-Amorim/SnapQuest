import { clamp, clone, rand } from './utils.js';

// Triângulo de vantagem entre classes (cada um vence o próximo, em ciclo).
// guerreiro → arqueiro → mago → paladino → guerreiro
const CLASS_ADVANTAGE = {
  guerreiro: 'arqueiro',
  arqueiro: 'mago',
  mago: 'paladino',
  paladino: 'guerreiro',
};

// Retorna o efeito da matchup do atacante contra o defensor.
function classMatchup(attacker, defender) {
  if (CLASS_ADVANTAGE[attacker.class_key] === defender.class_key) return { mult: 1.3, label: 'vantagem' };
  if (CLASS_ADVANTAGE[defender.class_key] === attacker.class_key) return { mult: 0.75, label: 'desvantagem' };
  return { mult: 1, label: null };
}

// LCK amplia a faixa de crítico. Sorte 0-2: crítico só no 20. Sorte alta: até 17-20.
function critThreshold(lck) {
  return 20 - Math.min(3, Math.floor((lck || 0) / 3));
}

const BATTLE_STATS = ['atk', 'def', 'lck', 'spd', 'hp'];

export function effectiveStat(fighter, stat) {
  if (!BATTLE_STATS.includes(stat)) throw new Error('Atributo de batalha invalido.');
  return Math.max(0, (fighter?.[stat] || 0) + (fighter?.buffs?.[stat] || 0));
}

export function effectiveBattleStats(fighter) {
  return {
    atk: effectiveStat(fighter, 'atk'),
    def: effectiveStat(fighter, 'def'),
    lck: effectiveStat(fighter, 'lck'),
    spd: effectiveStat(fighter, 'spd'),
  };
}

function speedDamageModifier(attacker, defender) {
  const speedDelta = effectiveStat(attacker, 'spd') - effectiveStat(defender, 'spd');
  return clamp(Math.trunc(speedDelta / 3), -3, 3);
}

export function canStartBattle(fighters, cards) {
  return fighters.length >= 6 && cards.length >= 6;
}

export function createBattle({ fighters, cards, playerName, player2Name }) {
  if (!canStartBattle(fighters, cards)) {
    throw new Error('Precisa de 6 lutadores e 6 cartas para simular dois jogadores.');
  }

  const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5).slice(0, 6).map(clone);
  const shuffledCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 6).map(clone);

  const players = [0, 1].map(index => {
    const team = shuffledFighters.slice(index * 3, index * 3 + 3).map((fighter, fighterIndex) => ({
      ...fighter,
      max_hp: fighter.hp,
      current_hp: fighter.hp,
      alive: true,
      active: fighterIndex < 2,
      reserve: fighterIndex === 2,
      buffs: { atk: 0, def: 0, lck: 0, spd: 0, hp: 0 },
    }));

    return {
      name: index === 0 ? (playerName || 'Jogador 1') : (player2Name || 'Jogador 2'),
      fighters: team,
      deck: shuffledCards.slice(index * 3, index * 3 + 3).map(card => ({ ...card, used: false })),
      hand: [],
      drawn_this_turn: false,
    };
  });

  // Iniciativa: o time mais rápido (maior SPD total) começa. Empate → Jogador 1.
  const teamSpd = (p) => p.fighters.reduce((total, f) => total + effectiveStat(f, 'spd'), 0);
  const turn = teamSpd(players[1]) > teamSpd(players[0]) ? 1 : 0;

  return {
    players,
    turn,
    selectedOwnId: null,
    selectedEnemyId: null,
    selectedCardId: null,
    log: [`⚡ ${players[turn].name} é mais rápido e começa!`],
  };
}

export function currentPlayer(battle) {
  return battle.players[battle.turn];
}

export function enemyPlayer(battle) {
  return battle.players[battle.turn === 0 ? 1 : 0];
}

export function totalHp(player) {
  return player.fighters.reduce((total, fighter) => total + Math.max(0, fighter.current_hp), 0);
}

export function getTurnGuidance(battle) {
  const player = currentPlayer(battle);

  if (!player.drawn_this_turn) {
    return {
      phase: 'Comprar carta',
      hint: 'Toque em Comprar para iniciar o turno. Depois escolha atacante e alvo.',
      nextAction: 'draw',
    };
  }

  if (battle.selectedCardId) {
    const card = player.hand.find(item => item.id === battle.selectedCardId && !item.used);
    if (card?.polaridade === 'DEBUFF' && !battle.selectedEnemyId) {
      return {
        phase: 'Escolher alvo da carta',
        hint: 'Essa carta é debuff. Toque em um inimigo para aplicar o efeito.',
        nextAction: 'select-enemy-card-target',
      };
    }

    if (card?.polaridade !== 'DEBUFF' && !battle.selectedOwnId) {
      return {
        phase: 'Escolher aliado da carta',
        hint: 'Essa carta é bônus. Toque em um lutador do seu time para aplicar o efeito.',
        nextAction: 'select-own-card-target',
      };
    }

    return {
      phase: 'Usar carta ou atacar',
      hint: 'Você pode usar a carta selecionada ou partir para o ataque.',
      nextAction: 'use-card',
    };
  }

  if (!battle.selectedOwnId) {
    return {
      phase: 'Escolher atacante',
      hint: 'Toque em um lutador do seu time para escolher quem vai atacar.',
      nextAction: 'select-attacker',
    };
  }

  if (!battle.selectedEnemyId) {
    return {
      phase: 'Escolher alvo',
      hint: 'Agora toque em um lutador inimigo para mirar o ataque.',
      nextAction: 'select-target',
    };
  }

  return {
    phase: 'Pronto para atacar',
    hint: 'Tudo pronto. Toque em ATACAR para rolar o d20.',
    nextAction: 'attack',
  };
}

// Mostra ao jogador se o atacante selecionado tem vantagem/desvantagem contra o alvo.
export function getMatchupHint(battle) {
  const own = currentPlayer(battle).fighters.find(f => f.id === battle.selectedOwnId && f.alive);
  const foe = enemyPlayer(battle).fighters.find(f => f.id === battle.selectedEnemyId && f.alive);
  if (!own || !foe) return null;
  return classMatchup(own, foe).label; // 'vantagem' | 'desvantagem' | null
}

export function canUseSelectedCard(battle) {
  const player = currentPlayer(battle);
  const card = player.hand.find(item => item.id === battle.selectedCardId && !item.used);
  if (!card) return false;

  if (card.polaridade === 'DEBUFF') return Boolean(battle.selectedEnemyId);
  return Boolean(battle.selectedOwnId);
}

export function canAttackSelectedTarget(battle) {
  const player = currentPlayer(battle);
  return Boolean(player.drawn_this_turn && battle.selectedOwnId && battle.selectedEnemyId);
}

export function drawCard(battle) {
  const player = currentPlayer(battle);
  if (player.drawn_this_turn) return { ok: false, message: 'Você já comprou neste turno.' };

  player.drawn_this_turn = true;
  battle.selectedCardId = null;

  if (!player.deck.length) {
    battle.log.push(`🃏 ${player.name} tentou comprar, mas o deck está vazio.`);
    return { ok: true };
  }

  const card = player.deck.shift();
  player.hand.push(card);
  battle.log.push(`🃏 ${player.name} comprou ${card.nome_efeito}.`);
  return { ok: true };
}

export function useSelectedCard(battle) {
  const player = currentPlayer(battle);
  const enemy = enemyPlayer(battle);
  const card = player.hand.find(item => item.id === battle.selectedCardId && !item.used);
  if (!card) return { ok: false, message: 'Escolha uma carta válida.' };

  const isDebuff = card.polaridade === 'DEBUFF';
  const targetPlayer = isDebuff ? enemy : player;
  const targetId = isDebuff ? battle.selectedEnemyId : battle.selectedOwnId;
  if (!targetId) return { ok: false, message: isDebuff ? 'Escolha um inimigo.' : 'Escolha um aliado.' };

  const target = targetPlayer.fighters.find(fighter => fighter.id === targetId && fighter.alive);
  if (!target) return { ok: false, message: 'Alvo inválido.' };

  const attr = card.atributo.toLowerCase();
  const signal = isDebuff ? -1 : 1;
  if (attr === 'hp') {
    target.max_hp = Math.max(1, (target.max_hp || target.hp || 1) + signal * card.intensidade);
    target.current_hp = Math.max(1, Math.min(target.max_hp, (target.current_hp || 1) + signal * card.intensidade));
    target.buffs.hp = (target.buffs.hp || 0) + signal * card.intensidade;
  } else {
    target.buffs[attr] = (target.buffs[attr] || 0) + signal * card.intensidade;
  }
  card.used = true;

  battle.log.push(`✨ ${player.name} usou ${card.nome_efeito}: ${signal > 0 ? '+' : '-'}${card.intensidade} ${card.atributo} em ${target.nome}.`);
  battle.selectedCardId = null;

  return { ok: true };
}

export function attackSelectedTarget(battle) {
  const player = currentPlayer(battle);
  const enemy = enemyPlayer(battle);

  if (!player.drawn_this_turn) return { ok: false, message: 'Compre uma carta antes de atacar.' };
  if (!battle.selectedOwnId) return { ok: false, message: 'Escolha seu atacante.' };
  if (!battle.selectedEnemyId) return { ok: false, message: 'Escolha o alvo inimigo.' };

  const attacker = player.fighters.find(fighter => fighter.id === battle.selectedOwnId && fighter.alive);
  const defender = enemy.fighters.find(fighter => fighter.id === battle.selectedEnemyId && fighter.alive);

  if (!attacker || !defender) return { ok: false, message: 'Atacante ou alvo inválido.' };

  const d20 = rand(1, 20);
  const atk = effectiveStat(attacker, 'atk');
  const def = effectiveStat(defender, 'def');
  const lck = effectiveStat(attacker, 'lck');
  const speedModifier = speedDamageModifier(attacker, defender);
  const matchup = classMatchup(attacker, defender);

  // Texto da matchup pro log.
  const advText = matchup.label === 'vantagem'
    ? ' 🔥 vantagem de classe!'
    : matchup.label === 'desvantagem'
      ? ' 🛡️ resistido (desvantagem)'
      : '';

  const speedText = speedModifier > 0
    ? ` velocidade +${speedModifier}`
    : speedModifier < 0
      ? ` alvo mais rapido ${speedModifier}`
      : '';

  let damage = Math.max(1, atk + d20 + speedModifier - def);

  if (d20 === 1) {
    // Falha crítica — usa o "vacilo" do fighter (ignora vantagem).
    damage = 1;
    const erro = attacker.erro || 'errou feio';
    battle.log.push(`🎲 d20=1. 💫 FALHA! ${attacker.nome} ${erro} e causou só ${damage}.`);
  } else {
    const isCrit = d20 >= critThreshold(lck);
    if (isCrit) damage *= 2;
    // Vantagem/desvantagem de classe ajusta o dano final.
    damage = Math.max(1, Math.round(damage * matchup.mult));
    const golpe = attacker.golpe || 'um golpe';
    const critText = isCrit ? '💥 CRÍTICO! ' : '';
    battle.log.push(`🎲 d20=${d20}. ${critText}${attacker.nome} usou ${golpe}${advText}${speedText} e causou ${damage} em ${defender.nome}.`);
  }

  defender.current_hp = Math.max(0, defender.current_hp - damage);

  if (defender.current_hp <= 0) {
    defender.alive = false;
    defender.active = false;
    battle.log.push(`💀 ${defender.nome} caiu.`);
    bringReserve(enemy, battle);
  }

  const winner = getWinner(battle);
  if (winner) return { ok: true, winner, damage, d20, speedModifier };

  passTurn(battle);
  return { ok: true, damage, d20, speedModifier };
}

function bringReserve(player, battle) {
  const reserve = player.fighters.find(fighter => fighter.reserve && fighter.alive && !fighter.active);
  if (!reserve) return;

  reserve.reserve = false;
  reserve.active = true;
  battle.log.push(`🛡️ ${player.name} colocou ${reserve.nome} em campo.`);
}

export function passTurn(battle) {
  const player = currentPlayer(battle);
  player.drawn_this_turn = false;
  player.hand = player.hand.filter(card => !card.used);

  battle.selectedOwnId = null;
  battle.selectedEnemyId = null;
  battle.selectedCardId = null;
  battle.turn = battle.turn === 0 ? 1 : 0;
  battle.log.push(`📱 Passe o celular para ${currentPlayer(battle).name}.`);
}

export function getWinner(battle) {
  const alive0 = battle.players[0].fighters.some(fighter => fighter.alive);
  const alive1 = battle.players[1].fighters.some(fighter => fighter.alive);

  if (alive0 && alive1) return null;
  if (alive0) return battle.players[0];
  if (alive1) return battle.players[1];
  return { name: 'Empate técnico' };
}
