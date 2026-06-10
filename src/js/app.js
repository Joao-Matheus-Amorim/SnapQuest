import { CLASSES, EFFECT_CATEGORIES } from './core/balance.js';
import { createFighter } from './core/fighters.js';
import { createEffectCard } from './core/cards.js';
import { mockPhoto, escapeHtml, clamp } from './core/utils.js';
import {
  createBattle,
  canStartBattle,
  currentPlayer,
  enemyPlayer,
  totalHp,
  drawCard,
  useSelectedCard,
  attackSelectedTarget,
  passTurn,
  getTurnGuidance,
  canUseSelectedCard,
  canAttackSelectedTarget,
  effectiveBattleStats,
} from './core/battle.js';
import { loadLocalState, saveLocalState, clearLocalState } from './services/localStore.js';
import { createSupabaseClient, signUp, signIn, signOut, getUser } from './services/supabaseClient.js';
import { upsertCloudInventory } from './services/inventoryRepository.js';
import { $, $$, toast, go } from './ui/dom.js';

const loaded = loadLocalState();
const state = {
  ...loaded,
  supabaseConfig: loaded.supabaseConfig || {},
  activeInventoryTab: 'fighters',
  selectedClassKey: null,
  selectedCategoryKey: null,
  tempFighterPhoto: null,
  tempCardPhoto: null,
  battle: null,
};

function persist() {
  state.playerName = $('#playerName').value.trim();
  state.player2Name = $('#player2Name').value.trim();
  state.supabaseConfig = {
    url: $('#supabaseUrl').value.trim(),
    anonKey: $('#supabaseAnonKey').value.trim(),
  };
  saveLocalState(state);
}

function renderHome() {
  const ready = canStartBattle(state.fighters, state.cards);
  $('#fightersCount').textContent = state.fighters.length;
  $('#cardsCount').textContent = state.cards.length;
  $('#fightersStat').classList.toggle('ok', state.fighters.length >= 6);
  $('#cardsStat').classList.toggle('ok', state.cards.length >= 6);
  $('#startBattleBtn').disabled = !ready;
  $('#startBattleBtn').textContent = ready ? '⚔️ Batalhar' : '⚔️ Precisa 6 + 6';
}

function renderChoices() {
  $('#fighterClasses').innerHTML = CLASSES.map(cls => `
    <button class="choice" data-class="${cls.key}" type="button">
      <strong>${cls.icon} ${cls.name}</strong>
      <small>HP ${cls.hp} · ATK ${cls.atk} · DEF ${cls.def} · LCK ${cls.lck} · SPD ${cls.spd}</small>
    </button>
  `).join('');

  $('#cardCategories').innerHTML = EFFECT_CATEGORIES.map(category => `
    <button class="choice" data-category="${category[0]}" type="button">
      <strong>${category[1]} ${category[2]}</strong>
      <small>Roleta gera bônus ou debuff em atributo.</small>
    </button>
  `).join('');

  $$('#fighterClasses .choice').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedClassKey = button.dataset.class;
      $$('#fighterClasses .choice').forEach(el => el.classList.toggle('active', el === button));
    });
  });

  $$('#cardCategories .choice').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedCategoryKey = button.dataset.category;
      $$('#cardCategories .choice').forEach(el => el.classList.toggle('active', el === button));
    });
  });
}

function imgHtml(item, fallback) {
  return item.foto ? `<img src="${item.foto}" alt="">` : `<span>${fallback}</span>`;
}

