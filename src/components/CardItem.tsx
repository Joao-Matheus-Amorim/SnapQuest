import type { EffectCard } from "../js/core/cards.js";
import { cardRarity } from "../lib/rarityConfig";
import { COLORS } from "../theme/tokens";
import { CardTemplate } from "./card/CardTemplate";
import { CARD_HEIGHT, CARD_WIDTH, categoryColor } from "./card/cardFrameConfig";

export { CARD_HEIGHT, CARD_WIDTH };

export function CardItem({ card, width = CARD_WIDTH, interactive = false }: { card: EffectCard; width?: number; interactive?: boolean }) {
  const rarity = cardRarity(card.raridade ?? "");
  const tint = categoryColor(card.categoria_key);
  const isDebuff = card.polaridade === "DEBUFF";
  const polarityColor = isDebuff ? COLORS.red : COLORS.greenSoft;

  return (
    <CardTemplate
      width={width}
      interactive={interactive}
      rarity={rarity}
      imageUri={card.foto}
      title={card.nome_efeito}
      classLabel={card.categoria}
      classColor={tint}
      placeholderIcon={card.icon}
      hpLabel={isDebuff ? "HEX" : "BUFF"}
      hpValue={card.intensidade}
      hpColor={polarityColor}
      powerLabel={card.polaridade}
      powerColor={polarityColor}
      powerTextColor={COLORS.bgNav}
      description={isDebuff ? "Enfraquece o alvo no duelo." : "Amplifica o poder do aliado."}
      stats={[
        { label: "ATR", value: card.atributo, color: COLORS.accent },
        { label: "FOR", value: card.intensidade, color: polarityColor },
        { label: "TIPO", value: isDebuff ? "HEX" : "AURA", color: COLORS.gold },
        { label: "SIG", value: card.icon ?? "*", color: tint },
      ]}
    />
  );
}
