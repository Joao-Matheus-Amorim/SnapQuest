import { getSupabaseClient, getUser } from './supabaseClient.js';

export async function loadCloudInventory() {
  const client = getSupabaseClient();
  const user = await getUser();
  if (!client || !user) throw new Error('Entre na conta antes de sincronizar.');

  const [fightersResult, cardsResult] = await Promise.all([
    client.from('snapquest_fighters').select('*').order('created_at', { ascending: false }),
    client.from('snapquest_effect_cards').select('*').order('created_at', { ascending: false }),
  ]);

  if (fightersResult.error) throw fightersResult.error;
  if (cardsResult.error) throw cardsResult.error;

  return {
    fighters: fightersResult.data.map(fromDbFighter),
    cards: cardsResult.data.map(fromDbCard),
  };
}

export async function upsertCloudInventory({ fighters, cards }) {
  const client = getSupabaseClient();
  const user = await getUser();
  if (!client || !user) throw new Error('Entre na conta antes de sincronizar.');

  const fighterRows = fighters.map(fighter => toDbFighter(fighter, user.id));
  const cardRows = cards.map(card => toDbCard(card, user.id));

  if (fighterRows.length) {
    const { error } = await client.from('snapquest_fighters').upsert(fighterRows, { onConflict: 'id' });
    if (error) throw error;
  }

  if (cardRows.length) {
    const { error } = await client.from('snapquest_effect_cards').upsert(cardRows, { onConflict: 'id' });
    if (error) throw error;
  }

  return loadCloudInventory();
}

function toDbFighter(fighter, userId) {
  return {
    id: fighter.id,
    user_id: userId,
    name: fighter.nome,
    photo_data_url: fighter.foto,
    photo_fake: fighter.foto_fake,
    class_key: fighter.class_key,
    class_name: fighter.classe,
    icon: fighter.icon,
    hp: fighter.hp,
    atk: fighter.atk,
    def: fighter.def,
    lck: fighter.lck,
    spd: fighter.spd,
    bonus_attribute: fighter.bonus_atributo,
    bonus_intensity: fighter.bonus_intensidade,
    created_at: fighter.criado_em,
  };
}

function fromDbFighter(row) {
  return {
    id: row.id,
    type: 'fighter',
    nome: row.name,
    foto: row.photo_data_url,
    foto_fake: row.photo_fake,
    class_key: row.class_key,
    classe: row.class_name,
    icon: row.icon,
    hp: row.hp,
    atk: row.atk,
    def: row.def,
    lck: row.lck,
    spd: row.spd,
    bonus_atributo: row.bonus_attribute,
    bonus_intensidade: row.bonus_intensity,
    criado_em: row.created_at,
  };
}

function toDbCard(card, userId) {
  return {
    id: card.id,
    user_id: userId,
    name: card.nome_efeito,
    photo_data_url: card.foto,
    photo_fake: card.foto_fake,
    category_key: card.categoria_key,
    category_name: card.categoria,
    icon: card.icon,
    polarity: card.polaridade,
    attribute: card.atributo,
    intensity: card.intensidade,
    rarity: card.raridade,
    created_at: card.criado_em,
  };
}

function fromDbCard(row) {
  return {
    id: row.id,
    type: 'effect_card',
    nome_efeito: row.name,
    foto: row.photo_data_url,
    foto_fake: row.photo_fake,
    categoria_key: row.category_key,
    categoria: row.category_name,
    icon: row.icon,
    polaridade: row.polarity,
    atributo: row.attribute,
    intensidade: row.intensity,
    raridade: row.rarity,
    criado_em: row.created_at,
  };
}
