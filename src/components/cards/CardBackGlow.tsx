/**
 * CardBackGlow — neon/glow atrás da carta, por raridade.
 * Fica ATRÁS do template; nunca cobre arte nem texto (pointerEvents none, sem clip).
 */
import React from "react";
import { View } from "react-native";

type Props = {
  width: number;
  height: number;
  neonColor: string;
  /** 0..1 — comum sutil, lendário forte. */
  intensity?: number;
};

export function CardBackGlow({ width, height, neonColor, intensity = 0.6 }: Props) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        borderRadius: width * 0.08,
        backgroundColor: neonColor,
        opacity: 0.16 + intensity * 0.22,
        shadowColor: neonColor,
        shadowOpacity: 0.5 + intensity * 0.45,
        shadowRadius: 14 + intensity * 26,
        shadowOffset: { width: 0, height: 0 },
        elevation: Math.round(6 + intensity * 14),
        transform: [{ scale: 0.96 }],
      }}
    />
  );
}