function renderInventory() {
  $('#tabFighters').classList.toggle('active', state.activeInventoryTab === 'fighters');
  $('#tabCards').classList.toggle('active', state.activeInventoryTab === 'cards');
  const root = $('#inventoryList');

  if (state.activeInventoryTab === 'fighters') {
    root.innerHTML = state.fighters.length ? state.fighters.map(fighter => `
      <article class="card">
        <div class="card-img" style="background:${fighter.foto ? 'rgba(0,0,0,.2)' : fighter.foto_fake}">${imgHtml(fighter, fighter.icon || '⚔️')}</div>
        <div class="card-body">
          <h4>${escapeHtml(fighter.nome)}</h4>
          <div class="badge-row"><span class="badge">${fighter.icon} ${fighter.classe}</span><span class="badge">+${fighter.bonus_intensidade} ${String(fighter.bonus_atributo).toUpperCase()}</span></div>
          <div class="stat-line"><span class="stat-pill">❤️ ${fighter.hp}</span><span class="stat-pill">⚔️ ${fighter.atk}</span><span class="stat-pill">🛡️ ${fighter.def}</span><span class="stat-pill">🍀 ${fighter.lck}</span><span class="stat-pill">⚡ ${fighter.spd}</span></div>
        </div>
      </article>
    `).join('') : '<div class="empty-state">Nenhum lutador ainda.</div>';
    return;
  }

  root.innerHTML = state.cards.length ? state.cards.map(card => `
    <article class="card">
      <div class="card-img" style="background:${card.foto ? 'rgba(0,0,0,.2)' : card.foto_fake}">${imgHtml(card, card.icon || '✨')}</div>
      <div class="card-body">
        <h4>${escapeHtml(card.nome_efeito)}</h4>
        <div class="badge-row"><span class="badge">${card.icon} ${card.categoria}</span><span class="badge">${card.raridade}</span><span class="badge">${card.polaridade === 'DEBUFF' ? '-' : '+'}${card.intensidade} ${card.atributo}</span></div>
      </div>
    </article>
  `).join('') : '<div class="empty-state">Nenhuma carta ainda.</div>';
}

function saveFighter() {
  try {
    state.fighters.unshift(createFighter({ classKey: state.selectedClassKey, name: $('#fighterName').value, photo: state.tempFighterPhoto }));
    state.selectedClassKey = null;
    state.tempFighterPhoto = null;
    $('#fighterName').value = '';
    $('#fighterCapture').innerHTML = '<div class="empty">📷<br>Foto simulada no MVP web</div>';
    persist();
    renderHome();
    state.activeInventoryTab = 'fighters';
    go('inventory');
    renderInventory();
    toast('Lutador criado.');
  } catch (error) {
    toast(error.message);
  }
}

function saveCard() {
  try {
    state.cards.unshift(createEffectCard({ categoryKey: state.selectedCategoryKey, name: $('#effectName').value, photo: state.tempCardPhoto }));
    state.selectedCategoryKey = null;
    state.tempCardPhoto = null;
    $('#effectName').value = '';
    $('#cardCapture').innerHTML = '<div class="empty">📷<br>Foto simulada no MVP web</div>';
    persist();
    renderHome();
    state.activeInventoryTab = 'cards';
    go('inventory');
    renderInventory();
    toast('Carta criada.');
  } catch (error) {
    toast(error.message);
  }
}

