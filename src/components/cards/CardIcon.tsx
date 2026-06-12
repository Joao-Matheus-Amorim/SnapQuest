/**
 * CardIcon — ícones vetoriais próprios do jogo (NÃO emojis), estética dark fantasy.
 *
 * Cada ícone é renderizado em 2 passes dentro de um viewBox fixo 24x24:
 *   1. halo de glow (stroke grosso translúcido na cor neon da raridade)
 *   2. símbolo principal (silhueta preenchida sutil + traço limpo na cor do atributo)
 * + acentos rúnicos/metálicos discretos. Linguagem visual compartilhada por todos.
 *
 * Registry: atk (lâmina), def (escudo rúnico), lck (estrela arcana),
 * spd (flechas duplas), hp (coração rúnico), aura (orbe), passive (rune), vacilo (fratura).
 */
import React from "react";
import Svg, { G, Path, Circle, Polygon, Line } from "react-native-svg";
import type { CardIconName } from "../../types/card";

type Props = {
  name: CardIconName;
  size?: number;
  /** Cor do traço principal (geralmente a cor do atributo). */
  color?: string;
  /** Cor do halo neon (geralmente o neon da raridade). */
  glow?: string;
  opacity?: number;
};

/** Geometria de cada símbolo, parametrizada pelos props de traço/preenchimento. */
function shapes(name: CardIconName, p: object, fill: object) {
  switch (name) {
    case "atk": // lâmina/adaga mágica
      return (
        <>
          <Path d="M12 2 L14.4 7 L14.4 14.5 L9.6 14.5 L9.6 7 Z" {...p} {...fill} />
          <Line x1="6.5" y1="15.5" x2="17.5" y2="15.5" {...p} />
          <Line x1="12" y1="15.5" x2="12" y2="22" {...p} />
          <Circle cx="12" cy="5.4" r="0.9" {...p} />
        </>
      );
    case "def": // escudo rúnico / barreira cristalina
      return (
        <>
          <Path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" {...p} {...fill} />
          <Path d="M12 7 L15 9 V12.5 C15 14.5 13.7 16.3 12 17.4 C10.3 16.3 9 14.5 9 12.5 V9 Z" {...p} />
        </>
      );
    case "lck": // estrela arcana de 4 pontas
      return (
        <>
          <Path d="M12 2 L13.9 9.6 L21.5 12 L13.9 14.4 L12 22 L10.1 14.4 L2.5 12 L10.1 9.6 Z" {...p} {...fill} />
          <Circle cx="12" cy="12" r="1.4" {...p} />
        </>
      );
    case "spd": // flechas duplas / rastro
      return (
        <>
          <Path d="M3.5 7 L11 12 L3.5 17" {...p} />
          <Path d="M11.5 7 L19 12 L11.5 17" {...p} />
        </>
      );
    case "hp": // coração rúnico / núcleo vital
      return (
        <>
          <Path d="M12 21 C5 15.5 4 10 7.5 7 C9.5 5.2 12 6 12 8.5 C12 6 14.5 5.2 16.5 7 C20 10 19 15.5 12 21 Z" {...p} {...fill} />
          <Line x1="12" y1="10" x2="12" y2="15" {...p} />
          <Line x1="9.7" y1="12.4" x2="14.3" y2="12.4" {...p} />
        </>
      );
    case "aura": // orbe com anel
      return (
        <>
          <Circle cx="12" cy="12" r="4.4" {...p} {...fill} />
          <Circle cx="12" cy="12" r="9" {...p} />
        </>
      );
    case "passive": // rune hexagonal
      return (
        <>
          <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" {...p} {...fill} />
          <Circle cx="12" cy="12" r="3" {...p} />
        </>
      );
    case "vacilo": // fratura / raio quebrado
      return <Path d="M13 2 L6 13 H11 L9 22 L18 9 H12 Z" {...p} {...fill} />;
  }
}

export function CardIcon({ name, size = 14, color = "#eaf2ff", glow, opacity = 1 }: Props) {
  const base = {
    stroke: color,
    strokeWidth: 1.5,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const fill = { fill: color, fillOpacity: 0.14 };
  const halo = {
    stroke: glow ?? color,
    strokeWidth: 3.4,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* halo neon */}
      <G opacity={0.4 * opacity}>{shapes(name, halo, {})}</G>
      {/* símbolo principal */}
      <G opacity={opacity}>{shapes(name, base, fill)}</G>
    </Svg>
  );
}
