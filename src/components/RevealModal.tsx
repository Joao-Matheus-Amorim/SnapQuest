import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View, Easing } from "react-native";
import { FighterCard } from "./FighterCard";
import { CardItem } from "./CardItem";
import {
  fighterRarity, cardRarity,
  RARITY_COLORS, RARITY_LABELS, type Rarity,
} from "../lib/rarityConfig";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

export type RevealTarget =
  | { kind: "fighter"; data: Fighter }
  | { kind: "card"; data: EffectCard }
  | null;

// Tensão por raridade: quanto mais raro, mais longa a espera.
const CHARGE_MS: Record<Rarity, number> = {
  comum: 500,
  incomum: 750,
  raro: 1100,
  épico: 1600,
  lendário: 2300,
};

const SPINS: Record<Rarity, number> = {
  comum: 1,
  incomum: 2,
  raro: 3,
  épico: 4,
  lendário: 6,
};

const CARD_WIDTH = 200;

export function RevealModal({ reveal, onClose }: { reveal: RevealTarget; onClose: () => void }) {
  const charge = useRef(new Animated.Value(0)).current;
  const revealV = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  const rarity: Rarity = reveal
    ? reveal.kind === "fighter"
      ? fighterRarity(reveal.data.bonus_intensidade ?? 1)
      : cardRarity(reveal.data.raridade ?? "")
    : "comum";
  const color = RARITY_COLORS[rarity];
  const isLegendary = rarity === "lendário";

  useEffect(() => {
    if (!reveal) return;
    setDone(false);
    charge.setValue(0);
    revealV.setValue(0);
    flash.setValue(0);

    Animated.timing(charge, {
      toValue: 1,
      duration: CHARGE_MS[rarity],
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const reveals = Animated.spring(revealV, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      });
      if (rarity === "épico" || isLegendary) {
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]).start();
      }
      reveals.start(() => setDone(true));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal]);

  if (!reveal) return null;

  const ringRotate = charge.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${SPINS[rarity] * 360}deg`],
  });
  const ringScale = charge.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.25] });
  const ringOpacity = revealV.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const coreScale = charge.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.1, 0.85] });

  const cardScale = revealV.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const cardOpacity = revealV;
  const labelOpacity = revealV.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={done ? onClose : undefined}>
      <Pressable style={s.backdrop} onPress={done ? onClose : undefined}>
        {/* Flash de jackpot */}
        <Animated.View pointerEvents="none" style={[s.flash, { opacity: flash, backgroundColor: isLegendary ? "#fff" : color }]} />

        {/* Fase de carga */}
        <Animated.View pointerEvents="none" style={[s.chargeWrap, { opacity: ringOpacity }]}>
          <Animated.View style={[
            s.ring,
            { borderColor: color, transform: [{ rotate: ringRotate }, { scale: ringScale }] },
          ]} />
          <Animated.View style={[s.core, { backgroundColor: color, transform: [{ scale: coreScale }] }]}>
            <Text style={s.coreMark}>?</Text>
          </Animated.View>
        </Animated.View>

        {/* Reveal */}
        <Animated.View style={[s.cardWrap, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          {reveal.kind === "fighter" ? (
            <FighterCard fighter={reveal.data} width={CARD_WIDTH} interactive />
          ) : (
            <CardItem card={reveal.data} width={CARD_WIDTH} interactive />
          )}
        </Animated.View>

        <Animated.View style={[s.labelWrap, { opacity: labelOpacity }]}>
          {isLegendary && <Text style={s.legendaryTop}>🎉 LENDÁRIO 🎉</Text>}
          <Text style={[s.rarityLabel, { color }]}>{RARITY_LABELS[rarity]}</Text>
          <Text style={s.name}>
            {reveal.kind === "fighter" ? reveal.data.nome : reveal.data.nome_efeito}
          </Text>
          {reveal.kind === "fighter" && (
            <>
              <Text style={s.move}>🎯 {reveal.data.golpe}</Text>
              {reveal.data.erro ? <Text style={s.miss}>💫 {reveal.data.erro}</Text> : null}
            </>
          )}
          {done && (
            <Pressable style={[s.continueBtn, { borderColor: color }]} onPress={onClose}>
              <Text style={[s.continueText, { color }]}>Continuar</Text>
            </Pressable>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10,12,22,.94)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  flash: { ...StyleSheet.absoluteFillObject },
  chargeWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  core: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  coreMark: { color: "#fff", fontSize: 44, fontWeight: "900" },
  cardWrap: { alignItems: "center" },
  labelWrap: { alignItems: "center", marginTop: 22 },
  legendaryTop: { color: "#ffd54f", fontSize: 22, fontWeight: "900", marginBottom: 6, letterSpacing: 1 },
  rarityLabel: { fontSize: 26, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2 },
  name: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 4, textAlign: "center" },
  move: { color: "#4caf50", fontSize: 13, fontWeight: "700", marginTop: 6, textAlign: "center" },
  miss: { color: "rgba(233,69,96,.9)", fontSize: 12, fontStyle: "italic", marginTop: 2, textAlign: "center" },
  continueBtn: {
    marginTop: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  continueText: { fontSize: 16, fontWeight: "800" },
});
