import { clone, rand } from './utils.js';

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
      buffs: { atk: 0, def: 0, lck: 0, spd: 0 },
    }));

    return {
      name: index === 0 ? (playerName || 'Jogador 1') : (player2Name || 'Jogador 2'),
      fighters: team,
      deck: shuffledCards.slice(index * 3, index * 3 + 3).map(card => ({ ...card, used: false })),
      hand: [],
      drawn_this_turn: false,
    };
  });

  return {
    players,
    turn: 0,
    selectedOwnId: null,
    selectedEnemyId: null,
    selectedCardId: null,
    log: [`📱 ${players[0].name} começa.`],
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

export function drawCard(battle) {
  const player = currentPlayer(battle);
  if (player.drawn_this_turn) return { ok: false, message: 'Você já comprou neste turno.' };

  player.drawn_this_turn = true;

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
  target.buffs[attr] = (target.buffs[attr] || 0) + signal * card.intensidade;
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
  const atk = attacker.atk + (attacker.buffs.atk || 0);
  const def = defender.def + (defender.buffs.def || 0);

  let damage = Math.max(1, atk + d20 - def);
  let label = '';

  if (d20 === 20) {
    damage *= 2;
    label = ' CRÍTICO!';
  } else if (d20 === 1) {
    damage = 1;
    label = ' FALHA!';
  }

  defender.current_hp = Math.max(0, defender.current_hp - damage);
  battle.log.push(`🎲 d20=${d20}.${label} ${attacker.nome} causou ${damage} em ${defender.nome}.`);

  if (defender.current_hp <= 0) {
    defender.alive = false;
    defender.active = false;
    battle.log.push(`💀 ${defender.nome} caiu.`);
    bringReserve(enemy, battle);
  }

  const winner = getWinner(battle);
  if (winner) return { ok: true, winner, damage, d20 };

  passTurn(battle);
  return { ok: true, damage, d20 };
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
