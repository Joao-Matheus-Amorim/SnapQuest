/**
 * GameCard — compositor da carta em CAMADAS sobre o template PNG.
 *
 *   1. CardBackGlow   — neon de fundo por raridade (atrás de tudo)
 *   2. template PNG   — moldura final (verdade visual; nunca redesenhada por código)
 *   3. CardArt        — foto/arte encaixada na janela central
 *   4. CardTitle      — nome no plate de topo
 *   5. CardStatsRow   — ícones+valores nos slots vazios da faixa de atributos
 *   6. CardTextBox    — ataque/passiva/vacilo na caixa de descrição
 *      CardFooter     — rótulo de raridade no plate inferior
 *   7. CardFoilOverlay— foil holográfico (apenas épico/lendário)
 *
 * A imagem é usada exatamente como base: proporção 9:16, sem cortar/distorcer.
 */
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { CARD_ASPECT, CARD_WIDTH } from "../../utils/cardMeta";
import { cardRarityTheme } from "../../utils/cardTheme";
import type { GameCardData } from "../../types/card";
import { CardBackGlow } from "./CardBackGlow";
import { CardArt } from "./CardArt";
import { CardTitle } from "./CardTitle";
import { CardStatsRow } from "./CardStatsRow";
import { CardTextBox } from "./CardTextBox";
import { CardFooter } from "./CardFooter";
import { CardFoilOverlay } from "./CardFoilOverlay";

const RARITY_INTENSITY: Record<string, number> = {
  common: 0.25,
  uncommon: 0.45,
  rare: 0.65,
  epic: 0.85,
  legendary: 1,
};

type Props = {
  data: GameCardData;
  width?: number;
  /** Mostra o neon de fundo (default true). */
  glow?: boolean;
};

export function GameCard({ data, width = CARD_WIDTH, glow = true }: Props) {
  const height = Math.round(width * CARD_ASPECT);
  const theme = cardRarityTheme(data.rarity);
  const intensity = RARITY_INTENSITY[data.rarity] ?? 0.5;
  const radius = width * 0.08;

  return (
    <View style={{ width, height }}>
      {/* 1 · neon de fundo */}
      {glow ? <CardBackGlow width={width} height={height} neonColor={theme.neonColor} intensity={intensity} /> : null}

      {/* 2 · moldura PNG (base) */}
      <Image source={theme.template} style={{ width, height }} resizeMode="contain" />

      {/* 3 · foil holográfico (épico/lendário) — ENTRE moldura e arte:
          brilha só na moldura/ornamentos; a foto opaca cobre a janela e o
          texto fica acima, então não atrapalha leitura de foto/nome/atributos. */}
      {theme.foil ? <CardFoilOverlay width={width} height={height} variant={data.rarity as "epic" | "legendary"} radius={radius} /> : null}

      {/* 4 · arte */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <CardArt
          width={width}
          height={height}
          image={data.image}
          placeholderIcon={data.placeholderIcon}
          tint={theme.neonColor}
        />
      </View>

      {/* 5-7 · conteúdo dinâmico (sempre acima do foil → leitura garantida) */}
      <CardTitle width={width} height={height} title={data.name} glowColor={theme.glowColor} />
      <CardStatsRow width={width} height={height} stats={data.stats} neonColor={theme.neonColor} cardType={data.type} />
      <CardTextBox width={width} height={height} blocks={data.textBlocks} />
      <CardFooter width={width} height={height} label={theme.label} color={theme.neonColor} />
    </View>
  );
}
