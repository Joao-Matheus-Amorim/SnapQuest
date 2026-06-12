import { getSupabaseClient, getUser } from './supabaseClient.js';
import { resolvePhotoUrls, uploadPhotoToCloud } from './photoCloudStorage.js';

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

  const photoUrls = await resolvePhotoUrls(client, [
    ...fightersResult.data.map((row) => row.photo_storage_path),
    ...cardsResult.data.map((row) => row.photo_storage_path),
  ]);

  return {
    fighters: fightersResult.data.map((row) => fromDbFighter(row, photoUrls)),
    cards: cardsResult.data.map((row) => fromDbCard(row, photoUrls)),
  };
}

export async function upsertCloudInventory({ fighters, cards }) {
  const client = getSupabaseClient();
  const user = await getUser();
  if (!client || !user) throw new Error('Entre na conta antes de sincronizar.');

  const fighterRows = await Promise.all(fighters.map(fighter => toDbFighter(client, fighter, user.id)));
  const cardRows = await Promise.all(cards.map(card => toDbCard(client, card, user.id)));

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

async function toDbFighter(client, fighter, userId) {
  const uploadedPhoto = await uploadPhotoToCloud(client, {
    uri: fighter.foto,
    itemId: fighter.id,
    entity: 'fighters',
    userId,
    isCatalog: Boolean(fighter.is_catalog),
    existingPath: fighter.foto_storage_path || null,
  });

  return {
    id: fighter.id,
    user_id: userId,
    name: fighter.nome,
    photo_data_url: null,
    photo_storage_path: uploadedPhoto.path,
    photo_fake: fighter.foto_fake,
    class_key: fighter.class_key,
    class_name: fighter.classe,
    icon: fighter.icon,
    description: fighter.descricao || null,
    signature_move: fighter.golpe || null,
    signature_miss: fighter.erro || null,
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

function fromDbFighter(row, photoUrls = new Map()) {
  const storagePath = row.photo_storage_path || null;
  return {
    id: row.id,
    type: 'fighter',
    nome: row.name,
    foto: storagePath ? photoUrls.get(storagePath) || null : row.photo_data_url,
    foto_storage_path: storagePath,
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
    golpe: row.signature_move || undefined,
    erro: row.signature_miss || undefined,
    descricao: row.description || null,
    criado_em: row.created_at,
  };
}

async function toDbCard(client, card, userId) {
  const uploadedPhoto = await uploadPhotoToCloud(client, {
    uri: card.foto,
    itemId: card.id,
    entity: 'cards',
    userId,
    isCatalog: Boolean(card.is_catalog),
    existingPath: card.foto_storage_path || null,
  });

  return {
    id: card.id,
    user_id: userId,
    name: card.nome_efeito,
    photo_data_url: null,
    photo_storage_path: uploadedPhoto.path,
    photo_fake: card.foto_fake,
    category_key: card.categoria_key,
    category_name: card.categoria,
    icon: card.icon,
    description: card.descricao || null,
    polarity: card.polaridade,
    attribute: card.atributo,
    intensity: card.intensidade,
    rarity: card.raridade,
    created_at: card.criado_em,
  };
}

function fromDbCard(row, photoUrls = new Map()) {
  const storagePath = row.photo_storage_path || null;
  return {
    id: row.id,
    type: 'effect_card',
    nome_efeito: row.name,
    foto: storagePath ? photoUrls.get(storagePath) || null : row.photo_data_url,
    foto_storage_path: storagePath,
    foto_fake: row.photo_fake,
    categoria_key: row.category_key,
    categoria: row.category_name,
    icon: row.icon,
    polaridade: row.polarity,
    atributo: row.attribute,
    intensidade: row.intensity,
    raridade: row.rarity,
    descricao: row.description || null,
    criado_em: row.created_at,
  };
}
