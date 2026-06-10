import { supabase } from "../lib/supabase";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

export async function loadCloudDeck(userId: string): Promise<{ fighters: Fighter[]; cards: EffectCard[] }> {
  const [{ data: fRows, error: fErr }, { data: cRows, error: cErr }] = await Promise.all([
    supabase.from("snapquest_fighters").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("snapquest_effect_cards").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  if (fErr) throw fErr;
  if (cErr) throw cErr;
  return {
    fighters: (fRows ?? []).map(fromDbFighter),
    cards: (cRows ?? []).map(fromDbCard),
  };
}

function fromDbFighter(row: Record<string, unknown>): Fighter {
  return {
    id: row.id,
    type: "fighter",
    nome: row.name,
    foto: row.photo_data_url ?? undefined,
    foto_fake: row.photo_fake ?? undefined,
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
  } as Fighter;
}

function fromDbCard(row: Record<string, unknown>): EffectCard {
  return {
    id: row.id,
    type: "effect_card",
    nome_efeito: row.name,
    foto: row.photo_data_url ?? undefined,
    foto_fake: row.photo_fake ?? undefined,
    categoria_key: row.category_key,
    categoria: row.category_name,
    icon: row.icon,
    polaridade: row.polarity,
    atributo: row.attribute,
    intensidade: row.intensity,
    raridade: row.rarity,
    criado_em: row.created_at,
  } as EffectCard;
}

export async function syncFighterToCloud(fighter: Fighter, userId: string): Promise<void> {
  const { error } = await supabase.from("snapquest_fighters").upsert(
    {
      id: fighter.id,
      user_id: userId,
      name: fighter.nome,
      photo_data_url: fighter.foto ?? null,
      photo_fake: fighter.foto_fake ?? null,
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
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function syncCardToCloud(card: EffectCard, userId: string): Promise<void> {
  const { error } = await supabase.from("snapquest_effect_cards").upsert(
    {
      id: card.id,
      user_id: userId,
      name: card.nome_efeito,
      photo_data_url: card.foto ?? null,
      photo_fake: card.foto_fake ?? null,
      category_key: card.categoria_key,
      category_name: card.categoria,
      icon: card.icon,
      polarity: card.polaridade,
      attribute: card.atributo,
      intensity: card.intensidade,
      rarity: card.raridade,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}
