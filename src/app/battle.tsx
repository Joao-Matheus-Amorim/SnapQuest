import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { PanResponder, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useInventory } from "../hooks/useInventory";
import { useBattle } from "../hooks/useBattle";
import type { ActionResult, BattleCard, BattleFighter, BattlePlayer } from "../js/core/battle.js";
import { canAffordCard, cardEnergyCost, totalHp } from "../js/core/battle.js";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { ArenaBackground } from "../components/game/ArenaBackground";
import { PressableScale } from "../components/motion/PressableScale";
import { GameCard } from "../components/cards/GameCard";
import { fighterRarity, RARITY_COLORS } from "../lib/rarityConfig";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { effectCardToCardData, fighterToCardData } from "../utils/cardAdapters";
import { CARD_ASPECT } from "../utils/cardMeta";

type BattleUiEvent = "draw" | "card" | "attack" | "pass" | "select";

type BattleAction = {
  key: number;
  type: BattleUiEvent;
  label: string;
  detail?: string;
  danger?: boolean;
  targetId?: string;
  attackerId?: string;
  damage?: number;
  blocked?: boolean;
};

type DropPoint = { x: number; y: number };
type FighterDropTarget = DropPoint & {
  id: string;
  side: "own" | "enemy";
  width: number;
  height: number;
};

type BattleLayout = {
  rootPad: number;
  topH: number;
  boardH: number;
  rowH: number;
  centerH: number;
  bottomH: number;
  fieldCardW: number;
  handCardW: number;
  duelSlot: number;
  duelCardW: number;
  effectCardW: number;
};

const PLAYER_TONES = [
  {
    accent: COLORS.accent,
    glow: "rgba(52,225,255,.42)",
    panel: "rgba(10,42,64,.78)",
    border: "rgba(52,225,255,.48)",
  },
  {
    accent: COLORS.primary,
    glow: "rgba(255,61,180,.42)",
    panel: "rgba(64,18,58,.78)",
    border: "rgba(255,61,180,.48)",
  },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function battleLayout(width: number, height: number): BattleLayout {
  const portrait = height >= width;
  const rootPad = clamp(height * 0.016, 5, 8);
  const gap = 5;
  const topH = portrait ? clamp(height * 0.095, 54, 74) : clamp(height * 0.10, 36, 44);
  const bottomH = portrait ? clamp(height * 0.22, 150, 190) : clamp(height * 0.27, 96, 124);
  const boardH = Math.max(200, height - rootPad * 2 - gap * 2 - topH - bottomH);
  const centerH = portrait ? clamp(boardH * 0.16, 50, 68) : clamp(boardH * 0.20, 42, 60);
  const rowH = Math.max(portrait ? 150 : 62, (boardH - centerH) / 2);
  const availableTeamW = width - rootPad * 2 - 34;
  const maxCardByRow = Math.max(42, (rowH - 24) / CARD_ASPECT);
  const fieldCardW = portrait
    ? clamp(Math.min(availableTeamW / 3.45, maxCardByRow), 64, 94)
    : clamp(Math.min(availableTeamW / 3.7, maxCardByRow), 42, 62);
  const handCardW = portrait ? clamp((bottomH - 58) / CARD_ASPECT, 50, 76) : clamp((bottomH - 45) / CARD_ASPECT, 42, 66);
  const duelSlot = clamp(centerH - 10, 40, 62);

  return {
    rootPad,
    topH,
    boardH,
    rowH,
    centerH,
    bottomH,
    fieldCardW,
    handCardW,
    duelSlot,
    duelCardW: clamp(duelSlot / CARD_ASPECT, 22, 34),
    effectCardW: clamp((duelSlot - 6) / CARD_ASPECT, 20, 30),
  };
}

function HpBar({ current, max, tall = false, color }: { current: number; max: number; tall?: boolean; color?: string }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? current / max : 0));
  const fillColor = color ?? (pct > 0.5 ? COLORS.greenSoft : pct > 0.25 ? COLORS.gold : COLORS.red);
  return (
    <View style={[hpStyles.track, tall && hpStyles.trackTall]}>
      <View style={[hpStyles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const EFFECT_STATS = ["hp", "atk", "def", "lck", "spd"] as const;

function activeEffectBadges(fighter: BattleFighter) {
  const buffs = fighter.buffs as Record<string, number | undefined>;
  return EFFECT_STATS.map((stat) => ({ stat, value: buffs?.[stat] ?? 0 }))
    .filter((badge) => badge.value !== 0)
    .map((badge) => ({
      ...badge,
      label: `${badge.value > 0 ? "+" : ""}${badge.value} ${badge.stat.toUpperCase()}`,
      debuff: badge.value < 0,
    }));
}

function DraggableAction({
  disabled,
  onTap,
  onDrop,
  style,
  children,
}: {
  disabled?: boolean;
  onTap: () => void;
  onDrop: (point: DropPoint) => void;
  style?: any;
  children: React.ReactNode;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const moved = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_, gesture) => !disabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          moved.current = false;
        },
        onPanResponderMove: (_, gesture) => {
          moved.current = moved.current || Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8;
          x.value = gesture.dx;
          y.value = gesture.dy;
        },
        onPanResponderRelease: (_, gesture) => {
          const distance = Math.hypot(gesture.dx, gesture.dy);
          x.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
          y.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
          if (distance > 32) onDrop({ x: gesture.moveX, y: gesture.moveY });
          else onTap();
        },
        onPanResponderTerminate: () => {
          x.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
          y.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
        },
      }),
    [disabled, onDrop, onTap, x, y]
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: x.value || y.value ? 1.06 : 1 }],
    zIndex: x.value || y.value ? 20 : 1,
  }));

  return (
    <Animated.View {...panResponder.panHandlers} style={[style, dragStyle]}>
      {children}
    </Animated.View>
  );
}