function renderBattle() {
  const battle = state.battle;
  if (!battle) return;

  const player = currentPlayer(battle);
  const enemy = enemyPlayer(battle);
  const guidance = getTurnGuidance(battle);

  $('#p1Name').textContent = battle.players[0].name;
  $('#p2Name').textContent = battle.players[1].name;
  $('#p1HpText').textContent = totalHp(battle.players[0]);
  $('#p2HpText').textContent = totalHp(battle.players[1]);
  $('#p1Box').classList.toggle('active', battle.turn === 0);
  $('#p2Box').classList.toggle('active', battle.turn === 1);
  $('#turnTitle').textContent = `${guidance.phase}: ${player.name}`;
  $('#turnHint').textContent = guidance.hint;

  $('#ownArena').innerHTML = player.fighters.filter(f => f.active).map(fighterSlotHtml).join('');
  $('#enemyArena').innerHTML = enemy.fighters.filter(f => f.active).map(fighterSlotHtml).join('');

  $$('#ownArena .fighter-slot').forEach(el => el.addEventListener('click', () => { battle.selectedOwnId = el.dataset.id; renderBattle(); }));
  $$('#enemyArena .fighter-slot').forEach(el => el.addEventListener('click', () => { battle.selectedEnemyId = el.dataset.id; renderBattle(); }));

  $('#hand').innerHTML = player.hand.length ? player.hand.map(card => `
    <button class="hand-card ${battle.selectedCardId === card.id ? 'selected' : ''}" data-id="${card.id}" type="button">
      <strong>${escapeHtml(card.nome_efeito)}</strong>
      <p>${card.polaridade === 'DEBUFF' ? '-' : '+'}${card.intensidade} ${card.atributo}</p>
      <p>${card.raridade}</p>
    </button>
  `).join('') : '<div class="empty-state">Compre uma carta.</div>';

  $$('#hand .hand-card').forEach(el => el.addEventListener('click', () => { battle.selectedCardId = el.dataset.id; renderBattle(); }));

  $('#drawBtn').disabled = player.drawn_this_turn;
  $('#useCardBtn').disabled = !canUseSelectedCard(battle);
  $('#attackBtn').disabled = !canAttackSelectedTarget(battle);
  $('#passTurnBtn').disabled = !player.drawn_this_turn;
  $('#battleLog').innerHTML = battle.log.slice(-12).reverse().map(line => `<p>${escapeHtml(line)}</p>`).join('');
}

function fighterSlotHtml(fighter) {
  const selected = state.battle?.selectedOwnId === fighter.id;
  const target = state.battle?.selectedEnemyId === fighter.id;
  const hpPct = clamp((fighter.current_hp / fighter.max_hp) * 100, 0, 100);
  const stats = effectiveBattleStats(fighter);
  return `
    <button class="fighter-slot ${selected ? 'selected' : ''} ${target ? 'target' : ''} ${fighter.alive ? '' : 'dead'}" data-id="${fighter.id}" type="button">
      <div class="fighter-img" style="background:${fighter.foto ? 'rgba(0,0,0,.2)' : fighter.foto_fake}">${imgHtml(fighter, fighter.icon || '⚔️')}</div>
      <h4>${escapeHtml(fighter.nome)}</h4>
      <p>${fighter.icon} ${fighter.classe}</p>
      <div class="stat-line"><span class="stat-pill">❤️ ${fighter.current_hp}/${fighter.max_hp}</span><span class="stat-pill">⚔️ ${stats.atk}</span><span class="stat-pill">🛡️ ${stats.def}</span><span class="stat-pill">LCK ${stats.lck}</span><span class="stat-pill">SPD ${stats.spd}</span></div>
      <div class="hpbar" style="height:8px;margin-top:8px;background:rgba(0,0,0,.25);border-radius:999px;overflow:hidden"><i style="display:block;height:100%;width:${hpPct}%;background:linear-gradient(90deg,#79f2c0,#ffd166)"></i></div>
    </button>
  `;
}

function startBattle() {
  try {
    persist();
    state.battle = createBattle({ fighters: state.fighters, cards: state.cards, playerName: state.playerName, player2Name: state.player2Name });
    go('battle');
    renderBattle();
  } catch (error) {
    toast(error.message);
  }
}

function showResult(winner) {
  $('#resultTitle').textContent = winner.name === 'Empate técnico' ? 'Empate!' : 'Vitória!';
  $('#resultText').textContent = `${winner.name} venceu a partida.`;
  $('#resultIcon').textContent = winner.name === 'Empate técnico' ? '🤝' : '🏆';
  $('#resultModal').classList.add('show');
}

async function configureSupabaseFromInputs() {
  persist();
  await createSupabaseClient(state.supabaseConfig);
}

async function handleSignUp() {
  try {
    await configureSupabaseFromInputs();
    await signUp({ email: $('#authEmail').value.trim(), password: $('#authPassword').value });
    $('#cloudStatus').textContent = 'Conta criada. Confirme o e-mail se o Supabase exigir.';
    toast('Conta criada.');
  } catch (error) {
    toast(error.message);
  }
}

