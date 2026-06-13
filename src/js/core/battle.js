import { clamp, clone, rand } from './utils.js';

const CLASS_ADVANTAGE = {
  guerreiro: 'arqueiro',
  arqueiro: 'mago',
  mago: 'paladino',
  paladino: 'guerreiro',
};

const BATTLE_STATS = ['atk', 'def', 'lck', 'spd', 'hp'];
const ENERGY_MAX = 5;
const START_ENERGY = 1;
const SHIELD_BLOCK_CHANCE = 30; // % de chance do escudo bloquear cada golpe (puro dado)
const CLASS_LUCK_CHANCE = 30; // % de chance do proc de classe do atacante (critico/certeiro/arcano)

export const ABILITIES = {
  TAUNT: 'provocar',
  SHIELD: 'escudo',
  POISON: 'veneno',
};

function classMatchup(attacker, defender) {
  if (CLASS_ADVANTAGE[attacker.class_key] === defender.class_key) return { mult: 1.25, label: 'vantagem' };
  if (CLASS_ADVANTAGE[defender.class_key] === attacker.class_key) return { mult: 0.85, label: 'desvantagem' };
  return { mult: 1, label: null };
}

function abilityForFighter(fighter) {
  if (fighter.ability) return fighter.ability;
  if (fighter.habilidade) return fighter.habilidade;
  if (fighter.class_key === 'paladino') return ABILITIES.SHIELD;
  // provocar/taunt foi removido (agro confuso). guerreiro nao tem passiva de
  // habilidade — a forca dele esta no critico (sorte de classe).
  if (fighter.class_key === 'guerreiro') return ABILITIES.TAUNT;
  return ABILITIES.POISON;
}

export function cardEnergyCost(card) {
  const rarity = String(card?.raridade || '').toLowerCase();
  if (rarity.includes('lend') || rarity.includes('epic') || rarity.includes('pic')) return 4;
  if (rarity.includes('raro') || rarity.includes('rare')) return 3;
  if (rarity.includes('incomum') || rarity.includes('uncommon')) return 2;
  return Math.min(2, Math.max(1, Number(card?.intensidade || 1)));
}

export function canAffordCard(player, card) {
  return Number(player?.energy || 0) >= cardEnergyCost(card);
}

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

export function canStartBattle(fighters, cards) {
  return fighters.length >= 6 && cards.length >= 6;
}

function battleLog(battle, text) {
  const entry = { id: `${Date.now()}-${battle.history.length}`, text, createdAt: Date.now() };
  battle.history.push(entry);
  battle.log.push(text);
}

function normalizeCard(card) {
  return { ...card, used: false, cost: cardEnergyCost(card) };
}

function normalizeFighter(fighter, fighterIndex) {
  const ability = abilityForFighter(fighter);
  return {
    ...fighter,
    ability,
    max_hp: fighter.hp,
    current_hp: fighter.hp,
    alive: true,
    eliminated: false,
    active: fighterIndex < 2,
    reserve: fighterIndex === 2,
    buffs: { atk: 0, def: 0, lck: 0, spd: 0, hp: 0 },
    shield_active: ability === ABILITIES.SHIELD,
    poison: null,
    attacked: false,
  };
}

function applyPoisonStart(battle, player) {
  for (const fighter of player.fighters) {
    if (!fighter.alive || !fighter.poison?.turns) continue;
    fighter.current_hp = Math.max(0, fighter.current_hp - fighter.poison.damage);
    fighter.poison.turns -= 1;
    battleLog(battle, `${fighter.nome} sofreu ${fighter.poison.damage} de veneno`);
    if (fighter.current_hp <= 0) {
      fighter.alive = false;
      fighter.eliminated = true;
      battle.stats.cardsEliminated += 1;
      battleLog(battle, `${fighter.nome} caiu pelo veneno`);
    }
    if (fighter.poison.turns <= 0) fighter.poison = null;
  }
}

