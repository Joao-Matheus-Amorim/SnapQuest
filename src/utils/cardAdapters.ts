/**
 * Adaptadores domínio → contrato de renderização (GameCardData).
 *
 * Fighter e EffectCard continuam sendo a verdade de dados (src/js/core).
 * Aqui só traduzimos para o formato que <GameCard /> monta sobre o template.
 * Reutilizado por FighterCard, CardItem e RevealModal.
 */
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";
import { fighterRarity, tierRarity } from "../lib/rarityConfig";
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

  // Em batalha o fighter ganha current_hp/buffs. Quando presentes, o card precisa
  // refletir o estado vivo (HP atual e stats com buff) para o dano aparecer.
  // No inventario/deck esses campos nao existem e caimos no valor base.
  const live = f as Fighter & {
    current_hp?: number;
    buffs?: { atk?: number; def?: number; lck?: number; spd?: number };
  };
  const buffs = live.buffs;
  const hpValue = typeof live.current_hp === "number" ? live.current_hp : f.hp;
  const atkValue = f.atk + (buffs?.atk ?? 0);
  const defValue = f.def + (buffs?.def ?? 0);
  const lckValue = f.lck + (buffs?.lck ?? 0);
  const spdValue = f.spd + (buffs?.spd ?? 0);

  return {
    id: f.id,
    name: f.nome,
    type: "character",
    rarity: rarityToCardRarity(fighterRarity(f.bonus_intensidade ?? 1)),
    image: f.foto,
    placeholderIcon: "atk",
    stats: [
      { icon: "atk", label: "ATK", value: atkValue, color: COLORS.primary },
      { icon: "def", label: "DEF", value: defValue, color: COLORS.accent },
      { icon: "lck", label: "LCK", value: lckValue, color: COLORS.gold },
      { icon: "spd", label: "SPD", value: spdValue, color: COLORS.greenSoft },
      { icon: "hp", label: "HP", value: hpValue, color: tint },
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
    rarity: rarityToCardRarity(tierRarity(Number(c.intensidade) || 1)),
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
