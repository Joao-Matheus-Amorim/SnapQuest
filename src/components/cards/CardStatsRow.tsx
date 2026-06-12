import React from "react";
import { StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { LocalSvg } from "react-native-svg/css";
import { COLORS } from "../../theme/tokens";
import { FONTS } from "../../theme/fonts";
import { CARD_LAYOUT, zoneStyle } from "../../utils/cardLayout";
import type { CardStatSlot, CardType } from "../../types/card";
import { CardIcon } from "./CardIcon";

const iconAtk = require("../../../assets/icons/card/icon-atk.svg");
const iconDef = require("../../../assets/icons/card/icon-def.svg");
const iconLck = require("../../../assets/icons/card/icon-lck.svg");
const iconSpd = require("../../../assets/icons/card/icon-spd.svg");
const iconHp = require("../../../assets/icons/card/icon-hp.svg");

type StatKey = "ATK" | "DEF" | "LCK" | "SPD" | "HP";

type CardStatsGridProps = {
  width: number;
  height: number;
  atk: string | number;
  def: string | number;
  lck: string | number;
  spd: string | number;
  hp: string | number;
  neonColor: string;
  debug?: boolean;
};

type CardStatsRowProps = {
  width: number;
  height: number;
  stats: CardStatSlot[];
  neonColor: string;
  cardType?: CardType;
  debug?: boolean;
};

const statsConfig: Array<{ key: StatKey; valueKey: Lowercase<StatKey>; icon: ImageSourcePropType }> = [
  { key: "ATK", valueKey: "atk", icon: iconAtk },
  { key: "DEF", valueKey: "def", icon: iconDef },
  { key: "LCK", valueKey: "lck", icon: iconLck },
  { key: "SPD", valueKey: "spd", icon: iconSpd },
  { key: "HP", valueKey: "hp", icon: iconHp },
];

function statValue(stats: CardStatSlot[], label: StatKey, index: number) {
  const exact = stats.find((slot) => String(slot.label).toUpperCase() === label);
  return exact?.value ?? stats[index]?.value ?? 0;
}

export function CardStatsGrid({ width, height, atk, def, lck, spd, hp, neonColor, debug = false }: CardStatsGridProps) {
  const zone = zoneStyle(CARD_LAYOUT.statsArea, width, height);
  const zoneHeight = CARD_LAYOUT.statsArea.height * height;
  const iconBoxSize = Math.round(zoneHeight * 0.46);
  const iconSize = Math.round(zoneHeight * 0.4);
  const valueHeight = Math.round(zoneHeight * 0.34);
  const valueSize = Math.max(7, Math.round(valueHeight * 0.86));
  const contentGap = Math.max(1, Math.round(zoneHeight * 0.06));
  const contentHeight = iconBoxSize + contentGap + valueHeight;
  const iconTop = Math.max(0, Math.round((zoneHeight - contentHeight) / 2 + zoneHeight * 0.04));
  const valueTop = iconTop + iconBoxSize + contentGap;
  const values = { atk, def, lck, spd, hp };

  return (
    <View style={[zone, styles.row]} pointerEvents="none">
      {statsConfig.map((stat) => (
        <View key={stat.key} style={[styles.slot, debug && styles.debugSlot]}>
          {debug ? <View style={styles.debugCenter} /> : null}
          <View style={[styles.iconBox, { top: iconTop, width: iconBoxSize, height: iconBoxSize }]}>
            <LocalSvg asset={stat.icon} width={iconSize} height={iconSize} />
          </View>
          <Text
            style={[styles.value, { top: valueTop, height: valueHeight, lineHeight: valueHeight, fontSize: valueSize, color: neonColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {values[stat.valueKey]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CardEffectStatsGrid({ width, height, stats, neonColor, debug = false }: CardStatsRowProps) {
  const zone = zoneStyle(CARD_LAYOUT.statsArea, width, height);
  const zoneHeight = CARD_LAYOUT.statsArea.height * height;
  const iconSize = Math.max(8, Math.round(zoneHeight * 0.38));
  const labelHeight = Math.max(5, Math.round(zoneHeight * 0.24));
  const valueHeight = Math.max(7, Math.round(zoneHeight * 0.34));
  const labelSize = Math.max(4, Math.round(labelHeight * 0.78));
  const valueSize = Math.max(6, Math.round(valueHeight * 0.82));
  const iconTop = Math.round(zoneHeight * 0.29);
  const labelTop = Math.max(0, iconTop - labelHeight);
  const valueTop = Math.min(
    Math.round(zoneHeight - valueHeight),
    iconTop + iconSize + Math.max(1, Math.round(zoneHeight * 0.04))
  );

  return (
    <View style={[zone, styles.effectRow]} pointerEvents="none">
      {stats.map((stat, index) => (
        <View key={`${stat.label}-${index}`} style={[styles.effectSlot, debug && styles.debugSlot]}>
          {debug ? <View style={styles.debugCenter} /> : null}
          <Text
            style={[styles.effectLabel, { top: labelTop, height: labelHeight, lineHeight: labelHeight, fontSize: labelSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {stat.label}
          </Text>
          <View style={[styles.effectIconBox, { top: iconTop, height: iconSize, width: iconSize }]}>
            <CardIcon name={stat.icon} size={iconSize} color={stat.color ?? neonColor} glow={neonColor} opacity={0.96} />
          </View>
          <Text
            style={[
              styles.effectValue,
              {
                top: valueTop,
                height: valueHeight,
                lineHeight: valueHeight,
                fontSize: valueSize,
                color: stat.color ?? COLORS.cream,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
          >
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function CardStatsRow({ width, height, stats, neonColor, cardType = "character", debug = false }: CardStatsRowProps) {
  if (cardType !== "character") {
    return <CardEffectStatsGrid width={width} height={height} stats={stats} neonColor={neonColor} debug={debug} />;
  }

  return (
    <CardStatsGrid
      width={width}
      height={height}
      atk={statValue(stats, "ATK", 0)}
      def={statValue(stats, "DEF", 1)}
      lck={statValue(stats, "LCK", 2)}
      spd={statValue(stats, "SPD", 3)}
      hp={statValue(stats, "HP", 4)}
      neonColor={neonColor}
      debug={debug}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  effectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  slot: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
    position: "relative",
  },
  iconBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  value: {
    position: "absolute",
    fontFamily: FONTS.exo2Black,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  effectSlot: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
    position: "relative",
  },
  effectLabel: {
    position: "absolute",
    color: COLORS.textMuted,
    fontFamily: FONTS.exo2Bold,
    letterSpacing: 0,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  effectIconBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  effectValue: {
    position: "absolute",
    fontFamily: FONTS.exo2Black,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  debugSlot: {
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
  },
  debugCenter: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,0,80,0.6)",
  },
});