function startTurn(battle, playerIndex) {
  const player = battle.players[playerIndex];
  player.energy = Math.min(player.max_energy, (player.energy || 0) + 1);
  player.drawn_this_turn = false;
  player.attacked_this_turn = false;
  for (const fighter of player.fighters) fighter.attacked = false;
  applyPoisonStart(battle, player);
  battleLog(battle, `${player.name} iniciou o turno com energia ${player.energy}/${player.max_energy}`);
  drawCard(battle);
}

export function createBattle({ fighters, cards, playerName, player2Name }) {
  if (!canStartBattle(fighters, cards)) {
    throw new Error('Precisa de 6 lutadores e 6 cartas para simular dois jogadores.');
  }

  const shuffledFighters = [...fighters].sort(() => Math.random() - 0.5).slice(0, 6).map(clone);
  const shuffledCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 6).map(clone);

  const players = [0, 1].map(index => ({
    name: index === 0 ? (playerName || 'Jogador 1') : (player2Name || 'Jogador 2'),
    fighters: shuffledFighters.slice(index * 3, index * 3 + 3).map(normalizeFighter),
    deck: shuffledCards.slice(index * 3, index * 3 + 3).map(normalizeCard),
    hand: [],
    drawn_this_turn: false,
    attacked_this_turn: false,
    energy: START_ENERGY,
    max_energy: ENERGY_MAX,
  }));

  const battle = {
    players,
    turn: 0,
    selectedOwnId: null,
    selectedEnemyId: null,
    selectedCardId: null,
    log: [],
    history: [],
    startedAt: Date.now(),
    stats: { damageByPlayer: [0, 0], cardsEliminated: 0 },
  };

  startTurn(battle, 0);
  battleLog(battle, `${players[0].name} começa o duelo`);
  return battle;
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
  const playable = player.hand.filter(card => !card.used && canAffordCard(player, card));
  if (!player.drawn_this_turn) return { phase: 'Comprar carta', hint: 'A compra acontece automaticamente no inicio do turno.', nextAction: 'draw' };
  if (playable.length) return { phase: 'Jogar ou atacar', hint: 'Arraste uma carta no alvo, ou toque no seu fighter e depois no inimigo para atacar.', nextAction: 'act' };
  return { phase: 'Encerrar turno', hint: 'Sem energia para cartas. Ataque ou encerre o turno.', nextAction: 'end-turn' };
}

export function getMatchupHint(battle) {
  const own = currentPlayer(battle).fighters.find(f => f.id === battle.selectedOwnId && f.alive);
  const foe = enemyPlayer(battle).fighters.find(f => f.id === battle.selectedEnemyId && f.alive);
  if (!own || !foe) return null;
  return classMatchup(own, foe).label;
}

export function canUseSelectedCard(battle) {
  const player = currentPlayer(battle);
  const card = player.hand.find(item => item.id === battle.selectedCardId && !item.used);
  if (!card || !canAffordCard(player, card)) return false;
  if (card.polaridade === 'DEBUFF') return Boolean(battle.selectedEnemyId);
  return Boolean(battle.selectedOwnId);
}

export function canAttackSelectedTarget(battle) {
  return Boolean(battle.selectedOwnId && battle.selectedEnemyId);
}

export function drawCard(battle) {
  const player = currentPlayer(battle);
  if (player.drawn_this_turn) return { ok: false, message: 'Voce ja comprou neste turno.' };
  player.drawn_this_turn = true;
  battle.selectedCardId = null;

  if (!player.deck.length) {
    battleLog(battle, `${player.name} tentou comprar, mas o deck esta vazio`);
    return { ok: true };
  }

  const card = player.deck.shift();
  player.hand.push(card);
  battleLog(battle, `${player.name} comprou ${card.nome_efeito}`);
  return { ok: true, cardId: card.id };
}

