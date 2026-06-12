import { supabase } from "../lib/supabase";
import { generateGolpe, generateMiss } from "../js/core/balance.js";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";
import { deletePhotoFromCloud, resolvePhotoUrls, uploadPhotoToCloud } from "./photoCloudStorage";

type DbRow = Record<string, unknown>;

export async function loadCloudDeck(userId: string): Promise<{ fighters: Fighter[]; cards: EffectCard[] }> {
  const [{ data: fRows, error: fErr }, { data: cRows, error: cErr }] = await Promise.all([
    supabase.from("snapquest_fighters").select("*").eq("user_id", userId).eq("is_catalog", false).order("created_at", { ascending: false }),
    supabase.from("snapquest_effect_cards").select("*").eq("user_id", userId).eq("is_catalog", false).order("created_at", { ascending: false }),
  ]);
  if (fErr) throw fErr;
  if (cErr) throw cErr;

  const photoUrls = await resolvePhotoUrls([
    ...collectPhotoPaths(fRows),
    ...collectPhotoPaths(cRows),
  ]);

  return {
    fighters: (fRows ?? []).map((row) => fromDbFighter(row, photoUrls)),
    cards: (cRows ?? []).map((row) => fromDbCard(row, photoUrls)),
  };
}

export async function loadCatalog(): Promise<{ fighters: Fighter[]; cards: EffectCard[] }> {
  const [{ data: fRows, error: fErr }, { data: cRows, error: cErr }] = await Promise.all([
    supabase.from("snapquest_fighters").select("*").eq("is_catalog", true).order("created_at", { ascending: true }),
    supabase.from("snapquest_effect_cards").select("*").eq("is_catalog", true).order("created_at", { ascending: true }),
  ]);
  if (fErr) throw fErr;
  if (cErr) throw cErr;

  const photoUrls = await resolvePhotoUrls([
    ...collectPhotoPaths(fRows),
    ...collectPhotoPaths(cRows),
  ]);

  return {
    fighters: (fRows ?? []).map((row) => fromDbFighter(row, photoUrls)),
    cards: (cRows ?? []).map((row) => fromDbCard(row, photoUrls)),
  };
}

function collectPhotoPaths(rows: DbRow[] | null | undefined) {
  return (rows ?? []).map((row) => row.photo_storage_path as string | null | undefined);
}

function resolveRowPhoto(row: DbRow, photoUrls: Map<string, string>) {
  const storagePath = row.photo_storage_path as string | null | undefined;
  if (storagePath) {
    return {
      foto: photoUrls.get(storagePath) ?? null,
      foto_storage_path: storagePath,
    };
  }

  return {
    foto: (row.photo_data_url as string | null | undefined) ?? null,
    foto_storage_path: null,
  };
}

export function fromDbFighter(row: DbRow, photoUrls: Map<string, string> = new Map()): Fighter {
  const photo = resolveRowPhoto(row, photoUrls);
  return {
    id: row.id,
    type: "fighter",
    nome: row.name,
    foto: photo.foto,
    foto_storage_path: photo.foto_storage_path,
    foto_fake: row.photo_fake ?? undefined,
    class_key: row.class_key,
    classe: row.class_name,
    icon: row.icon,
    descricao: (row.description as string | null | undefined) ?? null,
    hp: row.hp,
    atk: row.atk,
    def: row.def,
    lck: row.lck,
    spd: row.spd,
    bonus_atributo: row.bonus_attribute,
    bonus_intensidade: row.bonus_intensity,
    golpe: (row.signature_move as string) || generateGolpe((row.name as string) ?? ""),
    erro: (row.signature_miss as string) || generateMiss((row.name as string) ?? ""),
    criado_em: row.created_at,
  } as Fighter;
}

export function fromDbCard(row: DbRow, photoUrls: Map<string, string> = new Map()): EffectCard {
  const photo = resolveRowPhoto(row, photoUrls);
  return {
    id: row.id,
    type: "effect_card",
    nome_efeito: row.name,
    foto: photo.foto,
    foto_storage_path: photo.foto_storage_path,
    foto_fake: row.photo_fake ?? undefined,
    categoria_key: row.category_key,
    categoria: row.category_name,
    icon: row.icon,
    descricao: (row.description as string | null | undefined) ?? null,
    polaridade: row.polarity,
    atributo: row.attribute,
    intensidade: row.intensity,
    raridade: row.rarity,
    criado_em: row.created_at,
  } as EffectCard;
}

