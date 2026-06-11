import type { Fighter } from "../js/core/fighters.js";
import { fighterRarity } from "../lib/rarityConfig";
import { COLORS } from "../theme/tokens";
import { CardTemplate } from "./card/CardTemplate";
import { CARD_HEIGHT, CARD_WIDTH, classColor } from "./card/cardFrameConfig";

export { CARD_HEIGHT, CARD_WIDTH };

export function FighterCard({ fighter, width = CARD_WIDTH, interactive = false }: { fighter: Fighter; width?: number; interactive?: boolean }) {
  const rarity = fighterRarity(fighter.bonus_intensidade ?? 1);
  const tint = classColor(fighter.class_key);

  return (
    <CardTemplate
      width={width}
      interactive={interactive}
      rarity={rarity}
      imageUri={fighter.foto}
      title={fighter.nome}
      classLabel={fighter.classe}
      classColor={tint}
      placeholderIcon={fighter.icon}
      hpLabel="HP"
      hpValue={fighter.hp}
      hpColor={tint}
      powerLabel={fighter.golpe || "GOLPE ARCANO"}
      powerColor={tint}
      description={fighter.erro ? `Vacilo: ${fighter.erro}` : `Bonus ${fighter.bonus_atributo} +${fighter.bonus_intensidade}`}
      stats={[
        { label: "ATK", value: fighter.atk, color: COLORS.primary },
        { label: "DEF", value: fighter.def, color: COLORS.accent },
        { label: "LCK", value: fighter.lck, color: COLORS.gold },
        { label: "SPD", value: fighter.spd, color: COLORS.greenSoft },
      ]}
    />
  );
}