export function useSelectedCard(battle) {
  const player = currentPlayer(battle);
  const enemy = enemyPlayer(battle);
  const card = player.hand.find(item => item.id === battle.selectedCardId && !item.used);
  if (!card) return { ok: false, message: 'Escolha uma carta valida.' };
  if (!canAffordCard(player, card)) return { ok: false, message: 'Energia insuficiente.' };

  const isDebuff = card.polaridade === 'DEBUFF';
  const targetPlayer = isDebuff ? enemy : player;
  const targetId = isDebuff ? battle.selectedEnemyId : battle.selectedOwnId;
  if (!targetId) return { ok: false, message: isDebuff ? 'Escolha um inimigo.' : 'Escolha um aliado.' };

  const target = targetPlayer.fighters.find(fighter => fighter.id === targetId && fighter.alive);
  if (!target) return { ok: false, message: 'Alvo invalido.' };

  const attr = String(card.atributo).toLowerCase();
  const signal = isDebuff ? -1 : 1;
  if (attr === 'hp') {
    target.max_hp = Math.max(1, (target.max_hp || target.hp || 1) + signal * card.intensidade);
    target.current_hp = Math.max(1, Math.min(target.max_hp, (target.current_hp || 1) + signal * card.intensidade));
    target.buffs.hp = (target.buffs.hp || 0) + signal * card.intensidade;
  } else {
    target.buffs[attr] = (target.buffs[attr] || 0) + signal * card.intensidade;
  }
  card.used = true;
  player.energy = Math.max(0, player.energy - cardEnergyCost(card));

  battleLog(battle, `${player.name} jogou ${card.nome_efeito}`);
  battleLog(battle, `${target.nome} recebeu ${signal > 0 ? '+' : ''}${signal * card.intensidade} ${card.atributo}`);
  battle.selectedCardId = null;

  return {
    ok: true,
    effectName: card.nome_efeito,
    targetId: target.id,
    targetName: target.nome,
    attr: card.atributo,
    value: signal * card.intensidade,
    isDebuff,
    energyCost: cardEnergyCost(card),
  };
}

export function previewAttack(battle, attackerId = battle.selectedOwnId, defenderId = battle.selectedEnemyId) {
  const attacker = currentPlayer(battle).fighters.find(fighter => fighter.id === attackerId && fighter.alive);
  const defender = enemyPlayer(battle).fighters.find(fighter => fighter.id === defenderId && fighter.alive);
  if (!attacker || !defender) return null;
  const matchup = classMatchup(attacker, defender);
  const base = Math.max(1, effectiveStat(attacker, 'atk') - Math.floor(effectiveStat(defender, 'def') / 2));
  return {
    attackerName: attacker.nome,
    defenderName: defender.nome,
    min: Math.max(1, Math.round(base * matchup.mult)),
    max: Math.max(2, Math.round((base + 4) * matchup.mult)),
  };
}

