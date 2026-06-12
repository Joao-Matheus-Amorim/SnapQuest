/**
 * SnapQuest — Contrato de RENDERIZAÇÃO de carta.
 *
 * IMPORTANTE: este NÃO é o modelo de domínio. Os dados reais do jogo continuam
 * em `src/js/core` (Fighter, EffectCard) e alimentam batalha, cloud sync e testes.
 * Aqui definimos apenas o formato que o componente visual <GameCard /> consome.
 * Adaptadores em `src/utils/cardAdapters.ts` convertem domínio → este contrato.
 *
 * As imagens PNG de template (em assets/cards/templates) são a verdade visual.
 * O código só monta conteúdo dinâmico por cima — nunca redesenha a moldura.
 */

/** Chaves de raridade em inglês — usadas pelos templates/assets. */
export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** Natureza da carta (define ícones/labels padrão). */
export type CardType = "character" | "item" | "aura" | "event" | "trap" | "nexus";

/** Um slot de atributo renderizado dentro da faixa de stats do template. */
export interface CardStatSlot {
  /** Ícone vetorial do slot (registry em CardIcon). */
  icon: CardIconName;
  /** Rótulo curto (ATK, DEF, HP...). */
  label: string;
  /** Valor exibido. */
  value: string | number;
  /** Cor de acento do valor (default = neon da raridade). */
  color?: string;
}

/** Bloco de texto da caixa de descrição (ataque / passiva / vacilo / bônus). */
export interface CardTextBlock {
  /** Marcador: ATAQUE, PASSIVA, VACILO, BÔNUS... */
  kind?: string;
  /** Título do efeito. */
  title?: string;
  /** Descrição curta. */
  description?: string;
  /** Cor de acento do marcador/título. */
  color?: string;
}

/** Nomes de ícones vetoriais disponíveis (ver components/cards/CardIcon.tsx). */
export type CardIconName =
  | "atk"
  | "def"
  | "lck"
  | "spd"
  | "hp"
  | "aura"
  | "passive"
  | "vacilo";

/** Dados prontos para o componente visual montar a carta sobre o template. */
export interface GameCardData {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  /** URI da arte/foto encaixada na janela central (pode ser null → placeholder). */
  image?: string | null;
  /** Ícone vetorial de fallback quando não há foto. */
  placeholderIcon?: CardIconName;
  /** Slots de atributo (idealmente 5, para casar com os slots do template). */
  stats: CardStatSlot[];
  /** Blocos de texto montados na caixa de descrição. */
  textBlocks: CardTextBlock[];
}
