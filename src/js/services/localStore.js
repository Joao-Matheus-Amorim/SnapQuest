import { seedFighters } from '../core/fighters.js';
import { seedCards } from '../core/cards.js';

const STORAGE_KEY = 'snapquest-v1';

export function loadLocalState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      playerName: data.playerName || '',
      player2Name: data.player2Name || '',
      fighters: data.fighters || seedFighters(),
      cards: data.cards || seedCards(),
      supabaseConfig: data.supabaseConfig || {},
    };
  } catch {
    return {
      playerName: '',
      player2Name: '',
      fighters: seedFighters(),
      cards: seedCards(),
      supabaseConfig: {},
    };
  }
}

export function saveLocalState(state) {
  const payload = {
    playerName: state.playerName,
    player2Name: state.player2Name,
    fighters: state.fighters,
    cards: state.cards,
    supabaseConfig: state.supabaseConfig || {},
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearLocalState() {
  localStorage.removeItem(STORAGE_KEY);
}