export function attackSelectedTarget(battle) {
  const player = currentPlayer(battle);
  const enemy = enemyPlayer(battle);

  if (!battle.selectedOwnId) return { ok: false, message: 'Escolha seu atacante.' };
  if (!battle.selectedEnemyId) return { ok: false, message: 'Escolha o alvo inimigo.' };

  const attacker = player.fighters.find(fighter => fighter.id === battle.selectedOwnId && fighter.alive);
  const defender = enemy.fighters.find(fighter => fighter.id === battle.selectedEnemyId && fighter.alive);
  if (!attacker || !defender) return { ok: false, message: 'Atacante ou alvo invalido.' };

  if (player.attacked_this_turn) {
    return { ok: false, message: 'Voce ja atacou neste turno. Encerre o turno.' };
  }

  // O ataque resolve a partir daqui: consome a unica acao de ataque do turno e
  // limpa a selecao (atacante e alvo) para nao deixar o fighter brilhando depois.
  player.attacked_this_turn = true;
  attacker.attacked = true;
  battle.selectedOwnId = null;
  battle.selectedEnemyId = null;

  const preview = previewAttack(battle, attacker.id, defender.id);
  const missRoll = rand(1, 20);
  if (missRoll === 1) {
    const missName = attacker.erro || 'Vacilo';
    battleLog(battle, `${attacker.nome} vacilou: ${missName}`);
    return {
      ok: true,
      damage: 0,
      miss: true,
      targetId: defender.id,
      attackerId: attacker.id,
      targetName: defender.nome,
      moveName: attacker.golpe || 'Ataque',
      missName,
      needsPass: true,
    };
  }
  // Sorte de classe do ATACANTE (CLASS_LUCK_CHANCE%): efeito proprio por classe.
  // guerreiro = critico (x2); arqueiro = certeiro (ignora a DEF do alvo);
  // mago = arcano (x1.6 e atravessa o escudo). So um aplica (o fighter e de uma classe).
  const classLucky = rand(1, 100) <= CLASS_LUCK_CHANCE;
  const crit = classLucky && attacker.class_key === 'guerreiro';
  const pierce = classLucky && attacker.class_key === 'arqueiro';
  const arcane = classLucky && attacker.class_key === 'mago';

  let damage;
  if (pierce) {
    // Certeiro: recalcula a faixa ignorando a DEF do alvo (dano cheio).
    const matchup = classMatchup(attacker, defender);
    const base = Math.max(1, effectiveStat(attacker, 'atk'));
    damage = rand(Math.max(1, Math.round(base * matchup.mult)), Math.max(2, Math.round((base + 4) * matchup.mult)));
  } else {
    damage = rand(preview.min, preview.max);
  }
  if (crit) damage = Math.round(damage * 2);
  if (arcane) damage = Math.round(damage * 1.6);

  // Escudo bloqueia 30% (puro dado, sem consumir). O ARCANO do mago atravessa.
  const blocked = !arcane && Boolean(defender.shield_active) && rand(1, 100) <= SHIELD_BLOCK_CHANCE;
  const procName = blocked ? null : crit ? 'Critico' : pierce ? 'Certeiro' : arcane ? 'Arcano' : null;
  if (blocked) {
    damage = 0;
    battleLog(battle, `${defender.nome} bloqueou com Escudo`);
  } else {
    defender.current_hp = Math.max(0, defender.current_hp - damage);
    battle.stats.damageByPlayer[battle.turn] += damage;
    battleLog(battle, `${attacker.nome} causou ${damage} de dano em ${defender.nome}${procName ? ` (${procName})` : ''}`);
  }

  if (!blocked && damage > 0 && attacker.ability === ABILITIES.POISON) {
    defender.poison = { turns: 3, damage: 1, sourceId: attacker.id };
    battleLog(battle, `${defender.nome} foi envenenado`);
  }

  if (defender.current_hp <= 0 && defender.alive) {
    defender.alive = false;
    defender.eliminated = true;
    battle.stats.cardsEliminated += 1;
    battleLog(battle, `${defender.nome} caiu`);
  }

  const winner = getWinner(battle);
  return {
    ok: true,
    winner,
    damage,
    blocked,
    targetId: defender.id,
    attackerId: attacker.id,
    targetName: defender.nome,
    moveName: attacker.golpe || 'Ataque',
    missName: attacker.erro || 'Vacilo',
    critical: Boolean(procName),
    procName: procName || undefined,
    needsPass: !winner,
  };
}

export function passTurn(battle) {
  const player = currentPlayer(battle);
  player.hand = player.hand.filter(card => !card.used);
  for (const item of battle.players) {
    item.fighters = item.fighters.filter(fighter => fighter.alive);
  }

  battle.selectedOwnId = null;
  battle.selectedEnemyId = null;
  battle.selectedCardId = null;
  battle.turn = battle.turn === 0 ? 1 : 0;
  startTurn(battle, battle.turn);
}

export function getWinner(battle) {
  const alive0 = battle.players[0].fighters.some(fighter => fighter.alive);
  const alive1 = battle.players[1].fighters.some(fighter => fighter.alive);
  if (alive0 && alive1) return null;
  if (alive0) return battle.players[0];
  if (alive1) return battle.players[1];
  return { name: 'Empate tecnico' };
}
