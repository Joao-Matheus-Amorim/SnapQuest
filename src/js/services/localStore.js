import { seedFighters } from '../core/fighters.js';
import { seedCards } from '../core/cards.js';
import { getPublicConfig } from './publicConfig.js';

const STORAGE_KEY = 'snapquest-v1';

function resolveSupabaseConfig(savedConfig = {}) {
  const publicConfig = getPublicConfig();

  return {
    url: publicConfig.supabaseUrl || savedConfig.url || '',
    anonKey: publicConfig.supabaseAnonKey || savedConfig.anonKey || '',
  };
}

export function loadLocalState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      playerName: data.playerName || '',
      player2Name: data.player2Name || '',
      fighters: data.fighters || seedFighters(),
      cards: data.cards || seedCards(),
      supabaseConfig: resolveSupabaseConfig(data.supabaseConfig),
    };
  } catch {
    return {
      playerName: '',
      player2Name: '',
      fighters: seedFighters(),
      cards: seedCards(),
      supabaseConfig: resolveSupabaseConfig(),
    };
  }
}

export function saveLocalState(state) {
  const resolvedConfig = resolveSupabaseConfig(state.supabaseConfig || {});
  const payload = {
    playerName: state.playerName,
    player2Name: state.player2Name,
    fighters: state.fighters,
    cards: state.cards,
    supabaseConfig: resolvedConfig,
  };

  state.supabaseConfig = resolvedConfig;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearLocalState() {
  localStorage.removeItem(STORAGE_KEY);
}