export async function syncFighterToCloud(fighter: Fighter, userId: string): Promise<void> {
  const uploadedPhoto = await uploadPhotoToCloud({
    uri: fighter.foto,
    itemId: fighter.id,
    entity: "fighters",
    userId,
    isCatalog: false,
    existingPath: fighter.foto_storage_path ?? null,
  });

  const { error } = await supabase.from("snapquest_fighters").upsert(
    { id: fighter.id, user_id: userId, name: fighter.nome, photo_data_url: null, photo_storage_path: uploadedPhoto.path,
      photo_fake: fighter.foto_fake ?? null, class_key: fighter.class_key, class_name: fighter.classe,
      description: fighter.descricao?.trim() || null,
      signature_move: fighter.golpe?.trim() || null,
      signature_miss: fighter.erro?.trim() || null,
      icon: fighter.icon, hp: fighter.hp, atk: fighter.atk, def: fighter.def, lck: fighter.lck,
      spd: fighter.spd, bonus_attribute: fighter.bonus_atributo, bonus_intensity: fighter.bonus_intensidade,
      is_catalog: false },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function syncCardToCloud(card: EffectCard, userId: string): Promise<void> {
  const uploadedPhoto = await uploadPhotoToCloud({
    uri: card.foto,
    itemId: card.id,
    entity: "cards",
    userId,
    isCatalog: false,
    existingPath: card.foto_storage_path ?? null,
  });

  const { error } = await supabase.from("snapquest_effect_cards").upsert(
    { id: card.id, user_id: userId, name: card.nome_efeito, photo_data_url: null, photo_storage_path: uploadedPhoto.path,
      photo_fake: card.foto_fake ?? null, category_key: card.categoria_key, category_name: card.categoria,
      description: card.descricao?.trim() || null,
      icon: card.icon, polarity: card.polaridade, attribute: card.atributo, intensity: card.intensidade,
      rarity: card.raridade, is_catalog: false },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function syncCatalogFighter(fighter: Fighter, userId: string): Promise<void> {
  const uploadedPhoto = await uploadPhotoToCloud({
    uri: fighter.foto,
    itemId: fighter.id,
    entity: "fighters",
    userId,
    isCatalog: true,
    existingPath: fighter.foto_storage_path ?? null,
  });

  const { error } = await supabase.from("snapquest_fighters").upsert(
    { id: fighter.id, user_id: userId, name: fighter.nome, photo_data_url: null, photo_storage_path: uploadedPhoto.path,
      photo_fake: fighter.foto_fake ?? null, class_key: fighter.class_key, class_name: fighter.classe,
      description: fighter.descricao?.trim() || null,
      signature_move: fighter.golpe?.trim() || null,
      signature_miss: fighter.erro?.trim() || null,
      icon: fighter.icon, hp: fighter.hp, atk: fighter.atk, def: fighter.def, lck: fighter.lck,
      spd: fighter.spd, bonus_attribute: fighter.bonus_atributo, bonus_intensity: fighter.bonus_intensidade,
      is_catalog: true },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function deleteFighterFromCloud(id: string): Promise<void> {
  const { data: row, error: readError } = await supabase
    .from("snapquest_fighters")
    .select("photo_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw readError;
  await deletePhotoFromCloud((row?.photo_storage_path as string | null | undefined) ?? null);

  const { error } = await supabase.from("snapquest_fighters").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCardFromCloud(id: string): Promise<void> {
  const { data: row, error: readError } = await supabase
    .from("snapquest_effect_cards")
    .select("photo_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw readError;
  await deletePhotoFromCloud((row?.photo_storage_path as string | null | undefined) ?? null);

  const { error } = await supabase.from("snapquest_effect_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function syncCatalogCard(card: EffectCard, userId: string): Promise<void> {
  const uploadedPhoto = await uploadPhotoToCloud({
    uri: card.foto,
    itemId: card.id,
    entity: "cards",
    userId,
    isCatalog: true,
    existingPath: card.foto_storage_path ?? null,
  });

  const { error } = await supabase.from("snapquest_effect_cards").upsert(
    { id: card.id, user_id: userId, name: card.nome_efeito, photo_data_url: null, photo_storage_path: uploadedPhoto.path,
      photo_fake: card.foto_fake ?? null, category_key: card.categoria_key, category_name: card.categoria,
      description: card.descricao?.trim() || null,
      icon: card.icon, polarity: card.polaridade, attribute: card.atributo, intensity: card.intensidade,
      rarity: card.raridade, is_catalog: true },
    { onConflict: "id" }
  );
  if (error) throw error;
}
