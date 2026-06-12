/**
 * Adaptadores domínio → contrato de renderização (GameCardData).
 *
 * Fighter e EffectCard continuam sendo a verdade de dados (src/js/core).
 * Aqui só traduzimos para o formato que <GameCard /> monta sobre o template.
 * Reutilizado por FighterCard, CardItem e RevealModal.
 */
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";
import { fighterRarity, cardRarity } from "../lib/rarityConfig";
import { COLORS } from "../theme/tokens";
import type { CardIconName, GameCardData } from "../types/card";
import { rarityToCardRarity } from "./cardTheme";
import { classColor, categoryColor } from "./cardMeta";

function attrIcon(attr?: string | null): CardIconName {
  switch ((attr ?? "").toUpperCase()) {
    case "ATK":
      return "atk";
    case "DEF":
      return "def";
    case "LCK":
      return "lck";
    case "SPD":
      return "spd";
    default:
      return "aura";
  }
}

function effectVerb(card: EffectCard) {
  const signal = card.polaridade === "DEBUFF" ? "reduz" : "aumenta";
  return `${signal} ${card.intensidade} de ${card.atributo}`;
}

function effectDescription(card: EffectCard) {
  const custom = typeof card.descricao === "string" ? card.descricao.trim() : "";
  if (custom) return custom;

  return "";
}

function fighterDescription(fighter: Fighter) {
  const custom = typeof fighter.descricao === "string" ? fighter.descricao.trim() : "";
  if (custom) return custom;

  return "";
}

/** Fighter → carta de personagem (5 slots: ATK/DEF/LCK/SPD/HP). */
export function fighterToCardData(f: Fighter): GameCardData {
  const tint = classColor(f.class_key);
  const blocks: GameCardData["textBlocks"] = [
    {
      description: fighterDescription(f),
    },
  ];

  return {
    id: f.id,
    name: f.nome,
    type: "character",
    rarity: rarityToCardRarity(fighterRarity(f.bonus_intensidade ?? 1)),
    image: f.foto,
    placeholderIcon: "atk",
    stats: [
      { icon: "atk", label: "ATK", value: f.atk, color: COLORS.primary },
      { icon: "def", label: "DEF", value: f.def, color: COLORS.accent },
      { icon: "lck", label: "LCK", value: f.lck, color: COLORS.gold },
      { icon: "spd", label: "SPD", value: f.spd, color: COLORS.greenSoft },
      { icon: "hp", label: "HP", value: f.hp, color: tint },
    ],
    textBlocks: blocks,
  };
}

/** EffectCard → carta de aura/efeito (5 slots de atributo). */
export function effectCardToCardData(c: EffectCard): GameCardData {
  const tint = categoryColor(c.categoria_key);
  const isDebuff = c.polaridade === "DEBUFF";
  const polColor = isDebuff ? COLORS.red : COLORS.greenSoft;
  const catShort = (c.categoria ?? "").slice(0, 3).toUpperCase();

  return {
    id: c.id,
    name: c.nome_efeito,
    type: isDebuff ? "trap" : "aura",
    rarity: rarityToCardRarity(cardRarity(c.raridade ?? "")),
    image: c.foto,
    placeholderIcon: "aura",
    stats: [
      { icon: attrIcon(c.atributo), label: "ATR", value: c.atributo, color: COLORS.accent },
      { icon: "aura", label: "FOR", value: `+${c.intensidade}`, color: polColor },
      { icon: isDebuff ? "vacilo" : "passive", label: "TIPO", value: isDebuff ? "HEX" : "AURA", color: COLORS.gold },
      { icon: "passive", label: "ALVO", value: isDebuff ? "INI" : "ALI", color: COLORS.cream },
      { icon: "aura", label: "SIG", value: catShort || "ARC", color: tint },
    ],
    textBlocks: [
      {
        description: effectDescription(c),
      },
    ],
  };
}