function FighterTile({
  fighter,
  selected,
  side,
  layout,
  spent,
  dimmed,
  taunting,
  lockedByTaunt,
  impactRole,
  impactKey,
  targetState,
  damageEvent,
  onDragAttack,
  onMeasure,
  onPress,
}: {
  fighter: BattleFighter;
  selected: boolean;
  side: "own" | "enemy";
  layout: BattleLayout;
  spent?: boolean;
  dimmed?: boolean;
  taunting?: boolean;
  lockedByTaunt?: boolean;
  impactRole?: "attacker" | "receiver" | null;
  impactKey?: number | null;
  targetState?: "valid" | "invalid" | null;
  damageEvent?: BattleAction | null;
  onDragAttack?: (point: DropPoint) => void;
  onMeasure?: (target: FighterDropTarget) => void;
  onPress: () => void;
}) {
  const cardRef = useRef<View>(null);
  const dead = !fighter.alive;
  const rarity = fighterRarity((fighter as any).bonus_intensidade ?? 1);
  const rarityColor = RARITY_COLORS[rarity];
  const pulse = useSharedValue(0);
  const hit = useSharedValue(0);
  const tauntPulse = useSharedValue(0);
  const cardH = Math.round(layout.fieldCardW * CARD_ASPECT);
  const hpPct = Math.max(0, Math.min(1, fighter.max_hp > 0 ? fighter.current_hp / fighter.max_hp : 0));
  const effectBadges = activeEffectBadges(fighter);
  const hasBuff = effectBadges.some((badge) => !badge.debuff);
  const hasDebuff = effectBadges.some((badge) => badge.debuff);
  const hitText = damageEvent?.targetId === fighter.id
    ? damageEvent.blocked
      ? "ESCUDO"
      : damageEvent.damage
        ? `-${damageEvent.damage}`
        : "0"
    : "HIT";
  const life = useSharedValue(hpPct);
  const damageRise = useSharedValue(0);
  const rarePulse = useSharedValue(0);

  function measureTarget() {
    cardRef.current?.measureInWindow((x, y, targetWidth, targetHeight) => {
      onMeasure?.({ id: fighter.id, side, x, y, width: targetWidth, height: targetHeight });
    });
  }

  useEffect(() => {
    if (!selected || dead) {
      pulse.value = withTiming(0, { duration: 160 });
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 820, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [dead, pulse, selected]);

  useEffect(() => {
    if (!impactRole || !impactKey || dead) return;
    hit.value = 0;
    if (impactRole === "attacker") {
      hit.value = withSequence(
        withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
        withDelay(260, withTiming(0, { duration: 720, easing: Easing.inOut(Easing.cubic) }))
      );
      return;
    }
    hit.value = withSequence(
      withDelay(220, withTiming(1, { duration: 130 })),
      withTiming(-1, { duration: 130 }),
      withTiming(1, { duration: 120 }),
      withTiming(-1, { duration: 120 }),
      withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) })
    );
  }, [dead, hit, impactKey, impactRole]);

  useEffect(() => {
    life.value = withTiming(hpPct, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [hpPct, life]);

  useEffect(() => {
    if (!damageEvent || damageEvent.targetId !== fighter.id || !damageEvent.damage) return;
    damageRise.value = 0;
    // Fica parado e totalmente visivel ~1s, depois sobe e some. Legibilidade primeiro.
    damageRise.value = withDelay(1000, withTiming(1, { duration: 560, easing: Easing.in(Easing.cubic) }));
  }, [damageEvent, damageRise, fighter.id]);

  useEffect(() => {
    if (rarity !== "raro") return;
    rarePulse.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [rarePulse, rarity]);

  useEffect(() => {
    if (!taunting) {
      tauntPulse.value = withTiming(0, { duration: 200 });
      return;
    }
    tauntPulse.value = withRepeat(withTiming(1, { duration: 760, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [taunting, tauntPulse]);

  const glowStyle = useAnimatedStyle(() => {
    const selScale = selected ? 0.14 + pulse.value * 0.04 : pulse.value * 0.025;
    const selLift = selected ? (side === "own" ? -10 : 8) : 0;
    return {
      transform: [
        { scale: 1 + selScale - (impactRole === "receiver" ? Math.abs(hit.value) * 0.05 : 0) },
        {
          translateY:
            selLift +
            (impactRole === "attacker"
              ? -hit.value * 22
              : impactRole === "receiver"
                ? -Math.abs(hit.value) * 9
                : 0),
        },
        { translateX: impactRole === "receiver" ? hit.value * 14 : 0 },
      ],
      zIndex: selected ? 40 : 1,
      shadowOpacity: selected ? 0.6 + pulse.value * 0.4 : 0.1,
    };
  });

  const selectionRingStyle = useAnimatedStyle(() => ({
    opacity: selected ? 0.55 + pulse.value * 0.45 : 0,
    transform: [{ scale: 1 + pulse.value * 0.05 }],
  }));

  const tauntRingStyle = useAnimatedStyle(() => ({
    opacity: taunting ? 0.6 + tauntPulse.value * 0.4 : 0,
    transform: [{ scale: 1 + tauntPulse.value * 0.04 }],
  }));

  const hitFlashStyle = useAnimatedStyle(() => ({
    opacity: impactRole === "receiver" ? Math.abs(hit.value) * 0.65 : 0,
    transform: [{ scale: 0.92 + Math.abs(hit.value) * 0.16 }],
  }));

  const attackLiftStyle = useAnimatedStyle(() => ({
    opacity: impactRole === "attacker" ? hit.value * 0.9 : 0,
    transform: [{ translateY: 8 - hit.value * 18 }, { scale: 0.7 + hit.value * 0.5 }],
  }));

  const lifeFillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(life.value * 100)}%`,
  }));

  const damageStyle = useAnimatedStyle(() => ({
    opacity: damageEvent?.targetId === fighter.id && damageEvent?.damage ? 1 - damageRise.value : 0,
    transform: [{ translateY: -damageRise.value * 34 }, { scale: 1.05 - damageRise.value * 0.15 }],
  }));

  const rarityStyle = useAnimatedStyle(() => ({
    shadowOpacity: rarity === "raro" ? 0.32 + rarePulse.value * 0.28 : rarity === "incomum" ? 0.28 : 0.1,
  }));

  return (
    <Animated.View entering={side === "own" ? FadeInUp.delay(80) : FadeInDown.delay(80)}>
      <Animated.View style={[glowStyle, rarityStyle]}>
      <View ref={cardRef} collapsable={false} onLayout={measureTarget}>
      <DraggableAction
        disabled={dead}
        onTap={onPress}
        onDrop={onDragAttack ?? onPress}
        style={[
          fighterStyles.fieldCardHit,
          { width: layout.fieldCardW, height: cardH + 18 },
          side === "enemy" && fighterStyles.enemyCard,
          selected && fighterStyles.selected,
          targetState === "valid" && fighterStyles.validTarget,
          targetState === "invalid" && fighterStyles.invalidTarget,
          rarity === "incomum" && fighterStyles.uncommonField,
          rarity === "raro" && fighterStyles.rareField,
          spent && !dead && fighterStyles.spent,
          dimmed && !selected && !dead && fighterStyles.dimmed,
          lockedByTaunt && !dead && fighterStyles.lockedTarget,
          dead && fighterStyles.dead,
          {
            borderColor: selected
              ? rarityColor
              : taunting
                ? COLORS.gold
                : hasDebuff
                  ? "rgba(255,77,109,.9)"
                  : hasBuff
                    ? "rgba(134,239,172,.9)"
                    : "rgba(234,242,255,.16)",
            borderWidth: taunting || hasDebuff || hasBuff ? (taunting ? 3 : 2) : 1,
            shadowColor: taunting ? COLORS.gold : hasDebuff ? COLORS.red : hasBuff ? COLORS.greenSoft : rarityColor,
          },
        ]}
      >
        <GameCard data={fighterToCardData(fighter)} width={layout.fieldCardW} glow={selected} />
        {selected ? (
          <Animated.View
            pointerEvents="none"
            style={[fighterStyles.selectionRing, { borderColor: rarityColor, shadowColor: rarityColor }, selectionRingStyle]}
          />
        ) : null}
        {taunting && !selected ? (
          <Animated.View
            pointerEvents="none"
            style={[fighterStyles.selectionRing, { borderColor: COLORS.gold, shadowColor: COLORS.gold }, tauntRingStyle]}
          />
        ) : null}
        {fighter.shield_active ? <View pointerEvents="none" style={fighterStyles.shieldBubble} /> : null}
        {fighter.poison?.turns ? <Text pointerEvents="none" style={fighterStyles.poisonFx}>☠</Text> : null}
        <Animated.View pointerEvents="none" style={[fighterStyles.attackLift, { borderColor: rarityColor, shadowColor: rarityColor }, attackLiftStyle]}>
          <Text style={fighterStyles.attackLiftText}>GOLPE</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[fighterStyles.hitFlash, hitFlashStyle]}>
          <Text style={fighterStyles.hitFlashText}>{hitText}</Text>
        </Animated.View>
        {effectBadges.length ? (
          <View pointerEvents="none" style={fighterStyles.effectBadges}>
            {effectBadges.slice(0, 4).map((badge) => (
              <View key={badge.stat} style={[fighterStyles.effectBadge, badge.debuff ? fighterStyles.effectBadgeDebuff : fighterStyles.effectBadgeBuff]}>
                <Text style={fighterStyles.effectBadgeText} numberOfLines={1} adjustsFontSizeToFit>
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View pointerEvents="none" style={fighterStyles.cardLifeStrip}>
          <View style={fighterStyles.cardLifeTop}>
            <Text style={fighterStyles.cardLifeLabel}>HP</Text>
            <Text style={fighterStyles.cardLifeValue} numberOfLines={1} adjustsFontSizeToFit>
              {fighter.current_hp}/{fighter.max_hp}
            </Text>
          </View>
          <View style={fighterStyles.cardLifeTrack}>
            <Animated.View style={[fighterStyles.cardLifeFill, lifeFillStyle]} />
          </View>
        </View>
        {hasBuff || hasDebuff ? (
          <View pointerEvents="none" style={[fighterStyles.stateChip, hasDebuff ? fighterStyles.stateChipDebuff : fighterStyles.stateChipBuff]}>
            <Text style={fighterStyles.stateChipText} numberOfLines={1}>
              {hasDebuff ? "DEBUFF ▼" : "BUFF ▲"}
            </Text>
          </View>
        ) : null}
        <View pointerEvents="none" style={fighterStyles.abilityRow}>
          {fighter.ability === "provocar" ? <Text style={fighterStyles.abilityIcon}>🛡️</Text> : null}
          {fighter.ability === "escudo" ? <Text style={fighterStyles.abilityIcon}>✨</Text> : null}
          {fighter.ability === "veneno" ? <Text style={fighterStyles.abilityIcon}>☠️</Text> : null}
        </View>
        <Animated.Text pointerEvents="none" style={[fighterStyles.damageNumber, damageStyle]}>
          -{damageEvent?.targetId === fighter.id ? damageEvent.damage : 0}
        </Animated.Text>
        {taunting && !dead ? (
          <View pointerEvents="none" style={fighterStyles.tauntBadge}>
            <Text style={fighterStyles.tauntBadgeText} numberOfLines={1}>🛡 PROVOCANDO</Text>
          </View>
        ) : null}
        {lockedByTaunt && !dead ? (
          <View pointerEvents="none" style={fighterStyles.lockBadge}>
            <Text style={fighterStyles.lockBadgeText}>🔒</Text>
          </View>
        ) : null}
        {dead ? <Text style={fighterStyles.deadLabel}>FORA</Text> : null}
        {spent && !dead ? (
          <View pointerEvents="none" style={fighterStyles.spentBadge}>
            <Text style={fighterStyles.spentText}>⚔ USADO</Text>
          </View>
        ) : null}
      </DraggableAction>
      </View>
      </Animated.View>
    </Animated.View>
  );
}

function TeamPanel({
  label,
  player,
  side,
  tone,
  selectedId,
  attackerId,
  receiverId,
  impactKey,
  damageEvent,
  validTargetSide,
  activeSide,
  layout,
  onSelect,
  onDragFighter,
  onMeasureFighter,
}: {
  label: string;
  player: BattlePlayer;
  side: "own" | "enemy";
  tone: typeof PLAYER_TONES[number];
  selectedId: string | null;
  attackerId?: string | null;
  receiverId?: string | null;
  impactKey?: number | null;
  damageEvent?: BattleAction | null;
  validTargetSide?: "own" | "enemy" | null;
  activeSide?: boolean;
  layout: BattleLayout;
  onSelect: (id: string) => void;
  onDragFighter?: (id: string, point: DropPoint) => void;
  onMeasureFighter?: (target: FighterDropTarget) => void;
}) {
  return (
    <View
      style={[
        arenaStyles.teamPanel,
        { height: layout.rowH },
        activeSide
          ? { borderColor: tone.border, shadowColor: tone.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }
          : arenaStyles.inactiveTeamPanel,
      ]}
    >
      <Text style={[arenaStyles.fieldLabel, { color: tone.accent, borderColor: tone.border }]} numberOfLines={1}>
        {activeSide ? "▸ " : ""}{label}: {player.name}
      </Text>
      <View style={arenaStyles.teamSlots}>
        {(() => {
          const tauntActive = side === "enemy" && player.fighters.some((f) => f.alive && f.ability === "provocar");
          return player.fighters.map((fighter) => (
          <FighterTile
            key={fighter.id}
            fighter={fighter}
            side={side}
            layout={layout}
            spent={side === "own" && Boolean(fighter.attacked)}
            dimmed={Boolean(selectedId) && selectedId !== fighter.id}
            taunting={side === "enemy" && fighter.alive && fighter.ability === "provocar"}
            lockedByTaunt={tauntActive && fighter.alive && fighter.ability !== "provocar"}
            selected={selectedId === fighter.id}
            impactRole={
              impactKey && attackerId === fighter.id
                ? "attacker"
                : impactKey && receiverId === fighter.id
                  ? "receiver"
                  : null
            }
            impactKey={impactKey}
            damageEvent={damageEvent}
            targetState={validTargetSide ? (validTargetSide === side ? "valid" : "invalid") : null}
            onPress={() => onSelect(fighter.id)}
            onDragAttack={onDragFighter ? (point) => onDragFighter(fighter.id, point) : undefined}
            onMeasure={onMeasureFighter}
          />
          ));
        })()}
      </View>
    </View>
  );
}

function TurnIndicator({
  playerName,
  tone,
}: {
  playerName: string;
  tone: typeof PLAYER_TONES[number];
}) {
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 980, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 4600, easing: Easing.linear }), -1, false);
  }, [pulse, spin, playerName]);

  const aura = useAnimatedStyle(() => ({
    opacity: 0.36 + pulse.value * 0.34,
    transform: [{ scale: 0.92 + pulse.value * 0.1 }],
  }));

  const orbit = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <View style={arenaStyles.turnWrap}>
      <Animated.View style={[arenaStyles.turnAura, { backgroundColor: tone.glow, shadowColor: tone.accent }, aura]} />
      <Animated.View style={[arenaStyles.turnOrbit, { borderColor: tone.accent }, orbit]} />
      <View style={[arenaStyles.turnCore, { borderColor: tone.border, backgroundColor: tone.panel, shadowColor: tone.accent }]}>
        <Text style={[arenaStyles.turnKicker, { color: tone.accent }]}>VEZ DE</Text>
        <Text style={arenaStyles.turnName} numberOfLines={1} adjustsFontSizeToFit>{playerName}</Text>
      </View>
    </View>
  );
}

function FanCard({
  index,
  count,
  selected,
  disabled,
  playable,
  cost,
  onPress,
  onDrop,
  children,
}: {
  index: number;
  count: number;
  selected: boolean;
  disabled?: boolean;
  playable: boolean;
  cost: number;
  onPress: () => void;
  onDrop: (point: DropPoint) => void;
  children: React.ReactNode;
}) {
  const center = (count - 1) / 2;
  const offset = index - center;
  const rotate = selected ? 0 : offset * 5;
  const translateY = Math.abs(offset) * 5 - (selected ? 34 : 0);

  return (
    <Animated.View entering={FadeInDown.delay(index * 35).springify().damping(15)} style={[{ marginLeft: index === 0 ? 0 : -18 }, selected && { zIndex: 40 }]}>
      <DraggableAction
        disabled={disabled}
        onTap={onPress}
        onDrop={onDrop}
        style={[
          handStyles.realCardHit,
          selected && handStyles.selectedRealCard,
          playable && handStyles.playableRealCard,
          disabled && handStyles.used,
          { transform: [{ rotate: `${rotate}deg` }, { translateY }, { scale: selected ? 1.16 : 1 }] },
        ]}
      >
        {children}
        <View pointerEvents="none" style={handStyles.costBadge}>
          <Text style={handStyles.costText}>{cost}</Text>
        </View>
      </DraggableAction>
    </Animated.View>
  );
}

function HandFan({
  cards,
  cardWidth,
  selectedCardId,
  onSelectCard,
  onUseCard,
  player,
}: {
  cards: BattleCard[];
  cardWidth: number;
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onUseCard: (id: string, point: DropPoint) => void;
  player: BattlePlayer;
}) {
  const count = cards.length;
  return (
    <View style={handStyles.fanWrap}>
      <View style={handStyles.fanRow}>
        {cards.map((card, index) => (
          (() => {
            const playable = !card.used && canAffordCard(player, card);
            return (
          <FanCard
            key={card.id}
            index={index}
            count={count}
            selected={selectedCardId === card.id}
            disabled={!playable}
            playable={playable}
            cost={card.cost ?? cardEnergyCost(card)}
            onPress={() => onSelectCard(card.id)}
            onDrop={(point) => onUseCard(card.id, point)}
          >
            <GameCard data={effectCardToCardData(card)} width={cardWidth} glow={false} />
            <View
              pointerEvents="none"
              style={[handStyles.kindBadge, card.polaridade === "DEBUFF" ? handStyles.debuffBadge : handStyles.buffBadge]}
            >
              <Text style={handStyles.kindText}>{card.polaridade === "DEBUFF" ? "DEBUFF INIMIGO" : "BUFF ALIADO"}</Text>
            </View>
          </FanCard>
            );
          })()
        ))}
        {count === 0 ? (
          <Text style={handStyles.empty}>A compra entra automaticamente na mao.</Text>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  variant = "base",
  disabled,
  suggest,
  suggestColor,
  onPress,
}: {
  label: string;
  variant?: "base" | "attack" | "card" | "ghost";
  disabled?: boolean;
  suggest?: boolean;
  suggestColor?: string;
  onPress: () => void;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!suggest || disabled) {
      pulse.value = withTiming(0, { duration: 180 });
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [disabled, pulse, suggest]);

  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: suggestColor ?? "rgba(234,242,255,.18)",
    shadowColor: suggestColor ?? COLORS.accent,
    shadowOpacity: suggest ? 0.25 + pulse.value * 0.55 : 0,
    shadowRadius: suggest ? 10 + pulse.value * 12 : 0,
    transform: [{ scale: suggest ? 1 + pulse.value * 0.025 : 1 }],
  }));

  return (
    <PressableScale
      haptic={disabled ? null : variant === "attack" ? "reveal" : "tap"}
      disabled={disabled}
      onPress={onPress}
      style={[actionStyles.button, actionStyles[variant], pulseStyle, disabled && actionStyles.disabled]}
    >
      <Text style={[actionStyles.text, variant === "attack" && actionStyles.attackText]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </PressableScale>
  );
}

function ImpactOverlay({ event }: { event: BattleAction | null }) {
  const progress = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!event) return;
    progress.value = 0;
    drift.value = 0;
    progress.value = withSequence(
      withTiming(1, { duration: event.type === "attack" ? 720 : 420, easing: Easing.out(Easing.cubic) }),
      withDelay(event.type === "attack" ? 420 : 0, withTiming(0, { duration: event.type === "attack" ? 760 : 360, easing: Easing.in(Easing.cubic) }))
    );
    drift.value = withTiming(1, { duration: event.type === "attack" ? 1350 : 760, easing: Easing.out(Easing.cubic) });
  }, [drift, event, progress]);

  const ring = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.35 + progress.value * 2.4 }],
  }));

  const flash = useAnimatedStyle(() => ({
    opacity: progress.value * (event?.type === "attack" ? 0.14 : 0.12),
  }));

  const cinema = useAnimatedStyle(() => ({
    opacity: event?.type === "attack" ? progress.value : 0,
    transform: [{ scaleY: 0.72 + progress.value * 0.28 }],
  }));

  const slash = useAnimatedStyle(() => ({
    opacity: event?.type === "attack" ? progress.value : 0,
    transform: [
      { rotate: "-18deg" },
      { scaleX: 0.16 + drift.value * 1.72 },
      { translateX: -120 + drift.value * 240 },
    ],
  }));

  const shockwave = useAnimatedStyle(() => ({
    opacity: event?.type === "attack" ? progress.value * 0.82 : 0,
    transform: [{ scale: 0.26 + drift.value * 3.1 }, { rotate: `${drift.value * 28}deg` }],
  }));

  const cardBurst = useAnimatedStyle(() => ({
    opacity: event?.type === "card" || event?.type === "draw" ? progress.value : 0,
    transform: [
      { translateY: 28 - drift.value * 62 },
      { scale: 0.72 + progress.value * 0.5 },
      { rotate: `${-8 + drift.value * 16}deg` },
    ],
  }));

  const turnSweep = useAnimatedStyle(() => ({
    opacity: event?.type === "pass" ? progress.value : 0,
    transform: [{ translateX: -220 + drift.value * 440 }],
  }));

  const selectPing = useAnimatedStyle(() => ({
    opacity: event?.type === "select" ? progress.value : 0,
    transform: [{ scale: 0.55 + drift.value * 1.6 }],
  }));

  if (!event || (event.type !== "attack" && event.type !== "card")) return null;

  const color = event.type === "attack" ? COLORS.red : event.type === "card" ? COLORS.accent : COLORS.gold;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color }, flash]} />
      <Animated.View style={[arenaStyles.cinemaBarTop, cinema]} />
      <Animated.View style={[arenaStyles.cinemaBarBottom, cinema]} />
      <Animated.View style={[arenaStyles.impactRing, { borderColor: color, shadowColor: color }, ring]} />
      <Animated.View style={[arenaStyles.attackShockwave, { borderColor: COLORS.gold, shadowColor: COLORS.red }, shockwave]} />
      <Animated.View style={[arenaStyles.attackSlash, { backgroundColor: COLORS.red, shadowColor: COLORS.red }, slash]} />
      <Animated.View style={[arenaStyles.attackSlash, arenaStyles.attackSlashThin, { backgroundColor: COLORS.gold, shadowColor: COLORS.gold }, slash]} />
      <Animated.View style={[arenaStyles.cardBurst, { borderColor: color, shadowColor: color }, cardBurst]}>
        <Text style={[arenaStyles.cardBurstText, { color }]}>ARC</Text>
      </Animated.View>
      <Animated.View style={[arenaStyles.turnSweep, { backgroundColor: color, shadowColor: color }, turnSweep]} />
      <Animated.View style={[arenaStyles.selectPing, { borderColor: color, shadowColor: color }, selectPing]} />
    </View>
  );
}

function FloatingEvent({ event, latestLog }: { event: BattleAction | null; latestLog: string }) {
  const y = useSharedValue(10);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!event) return;
    y.value = 16;
    opacity.value = 0;
    y.value = withSequence(
      withTiming(event.type === "attack" ? -10 : -6, { duration: event.type === "attack" ? 360 : 220 }),
      withDelay(event.type === "attack" ? 2400 : 1100, withTiming(event.type === "attack" ? -28 : -18, { duration: 300 }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: event.type === "attack" ? 220 : 160 }),
      withDelay(event.type === "attack" ? 2600 : 1180, withTiming(0, { duration: 300 }))
    );
  }, [event, opacity, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  if (!event || (event.type !== "attack" && event.type !== "card")) return null;
  const attack = event.type === "attack";
  const detail = event.detail ?? latestLog;

  return (
    <Animated.View pointerEvents="none" style={[arenaStyles.floatingEvent, attack && arenaStyles.floatingEventAttack, event.danger && arenaStyles.floatingEventDanger, style]}>
      <Text style={[arenaStyles.floatingTitle, attack && arenaStyles.floatingTitleAttack, event.danger && arenaStyles.floatingTitleDanger]} numberOfLines={1} adjustsFontSizeToFit>
        {event.label}
      </Text>
      <Text style={[arenaStyles.floatingLog, attack && arenaStyles.floatingLogAttack]} numberOfLines={attack ? 3 : 2}>
        {detail}
      </Text>
    </Animated.View>
  );
}

function RotateGate() {
  return (
    <View style={setupStyles.center}>
      <StatusBar hidden />
      <ArenaBackground />
      <View style={setupStyles.rotateCard}>
        <Text style={setupStyles.rotateIcon}>[ ]</Text>
        <Text style={setupStyles.title}>Vire o celular</Text>
        <Text style={setupStyles.subtitle}>A arena foi feita para jogar com a tela de lado.</Text>
      </View>
    </View>
  );
}

function SetupShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={setupStyles.center}>
      <StatusBar style="light" />
      <ArenaBackground />
      <Animated.View entering={FadeInUp.springify().damping(16)} style={setupStyles.panel}>
        {children}
      </Animated.View>
      <BottomNav />
    </View>
  );
}

export default function BattleScreen() {
  const { battleRequirements, fighters, cards } = useInventory();
  const b = useBattle();
  const { width, height } = useWindowDimensions();
  const layout = useMemo(() => battleLayout(width, height), [height, width]);
  const [p1, setP1] = useState("Jogador 1");
  const [p2, setP2] = useState("Jogador 2");
  const [event, setEvent] = useState<BattleAction | null>(null);
  const [logExpanded, setLogExpanded] = useState(false);
  const dropTargets = useRef<Record<string, FighterDropTarget>>({});

  const latestLog = b.battle?.log?.[b.battle.log.length - 1] ?? "";

  function rememberDropTarget(target: FighterDropTarget) {
    dropTargets.current[target.id] = target;
  }

  function targetAt(point: DropPoint, side?: "own" | "enemy") {
    return Object.values(dropTargets.current).find((target) => {
      if (side && target.side !== side) return false;
      return point.x >= target.x && point.x <= target.x + target.width && point.y >= target.y && point.y <= target.y + target.height;
    });
  }

  function markEvent(type: BattleUiEvent, label: string, detail?: string, danger = false, extra?: Partial<BattleAction>) {
    setEvent({ key: Date.now(), type, label, detail, danger, ...extra });
  }

  function markAttackEvent(result?: ActionResult) {
    if (!result?.ok) {
      markEvent("card", "ACAO BLOQUEADA", result?.message ?? "Escolha atacante e alvo", true);
      return;
    }
    if (result.miss) {
      markEvent("attack", result.missName ?? "Vacilou feio", "VACILO", true, {
        targetId: result.targetId,
        attackerId: result.attackerId,
        damage: 0,
      });
      return;
    }
    markEvent("attack", result.blocked ? "Escudo ativado" : result.moveName ?? "Ataque certeiro", result.blocked ? "Ataque bloqueado" : `${result.damage ?? 0} de dano em ${result.targetName ?? "alvo"}`, false, {
      targetId: result.targetId,
      attackerId: result.attackerId,
      damage: result.damage,
      blocked: result.blocked,
    });
  }

  function markCardEvent(result?: ActionResult) {
    if (!result?.ok) {
      markEvent("card", "CARTA NAO USADA", result?.message ?? "Escolha uma carta e um alvo", true);
      return;
    }
    const value = result.value ?? 0;
    const sign = value > 0 ? "+" : "";
    const attr = (result.attr ?? "EFEITO").toUpperCase();
    markEvent("card", result.isDebuff ? "DEBUFF!" : "BUFF!", `${sign}${value} ${attr} em ${result.targetName ?? "alvo"}`, Boolean(result.isDebuff));
  }

  if (!battleRequirements.canBattle) {
    return (
      <SetupShell>
        <Text style={setupStyles.eyebrow}>ARENA FECHADA</Text>
        <Text style={setupStyles.title}>Batalha bloqueada</Text>
        <Text style={setupStyles.subtitle}>Precisa de {battleRequirements.minFighters} fighters e {battleRequirements.minCards} cartas.</Text>
        <View style={setupStyles.reqGrid}>
          <Text style={setupStyles.reqText}>Fighters {battleRequirements.fighterCount}/{battleRequirements.minFighters}</Text>
          <Text style={setupStyles.reqText}>Cartas {battleRequirements.cardCount}/{battleRequirements.minCards}</Text>
        </View>
        <Link href="/camera" asChild>
          <PressableScale style={setupStyles.primary}><Text style={setupStyles.primaryText}>Criar fighter</Text></PressableScale>
        </Link>
        <Link href="/inventory" asChild>
          <PressableScale style={setupStyles.secondary}><Text style={setupStyles.secondaryText}>Ver inventario</Text></PressableScale>
        </Link>
      </SetupShell>
    );
  }

  if (b.winner) {
    const winner = b.winner as BattlePlayer | { name: string };
    const winnerIndex = b.battle?.players.findIndex((player) => player.name === winner.name) ?? 0;
    const elapsedSeconds = b.battle?.startedAt ? Math.max(1, Math.round((Date.now() - b.battle.startedAt) / 1000)) : 0;
    const totalDamage = b.battle?.stats.damageByPlayer[winnerIndex >= 0 ? winnerIndex : 0] ?? 0;
    return (
      <SetupShell>
        <Text style={setupStyles.eyebrow}>RESULTADO</Text>
        <Text style={[setupStyles.title, { color: winnerIndex === 1 ? PLAYER_TONES[1].accent : PLAYER_TONES[0].accent }]}>Vitória</Text>
        <Text style={setupStyles.subtitle}>{winner.name} venceu a partida.</Text>
        <View style={setupStyles.resultGrid}>
          <Text style={setupStyles.resultLine}>Dano total causado: {totalDamage}</Text>
          <Text style={setupStyles.resultLine}>Cartas eliminadas: {b.battle?.stats.cardsEliminated ?? 0}</Text>
          <Text style={setupStyles.resultLine}>Duração: {elapsedSeconds}s</Text>
        </View>
        <PressableScale haptic="success" style={setupStyles.primary} onPress={b.reset}>
          <Text style={setupStyles.primaryText}>Jogar de novo</Text>
        </PressableScale>
        <Link href="/" asChild>
          <PressableScale style={setupStyles.secondary}><Text style={setupStyles.secondaryText}>Voltar ao menu</Text></PressableScale>
        </Link>
      </SetupShell>
    );
  }

  if (!b.battle) {
    return (
      <SetupShell>
        <Text style={setupStyles.eyebrow}>DUELO LOCAL</Text>
        <Text style={setupStyles.title}>Arena SnapQuest</Text>
        <Text style={setupStyles.subtitle}>Dois jogadores, um celular, tela de lado na hora da luta.</Text>
        <View style={setupStyles.inputGroup}>
          <Text style={setupStyles.label}>Jogador 1</Text>
          <TextInput value={p1} onChangeText={setP1} style={setupStyles.input} placeholderTextColor="rgba(234,242,255,.45)" selectTextOnFocus />
          <Text style={setupStyles.label}>Jogador 2</Text>
          <TextInput value={p2} onChangeText={setP2} style={setupStyles.input} placeholderTextColor="rgba(234,242,255,.45)" selectTextOnFocus />
        </View>
        <PressableScale
          haptic="reveal"
          style={setupStyles.primary}
          onPress={() => b.start(fighters, cards, p1.trim() || "Jogador 1", p2.trim() || "Jogador 2")}
        >
          <Text style={setupStyles.primaryText}>Iniciar batalha</Text>
        </PressableScale>
      </SetupShell>
    );
  }

  const cur = b.curPlayer!;
  const foe = b.foePlayer!;
  const guidance = b.guidance;
  const curTone = PLAYER_TONES[b.battle.turn];
  const foeTone = PLAYER_TONES[b.battle.turn === 0 ? 1 : 0];
  const attackImpactKey = event?.type === "attack" ? event.key : null;
  const selectedCard = cur.hand.find((card) => card.id === b.battle?.selectedCardId && !card.used);
  const validTargetSide = selectedCard ? (selectedCard.polaridade === "DEBUFF" ? "enemy" : "own") : b.battle.selectedOwnId ? "enemy" : null;
  const hasAffordableCard = cur.hand.some((card) => !card.used && canAffordCard(cur, card));
  const hasAttacked = cur.attacked_this_turn;
  const battleHint = selectedCard
    ? selectedCard.polaridade === "DEBUFF"
      ? "Toque ou arraste esta carta em um inimigo."
      : "Toque ou arraste esta carta em um aliado."
    : hasAttacked
      ? hasAffordableCard
        ? "Ataque usado. Jogue uma carta ou encerre o turno."
        : "Ataque usado. Encerre o turno."
      : b.battle.selectedOwnId
        ? "Toque no inimigo para atacar agora."
        : "Toque no seu fighter atacante, depois toque no inimigo.";
  const nextTurnName = cur.name;

  return (
    <View style={[arenaStyles.root, { padding: layout.rootPad }]}>
      <StatusBar hidden />
      <ArenaBackground />
      <ImpactOverlay event={event} />
      <FloatingEvent event={event} latestLog={latestLog} />

      <Animated.View entering={FadeInDown.duration(260)} style={[arenaStyles.topHud, { height: layout.topH }]}>
        <View style={[arenaStyles.playerScore, { borderColor: curTone.border, backgroundColor: curTone.panel, shadowColor: curTone.accent }]}>
          <Text style={arenaStyles.scoreName} numberOfLines={1}>{cur.name}</Text>
          <Text style={[arenaStyles.energyText, { color: curTone.accent }]}>Energia {cur.energy}/{cur.max_energy}</Text>
          <HpBar current={totalHp(cur)} max={cur.fighters.reduce((sum, fighter) => sum + fighter.max_hp, 0)} tall color={COLORS.red} />
        </View>
        <View style={arenaStyles.phasePill}>
          <Text style={arenaStyles.phaseText}>{guidance?.phase ?? "Arena"}</Text>
          <Text style={arenaStyles.phaseHint} numberOfLines={2}>{battleHint}</Text>
        </View>
        <View style={[arenaStyles.playerScore, arenaStyles.enemyScore, { borderColor: foeTone.border, backgroundColor: foeTone.panel, shadowColor: foeTone.accent }]}>
          <Text style={arenaStyles.scoreName} numberOfLines={1}>{foe.name}</Text>
          <Text style={[arenaStyles.energyText, { color: foeTone.accent }]}>Energia {foe.energy}/{foe.max_energy}</Text>
          <HpBar current={totalHp(foe)} max={foe.fighters.reduce((sum, fighter) => sum + fighter.max_hp, 0)} tall color={COLORS.red} />
        </View>
      </Animated.View>

      <View style={[arenaStyles.stage, { height: layout.boardH }]}>
        <View style={arenaStyles.boardGridBg} pointerEvents="none">
          <View style={arenaStyles.boardLine} />
          <View style={[arenaStyles.boardLine, arenaStyles.boardLineVertical]} />
          <View style={[arenaStyles.boardLine, arenaStyles.boardLineVerticalAlt]} />
        </View>

        <TeamPanel
          label="INIMIGO"
          player={foe}
          side="enemy"
          tone={foeTone}
          layout={layout}
          selectedId={b.battle.selectedEnemyId}
          receiverId={attackImpactKey ? event?.targetId ?? null : null}
          impactKey={attackImpactKey}
          damageEvent={event}
          validTargetSide={validTargetSide}
          activeSide={false}
          onSelect={(id) => {
            if (selectedCard) {
              if (selectedCard.polaridade !== "DEBUFF") {
                markEvent("card", "ALVO ERRADO", "Buff deve ser usado em aliado.", true);
                return;
              }
              const result = b.useCardFrom(selectedCard.id, id);
              markCardEvent(result);
              return;
            }
            const selectedOwnId = b.battle?.selectedOwnId;
            if (selectedOwnId) {
              const result = b.attackFrom(selectedOwnId, id);
              markAttackEvent(result);
              return;
            }
            if (hasAttacked) {
              markEvent("card", "ATAQUE USADO", "Voce ja atacou neste turno. Jogue cartas ou encerre o turno.", true);
              return;
            }
            markEvent("card", "ESCOLHA ATACANTE", "Primeiro toque em um fighter do seu campo.", true);
          }}
          onMeasureFighter={rememberDropTarget}
        />

        <Animated.View entering={FadeIn.duration(340)} style={[arenaStyles.centerStage, { height: layout.centerH }]}>
          <LinearGradient colors={["rgba(52,225,255,.16)", "rgba(255,61,180,.10)", "rgba(245,197,66,.08)"]} style={StyleSheet.absoluteFill} />
          <TurnIndicator playerName={cur.name} tone={curTone} />
        </Animated.View>

        <TeamPanel
          label="SEU CAMPO"
          player={cur}
          side="own"
          tone={curTone}
          layout={layout}
          selectedId={b.battle.selectedOwnId}
          attackerId={attackImpactKey ? event?.attackerId ?? null : null}
          impactKey={attackImpactKey}
          damageEvent={event}
          validTargetSide={validTargetSide}
          activeSide
          onSelect={(id) => {
            if (selectedCard) {
              if (selectedCard.polaridade === "DEBUFF") {
                markEvent("card", "ALVO ERRADO", "Debuff deve ser usado em inimigo.", true);
                return;
              }
              const result = b.useCardFrom(selectedCard.id, id);
              markCardEvent(result);
              return;
            }
            if (hasAttacked) {
              markEvent("card", "ATAQUE USADO", "Voce ja atacou neste turno. Jogue cartas ou encerre o turno.", true);
              return;
            }
            b.selectOwn(id);
          }}
          onMeasureFighter={rememberDropTarget}
          onDragFighter={(id, point) => {
            if (hasAttacked) {
              markEvent("card", "ATAQUE USADO", "Voce ja atacou neste turno. Jogue cartas ou encerre o turno.", true);
              return;
            }
            const target = targetAt(point, "enemy");
            if (!target) {
              markEvent("card", "SEM ALVO", "Solte em cima do inimigo.", true);
              return;
            }
            const result = b.attackFrom(id, target.id);
            markAttackEvent(result);
          }}
        />
      </View>

      <Animated.View entering={FadeInUp.duration(260)} style={[arenaStyles.bottomHud, { height: layout.bottomH }]}>
        <View style={arenaStyles.handPanel}>
          <Text style={handStyles.handTitle}>MAO DE CARTAS</Text>
          <HandFan
            cards={cur.hand}
            cardWidth={layout.handCardW}
            selectedCardId={b.battle.selectedCardId}
            player={cur}
            onSelectCard={(id) => {
              b.selectCard(id);
            }}
            onUseCard={(id, point) => {
              const card = cur.hand.find((item) => item.id === id);
              const side = card?.polaridade === "DEBUFF" ? "enemy" : "own";
              const target = targetAt(point, side);
              if (!card || !target) {
                markEvent("card", "SEM ALVO", side === "enemy" ? "Solte no inimigo." : "Solte no aliado.", true);
                return;
              }
              const result = b.useCardFrom(id, target.id);
              markCardEvent(result);
            }}
          />
        </View>
        <View style={arenaStyles.actions}>
          <ActionButton
            label="Encerrar Turno"
            variant="ghost"
            disabled={b.waitingPass}
            suggest={hasAttacked || !hasAffordableCard}
            suggestColor={curTone.accent}
            onPress={() => {
              markEvent("pass", "Turno passado");
              b.endTurn();
            }}
          />
        </View>
      </Animated.View>
      <View style={[arenaStyles.battleLogPanel, logExpanded && arenaStyles.battleLogPanelOpen]}>
        <PressableScale haptic="tap" style={arenaStyles.logToggle} onPress={() => setLogExpanded((value) => !value)}>
          <Text style={arenaStyles.logToggleText}>{logExpanded ? "LOG -" : "LOG +"}</Text>
        </PressableScale>
        {logExpanded
          ? b.battle.history.slice(-12).map((item) => (
              <Text key={item.id} style={arenaStyles.battleLogLine} numberOfLines={1}>
                {item.text}
              </Text>
            ))
          : null}
      </View>
      {b.waitingPass ? (
        <Animated.View entering={FadeIn.duration(220)} style={arenaStyles.passOverlay} pointerEvents="box-none">
          <PressableScale haptic="success" style={[arenaStyles.passCta, { borderColor: curTone.border, backgroundColor: curTone.panel, shadowColor: curTone.accent }]} onPress={b.confirmPass}>
            <Text style={[arenaStyles.passCtaKicker, { color: curTone.accent }]}>TURNO MUDOU</Text>
            <Text style={arenaStyles.passCtaTitle} numberOfLines={1} adjustsFontSizeToFit>
              {nextTurnName}
            </Text>
            <Text style={arenaStyles.passCtaHint}>TOQUE PARA JOGAR</Text>
          </PressableScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

const hpStyles = StyleSheet.create({
  track: {
    height: 5,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(6,12,26,.82)",
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.1)",
  },
  trackTall: { height: 8 },
  fill: { height: "100%", borderRadius: RADIUS.round },
});

const fighterStyles = StyleSheet.create({
  fieldCardHit: {
    position: "relative",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.16)",
    backgroundColor: "rgba(6,12,26,.38)",
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  attackLift: {
    position: "absolute",
    left: "50%",
    top: -12,
    width: 34,
    height: 20,
    marginLeft: -17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 1,
    backgroundColor: "rgba(6,12,26,.88)",
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  attackLiftText: {
    color: COLORS.gold,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  hitFlash: {
    position: "absolute",
    inset: -3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.red,
    backgroundColor: "rgba(255,77,109,.32)",
  },
  hitFlashText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  effectBadges: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    alignItems: "flex-start",
  },
  effectBadge: {
    minWidth: 33,
    maxWidth: 58,
    minHeight: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  effectBadgeBuff: {
    borderColor: "rgba(134,239,172,.78)",
    backgroundColor: "rgba(20,83,45,.88)",
    shadowColor: COLORS.greenSoft,
  },
  effectBadgeDebuff: {
    borderColor: "rgba(255,77,109,.82)",
    backgroundColor: "rgba(96,18,34,.9)",
    shadowColor: COLORS.red,
  },
  effectBadgeText: {
    color: "#fff",
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "900",
  },
  validTarget: {
    borderColor: "rgba(245,197,66,.72)",
    backgroundColor: "rgba(245,197,66,.08)",
  },
  invalidTarget: {
    opacity: 0.48,
  },
  uncommonField: {
    borderColor: "rgba(34,197,94,.48)",
    shadowColor: COLORS.greenSoft,
  },
  rareField: {
    borderColor: "rgba(52,225,255,.62)",
    shadowColor: COLORS.accent,
  },
  shieldBubble: {
    position: "absolute",
    inset: -4,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: "rgba(52,225,255,.48)",
    backgroundColor: "rgba(52,225,255,.06)",
  },
  poisonFx: {
    position: "absolute",
    right: 5,
    top: 22,
    color: COLORS.greenSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  cardLifeStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    paddingHorizontal: 4,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(234,242,255,.12)",
    borderBottomLeftRadius: RADIUS.sm,
    borderBottomRightRadius: RADIUS.sm,
    backgroundColor: "rgba(5,7,15,.92)",
  },
  cardLifeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  cardLifeLabel: {
    color: COLORS.red,
    fontSize: 6,
    lineHeight: 7,
    fontWeight: "900",
  },
  cardLifeValue: {
    flex: 1,
    minWidth: 0,
    color: COLORS.cream,
    fontSize: 7,
    lineHeight: 8,
    fontWeight: "900",
    textAlign: "right",
  },
  cardLifeTrack: {
    height: 3,
    marginTop: 2,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(255,77,109,.18)",
  },
  cardLifeFill: {
    height: "100%",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.red,
  },
  abilityRow: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 19,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 2,
  },
  stateChip: {
    position: "absolute",
    left: 4,
    bottom: 21,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  stateChipBuff: {
    borderColor: "rgba(134,239,172,.85)",
    backgroundColor: "rgba(20,83,45,.92)",
    shadowColor: COLORS.greenSoft,
  },
  stateChipDebuff: {
    borderColor: "rgba(255,77,109,.85)",
    backgroundColor: "rgba(96,18,34,.92)",
    shadowColor: COLORS.red,
  },
  stateChipText: {
    color: "#fff",
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  abilityIcon: {
    fontSize: 9,
    lineHeight: 11,
  },
  damageNumber: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "34%",
    color: COLORS.red,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(255,77,109,.9)",
    textShadowRadius: 12,
  },
  card: {
    padding: 5,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: "rgba(10,19,38,.82)",
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  enemyCard: { backgroundColor: "rgba(42,14,42,.72)" },
  selected: { borderWidth: 3, backgroundColor: "rgba(24,41,79,.96)" },
  dimmed: { opacity: 0.42 },
  selectionRing: {
    position: "absolute",
    inset: -6,
    borderRadius: RADIUS.md,
    borderWidth: 3,
    backgroundColor: "transparent",
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  spent: { opacity: 0.74 },
  lockedTarget: { opacity: 0.4 },
  tauntBadge: {
    position: "absolute",
    left: 4,
    right: 4,
    top: -10,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: "rgba(5,7,15,.95)",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  tauntBadgeText: {
    color: COLORS.gold,
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  lockBadge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "42%",
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadgeText: {
    fontSize: 22,
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,.9)",
    textShadowRadius: 6,
  },
  spentBadge: {
    position: "absolute",
    right: 4,
    top: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.6)",
    backgroundColor: "rgba(5,7,15,.9)",
  },
  spentText: {
    color: COLORS.gold,
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  dead: { opacity: 0.34 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgNav,
  },
  avatarImg: { width: 24, height: 24 },
  avatarFallback: { color: COLORS.cream, fontWeight: "900", fontSize: 12 },
  identity: { flex: 1, minWidth: 0 },
  name: { color: COLORS.cream, fontSize: 11, lineHeight: 13, fontWeight: "900" },
  className: { color: COLORS.textMuted, fontSize: 8, lineHeight: 10, marginTop: 1, textTransform: "uppercase" },
  statsGrid: { flexDirection: "row", gap: 3, marginTop: 3 },
  statPill: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    backgroundColor: "rgba(234,242,255,.08)",
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.08)",
  },
  statLabel: { color: COLORS.textMuted, fontSize: 6, lineHeight: 7, fontWeight: "800" },
  statValue: { color: COLORS.cream, fontSize: 9, lineHeight: 10, fontWeight: "900" },
  deadLabel: {
    position: "absolute",
    right: 6,
    top: 6,
    color: COLORS.red,
    fontSize: 8,
    fontWeight: "900",
  },
});

const handStyles = StyleSheet.create({
  used: { opacity: 0.3 },
  handTitle: {
    color: COLORS.gold,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 2,
  },
  switchWrap: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
    padding: 3,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(6,12,26,.74)",
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.12)",
    marginBottom: 4,
  },
  switchBtn: { minWidth: 72, minHeight: 25, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.sm, paddingHorizontal: 8 },
  switchActive: { backgroundColor: COLORS.primary },
  switchText: { color: COLORS.textMuted, fontSize: 9, lineHeight: 11, fontWeight: "900" },
  switchTextActive: { color: "#fff" },
  fanWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", minWidth: 260 },
  fanRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", minHeight: 104, paddingHorizontal: 18 },
  realCardHit: {
    position: "relative",
    borderRadius: RADIUS.sm,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  playableRealCard: {
    borderWidth: 1.5,
    borderColor: "rgba(134,239,172,.8)",
    shadowColor: COLORS.greenSoft,
    shadowOpacity: 0.75,
    shadowRadius: 12,
  },
  selectedRealCard: {
    borderWidth: 2.5,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  costBadge: {
    position: "absolute",
    left: -4,
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: "rgba(6,12,26,.92)",
  },
  costText: { color: COLORS.gold, fontSize: 10, lineHeight: 12, fontWeight: "900" },
  kindBadge: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    minHeight: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 1,
    backgroundColor: "rgba(5,7,15,.88)",
  },
  buffBadge: {
    borderColor: "rgba(134,239,172,.75)",
  },
  debuffBadge: {
    borderColor: "rgba(255,77,109,.78)",
  },
  kindText: {
    color: COLORS.cream,
    fontSize: 6,
    lineHeight: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  empty: { color: COLORS.textMuted, fontSize: 12, lineHeight: 15, fontWeight: "700", padding: 12 },
});

const actionStyles = StyleSheet.create({
  button: {
    minWidth: 76,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.18)",
    backgroundColor: "rgba(18,33,66,.94)",
  },
  base: {},
  card: { borderColor: "rgba(52,225,255,.45)", backgroundColor: "rgba(10,42,64,.88)" },
  attack: { borderColor: COLORS.red, backgroundColor: COLORS.red },
  ghost: { backgroundColor: "rgba(234,242,255,.06)" },
  disabled: { opacity: 0.32 },
  text: { color: COLORS.cream, fontSize: 12, lineHeight: 14, fontWeight: "900" },
  attackText: { color: "#ffffff" },
});

const arenaStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep, padding: 6, gap: 5 },
  topHud: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 42 },
  playerScore: {
    width: 160,
    padding: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(134,239,172,.24)",
    backgroundColor: "rgba(10,19,38,.76)",
  },
  enemyScore: { borderColor: "rgba(255,77,109,.24)" },
  scoreName: { color: COLORS.cream, fontSize: 11, lineHeight: 13, fontWeight: "900", marginBottom: 4 },
  energyText: { fontSize: 9, lineHeight: 11, fontWeight: "900", marginBottom: 3 },
  phasePill: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.26)",
    backgroundColor: "rgba(6,12,26,.62)",
  },
  phaseText: { color: COLORS.gold, fontSize: 14, lineHeight: 16, fontWeight: "900", textAlign: "center" },
  phaseHint: { color: COLORS.textMuted, fontSize: 10, lineHeight: 12, fontWeight: "700", marginTop: 2, textAlign: "center" },
  stage: {
    flex: 1,
    minHeight: 0,
    justifyContent: "space-between",
    overflow: "hidden",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.18)",
    backgroundColor: "rgba(6,12,26,.34)",
  },
  boardGridBg: { ...StyleSheet.absoluteFillObject, opacity: 0.45 },
  boardLine: { position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: "rgba(245,197,66,.22)" },
  boardLineVertical: { top: 0, bottom: 0, left: "33.3%", width: 1, height: "100%" },
  boardLineVerticalAlt: { top: 0, bottom: 0, left: "66.6%", width: 1, height: "100%" },
  teamPanel: {
    width: "100%",
    paddingHorizontal: 8,
    paddingTop: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inactiveTeamPanel: { opacity: 0.58 },
  enemyPanel: {},
  fieldLabel: {
    position: "absolute",
    left: 14,
    top: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    backgroundColor: "rgba(5,7,15,.82)",
  },
  teamSlots: { width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  centerStage: {
    marginHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.13)",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  portalCore: {
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  turnWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  turnAura: {
    position: "absolute",
    width: "48%",
    minWidth: 190,
    maxWidth: 340,
    height: 40,
    borderRadius: RADIUS.round,
    shadowOpacity: 0.8,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  turnOrbit: {
    position: "absolute",
    width: 150,
    height: 34,
    borderRadius: RADIUS.round,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    opacity: 0.7,
  },
  turnCore: {
    minWidth: 184,
    maxWidth: 340,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  turnKicker: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  turnName: {
    color: COLORS.cream,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  duelSlot: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.16)",
    backgroundColor: "rgba(6,12,26,.54)",
  },
  slotHint: { color: COLORS.textMuted, fontSize: 9, lineHeight: 11, fontWeight: "900" },
  vsText: { color: COLORS.gold, fontSize: 22, lineHeight: 24, fontWeight: "900" },
  effectSlot: { position: "absolute", right: -8, top: 2 },
  matchup: { marginTop: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.round, borderWidth: 1 },
  matchupGood: { borderColor: COLORS.greenSoft, backgroundColor: "rgba(34,197,94,.16)" },
  matchupBad: { borderColor: COLORS.red, backgroundColor: "rgba(255,77,109,.14)" },
  matchupText: { color: COLORS.cream, fontSize: 10, lineHeight: 12, fontWeight: "900" },
  bottomHud: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    padding: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.22)",
    backgroundColor: "rgba(6,12,26,.76)",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  handPanel: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
    justifyContent: "center",
  },
  logBox: {
    flex: 0.72,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.12)",
    backgroundColor: "rgba(6,12,26,.68)",
  },
  logKicker: { color: COLORS.textMuted, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  logLine: { color: COLORS.cream, fontSize: 11, lineHeight: 14, fontWeight: "800", marginTop: 2 },
  actions: {
    width: 88,
    justifyContent: "center",
    alignItems: "stretch",
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(234,242,255,.12)",
  },
  previewBox: {
    width: 170,
    alignSelf: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.42)",
    backgroundColor: "rgba(5,7,15,.92)",
  },
  previewTitle: { color: COLORS.cream, fontSize: 10, lineHeight: 12, fontWeight: "900", textAlign: "center" },
  previewText: { color: COLORS.gold, fontSize: 10, lineHeight: 12, fontWeight: "900", textAlign: "center", marginTop: 3 },
  previewActions: { flexDirection: "row", gap: 6, marginTop: 7 },
  previewConfirm: { flex: 1, minHeight: 26, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.sm, backgroundColor: COLORS.primary },
  previewCancel: { flex: 1, minHeight: 26, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.sm, borderWidth: 1, borderColor: "rgba(234,242,255,.18)" },
  previewConfirmText: { color: "#fff", fontSize: 9, lineHeight: 11, fontWeight: "900" },
  previewCancelText: { color: COLORS.textMuted, fontSize: 9, lineHeight: 11, fontWeight: "900" },
  battleLogPanel: {
    position: "absolute",
    right: 8,
    top: 76,
    width: 58,
    maxHeight: 190,
    padding: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.14)",
    backgroundColor: "rgba(5,7,15,.86)",
  },
  battleLogPanelOpen: { width: 240, padding: 8 },
  logToggle: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.sm, backgroundColor: "rgba(234,242,255,.08)", marginBottom: 4 },
  logToggleText: { color: COLORS.gold, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  battleLogLine: { color: COLORS.cream, fontSize: 9, lineHeight: 12, fontWeight: "700" },
  impactRing: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 150,
    height: 150,
    marginLeft: -75,
    marginTop: -75,
    borderRadius: 75,
    borderWidth: 2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  cinemaBarTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "12%",
    backgroundColor: "rgba(2,4,10,.82)",
  },
  cinemaBarBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "12%",
    backgroundColor: "rgba(2,4,10,.82)",
  },
  attackShockwave: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 116,
    height: 116,
    marginLeft: -58,
    marginTop: -58,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    backgroundColor: "rgba(255,77,109,.06)",
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  attackSlash: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "47%",
    height: 18,
    borderRadius: RADIUS.round,
    shadowOpacity: 0.9,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  attackSlashThin: {
    top: "52%",
    height: 4,
    left: "27%",
    right: "27%",
  },
  cardBurst: {
    position: "absolute",
    left: "50%",
    bottom: "22%",
    width: 62,
    height: 82,
    marginLeft: -31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    backgroundColor: "rgba(6,12,26,.72)",
    shadowOpacity: 0.75,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  cardBurstText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  turnSweep: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 240,
    height: 3,
    marginLeft: -120,
    borderRadius: RADIUS.round,
    opacity: 0.8,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  selectPing: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 88,
    height: 88,
    marginLeft: -44,
    marginTop: -44,
    borderRadius: RADIUS.round,
    borderWidth: 2,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  floatingEvent: {
    position: "absolute",
    left: "26%",
    right: "26%",
    top: "34%",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.32)",
    backgroundColor: "rgba(6,12,26,.86)",
  },
  floatingEventAttack: {
    left: "14%",
    right: "14%",
    top: "28%",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "rgba(245,197,66,.62)",
    backgroundColor: "rgba(5,7,15,.94)",
    shadowColor: COLORS.red,
    shadowOpacity: 0.8,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  floatingEventDanger: {
    borderColor: "rgba(255,77,109,.74)",
    shadowColor: COLORS.red,
  },
  floatingTitle: { color: COLORS.gold, fontSize: 14, lineHeight: 16, fontWeight: "900" },
  floatingTitleAttack: { fontSize: 24, lineHeight: 27, letterSpacing: 0.8 },
  floatingTitleDanger: { color: COLORS.red },
  floatingLog: { color: COLORS.cream, fontSize: 11, lineHeight: 14, fontWeight: "800", marginTop: 4, textAlign: "center" },
  floatingLogAttack: { fontSize: 16, lineHeight: 20, marginTop: 6 },
  passOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  passCta: {
    minWidth: 260,
    maxWidth: 440,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    borderRadius: RADIUS.round,
    borderWidth: 2,
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  passCtaKicker: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  passCtaTitle: {
    color: COLORS.cream,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "900",
    marginTop: 1,
  },
  passCtaHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },
});

const setupStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    paddingBottom: BOTTOM_NAV_HEIGHT + SPACING.lg,
    backgroundColor: COLORS.bgDeep,
  },
  panel: {
    width: "100%",
    maxWidth: 380,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.22)",
    backgroundColor: "rgba(6,12,26,.78)",
  },
  passPanel: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.28)",
    backgroundColor: "rgba(6,12,26,.84)",
  },
  rotateCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.28)",
    backgroundColor: "rgba(6,12,26,.82)",
  },
  rotateIcon: { color: COLORS.gold, fontSize: 38, lineHeight: 42, fontWeight: "900", marginBottom: 8 },
  eyebrow: { color: COLORS.accent, fontSize: 11, lineHeight: 13, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  title: { color: COLORS.cream, fontSize: 28, lineHeight: 32, fontWeight: "900", textAlign: "center" },
  subtitle: { color: COLORS.textMuted, fontSize: 14, lineHeight: 19, fontWeight: "700", textAlign: "center", marginTop: 8, marginBottom: 20 },
  reqGrid: { gap: 8, marginBottom: 20 },
  reqText: { color: COLORS.gold, fontSize: 14, lineHeight: 17, fontWeight: "900", textAlign: "center" },
  resultGrid: { width: "100%", gap: 6, marginBottom: 16 },
  resultLine: { color: COLORS.cream, fontSize: 13, lineHeight: 16, fontWeight: "800", textAlign: "center" },
  primary: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  primaryText: { color: "#ffffff", fontSize: 16, lineHeight: 18, fontWeight: "900" },
  secondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.36)",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  secondaryText: { color: COLORS.gold, fontSize: 15, lineHeight: 17, fontWeight: "900" },
  inputGroup: { width: "100%", gap: 7, marginBottom: 12 },
  label: { color: COLORS.gold, fontSize: 12, lineHeight: 14, fontWeight: "900", marginTop: 5 },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.16)",
    backgroundColor: "rgba(18,33,66,.82)",
    color: COLORS.cream,
    fontSize: 15,
    fontWeight: "800",
  },
});