async function handleSignIn() {
  try {
    await configureSupabaseFromInputs();
    await signIn({ email: $('#authEmail').value.trim(), password: $('#authPassword').value });
    const user = await getUser();
    $('#cloudStatus').textContent = user ? `Conectado: ${user.email}` : 'Conectado.';
    toast('Login feito.');
  } catch (error) {
    toast(error.message);
  }
}

async function handleSync() {
  try {
    await configureSupabaseFromInputs();
    const synced = await upsertCloudInventory({ fighters: state.fighters, cards: state.cards });
    state.fighters = synced.fighters;
    state.cards = synced.cards;
    persist();
    renderHome();
    renderInventory();
    $('#cloudStatus').textContent = 'Inventário sincronizado.';
    toast('Sincronizado.');
  } catch (error) {
    toast(error.message);
  }
}

async function handleSignOut() {
  try {
    await signOut();
    $('#cloudStatus').textContent = 'Nuvem desconectada.';
    toast('Saiu da conta.');
  } catch (error) {
    toast(error.message);
  }
}

function bind() {
  $('#playerName').value = state.playerName || '';
  $('#player2Name').value = state.player2Name || '';
  $('#supabaseUrl').value = state.supabaseConfig?.url || '';
  $('#supabaseAnonKey').value = state.supabaseConfig?.anonKey || '';

  $$('[data-go]').forEach(button => button.addEventListener('click', () => { persist(); go(button.dataset.go); if (button.dataset.go === 'inventory') renderInventory(); }));
  $('#resetBtn').addEventListener('click', () => { if (!confirm('Resetar inventário local?')) return; clearLocalState(); location.reload(); });
  $('#mockFighterPhotoBtn').addEventListener('click', () => { state.tempFighterPhoto = mockPhoto('Lutador'); $('#fighterCapture').innerHTML = `<img src="${state.tempFighterPhoto}" alt="Foto simulada">`; });
  $('#mockCardPhotoBtn').addEventListener('click', () => { state.tempCardPhoto = mockPhoto('Carta'); $('#cardCapture').innerHTML = `<img src="${state.tempCardPhoto}" alt="Foto simulada">`; });
  $('#saveFighterBtn').addEventListener('click', saveFighter);
  $('#saveCardBtn').addEventListener('click', saveCard);
  $('#tabFighters').addEventListener('click', () => { state.activeInventoryTab = 'fighters'; renderInventory(); });
  $('#tabCards').addEventListener('click', () => { state.activeInventoryTab = 'cards'; renderInventory(); });
  $('#startBattleBtn').addEventListener('click', startBattle);
  $('#drawBtn').addEventListener('click', () => { const result = drawCard(state.battle); if (!result.ok) toast(result.message); renderBattle(); });
  $('#useCardBtn').addEventListener('click', () => { const result = useSelectedCard(state.battle); if (!result.ok) toast(result.message); renderBattle(); });
  $('#attackBtn').addEventListener('click', () => {
    const result = attackSelectedTarget(state.battle);
    if (!result.ok) { toast(result.message); return; }
    if (result.winner) { renderBattle(); showResult(result.winner); return; }
    renderBattle();
  });
  $('#passTurnBtn').addEventListener('click', () => { passTurn(state.battle); renderBattle(); });
  $('#againBtn').addEventListener('click', () => { $('#resultModal').classList.remove('show'); startBattle(); });
  $('#backHomeBtn').addEventListener('click', () => { $('#resultModal').classList.remove('show'); state.battle = null; go('home'); renderHome(); });
  $('#signUpBtn').addEventListener('click', handleSignUp);
  $('#signInBtn').addEventListener('click', handleSignIn);
  $('#syncBtn').addEventListener('click', handleSync);
  $('#signOutBtn').addEventListener('click', handleSignOut);
}

function init() {
  bind();
  renderChoices();
  renderHome();
}

init();
