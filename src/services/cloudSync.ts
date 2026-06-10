import { supabase } from "../lib/supabase";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

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
