import { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
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
import type { BattleCard, BattleFighter, BattlePlayer } from "../js/core/battle.js";
import { effectiveBattleStats, totalHp } from "../js/core/battle.js";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { ArenaBackground } from "../components/game/ArenaBackground";
import { PressableScale } from "../components/motion/PressableScale";
import { GameCard } from "../components/cards/GameCard";
import { fighterRarity, RARITY_COLORS } from "../lib/rarityConfig";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { effectCardToCardData, fighterToCardData } from "../utils/cardAdapters";
import { CARD_ASPECT } from "../utils/cardMeta";

type BattleUiEvent = "draw" | "card" | "attack" | "pass";
type HandMode = "fighters" | "cards";

type BattleAction = {
  key: number;
  type: BattleUiEvent;
  label: string;
};

type BattleLayout = {
  rootPad: number;
  topH: number;
  boardH: number;
  rowH: number;
  centerH: number;
  bottomH: number;
  fieldCardW: number;
  fieldCardH: number;
  teamHeaderW: number;
  handCardW: number;
  duelSlot: number;
  duelCardW: number;
  effectCardW: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function battleLayout(width: number, height: number): BattleLayout {
  const rootPad = clamp(height * 0.016, 5, 8);
  const gap = 5;
  const topH = clamp(height * 0.11, 38, 48);
  const bottomH = clamp(height * 0.33, 116, 150);
  const boardH = Math.max(176, height - rootPad * 2 - gap * 2 - topH - bottomH);
  const centerH = clamp(boardH * 0.24, 48, 72);
  const rowH = Math.max(62, (boardH - centerH) / 2);
  const teamHeaderW = clamp(width * 0.13, 88, 118);
  const availableTeamW = width - rootPad * 2 - teamHeaderW - 44;
  const fieldCardW = clamp(availableTeamW / 3, 94, 132);
  const fieldCardH = clamp(rowH - 10, 58, 86);
  const handCardW = clamp((bottomH - 45) / CARD_ASPECT, 42, 66);
  const duelSlot = clamp(centerH - 10, 40, 62);

  return {
    rootPad,
    topH,
    boardH,
    rowH,
    centerH,
    bottomH,
    fieldCardW,
    fieldCardH,
    teamHeaderW,
    handCardW,
    duelSlot,
    duelCardW: clamp(duelSlot / CARD_ASPECT, 22, 34),
    effectCardW: clamp((duelSlot - 6) / CARD_ASPECT, 20, 30),
  };
}

function HpBar({ current, max, tall = false }: { current: number; max: number; tall?: boolean }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? current / max : 0));
  const color = pct > 0.5 ? COLORS.greenSoft : pct > 0.25 ? COLORS.gold : COLORS.red;
  return (
    <View style={[hpStyles.track, tall && hpStyles.trackTall]}>
      <View style={[hpStyles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={fighterStyles.statPill}>
      <Text style={fighterStyles.statLabel}>{label}</Text>
      <Text style={fighterStyles.statValue}>{value}</Text>
    </View>
  );
}

function FighterTile({
  fighter,
  selected,
  side,
  layout,
  onPress,
}: {
  fighter: BattleFighter;
  selected: boolean;
  side: "own" | "enemy";
  layout: BattleLayout;
  onPress: () => void;
}) {
  const dead = !fighter.alive;
  const rarity = fighterRarity((fighter as any).bonus_intensidade ?? 1);
  const rarityColor = RARITY_COLORS[rarity];
  const stats = effectiveBattleStats(fighter);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!selected || dead) {
      pulse.value = withTiming(0, { duration: 160 });
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 820, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [dead, pulse, selected]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.025 }],
    shadowOpacity: selected ? 0.24 + pulse.value * 0.42 : 0.1,
  }));

  return (
    <Animated.View entering={side === "own" ? FadeInUp.delay(80) : FadeInDown.delay(80)} style={glowStyle}>
      <PressableScale
        haptic="select"
        disabled={dead}
        onPress={onPress}
        style={[
          fighterStyles.card,
          { width: layout.fieldCardW, minHeight: layout.fieldCardH },
          side === "enemy" && fighterStyles.enemyCard,
          selected && fighterStyles.selected,
          dead && fighterStyles.dead,
          { borderColor: selected ? rarityColor : "rgba(234,242,255,.16)", shadowColor: rarityColor },
        ]}
      >
        <View style={fighterStyles.topRow}>
          <View style={[fighterStyles.avatar, { borderColor: rarityColor }]}>
            {(fighter as any).foto ? (
              <Image source={{ uri: (fighter as any).foto }} style={fighterStyles.avatarImg} />
            ) : (
              <Text style={fighterStyles.avatarFallback}>{String(fighter.nome || "?").slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
          <View style={fighterStyles.identity}>
            <Text style={fighterStyles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
              {fighter.nome}
            </Text>
            <Text style={fighterStyles.className} numberOfLines={1}>{fighter.classe}</Text>
          </View>
        </View>

        <View style={fighterStyles.hpLine}>
          <Text style={fighterStyles.hpText}>HP {fighter.current_hp}/{fighter.max_hp}</Text>
          <HpBar current={fighter.current_hp} max={fighter.max_hp} />
        </View>

        <View style={fighterStyles.statsGrid}>
          <StatPill label="ATK" value={stats.atk} />
          <StatPill label="DEF" value={stats.def} />
          <StatPill label="LCK" value={stats.lck} />
          <StatPill label="SPD" value={stats.spd} />
        </View>
        {dead ? <Text style={fighterStyles.deadLabel}>FORA</Text> : null}
      </PressableScale>
    </Animated.View>
  );
}

function TeamPanel({
  title,
  player,
  side,
  selectedId,
  layout,
  onSelect,
}: {
  title: string;
  player: BattlePlayer;
  side: "own" | "enemy";
  selectedId: string | null;
  layout: BattleLayout;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={[arenaStyles.teamPanel, { height: layout.rowH }, side === "enemy" && arenaStyles.enemyPanel]}>
      <View style={[arenaStyles.teamHeader, { width: layout.teamHeaderW, minHeight: Math.max(52, layout.rowH - 16) }]}>
        <Text style={arenaStyles.teamKicker}>{title}</Text>
        <Text style={arenaStyles.teamName} numberOfLines={1}>{player.name}</Text>
        <Text style={arenaStyles.teamHp}>TOTAL HP {totalHp(player)}</Text>
      </View>
      <View style={arenaStyles.teamSlots}>
        {player.fighters.map((fighter) => (
          <FighterTile
            key={fighter.id}
            fighter={fighter}
            side={side}
            layout={layout}
            selected={selectedId === fighter.id}
            onPress={() => onSelect(fighter.id)}
          />
        ))}
      </View>
    </View>
  );
}

function HandSwitch({ mode, onChange }: { mode: HandMode; onChange: (mode: HandMode) => void }) {
  return (
    <View style={handStyles.switchWrap}>
      <PressableScale
        haptic="select"
        onPress={() => onChange("fighters")}
        style={[handStyles.switchBtn, mode === "fighters" && handStyles.switchActive]}
      >
        <Text style={[handStyles.switchText, mode === "fighters" && handStyles.switchTextActive]}>FIGHTERS</Text>
      </PressableScale>
      <PressableScale
        haptic="select"
        onPress={() => onChange("cards")}
        style={[handStyles.switchBtn, mode === "cards" && handStyles.switchActive]}
      >
        <Text style={[handStyles.switchText, mode === "cards" && handStyles.switchTextActive]}>CARTAS</Text>
      </PressableScale>
    </View>
  );
}

function FanCard({
  index,
  count,
  selected,
  disabled,
  onPress,
  children,
}: {
  index: number;
  count: number;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const center = (count - 1) / 2;
  const offset = index - center;
  const rotate = offset * 5;
  const translateY = Math.abs(offset) * 5 - (selected ? 12 : 0);

  return (
    <Animated.View entering={FadeInDown.delay(index * 35).springify().damping(15)} style={{ marginLeft: index === 0 ? 0 : -18 }}>
      <PressableScale
        haptic="select"
        disabled={disabled}
        onPress={onPress}
        style={[
          handStyles.realCardHit,
          selected && handStyles.selectedRealCard,
          disabled && handStyles.used,
          { transform: [{ rotate: `${rotate}deg` }, { translateY }] },
        ]}
      >
        {children}
      </PressableScale>
    </Animated.View>
  );
}

function HandFan({
  mode,
  fighters,
  cards,
  cardWidth,
  selectedFighterId,
  selectedCardId,
  onSelectFighter,
  onSelectCard,
}: {
  mode: HandMode;
  fighters: BattleFighter[];
  cards: BattleCard[];
  cardWidth: number;
  selectedFighterId: string | null;
  selectedCardId: string | null;
  onSelectFighter: (id: string) => void;
  onSelectCard: (id: string) => void;
}) {
  const count = mode === "fighters" ? fighters.length : cards.length;
  return (
    <View style={handStyles.fanWrap}>
      <View style={handStyles.fanRow}>
        {mode === "fighters"
          ? fighters.map((fighter, index) => (
              <FanCard
                key={fighter.id}
                index={index}
                count={count}
                selected={selectedFighterId === fighter.id}
                disabled={!fighter.alive}
                onPress={() => onSelectFighter(fighter.id)}
              >
                <GameCard data={fighterToCardData(fighter)} width={cardWidth} glow={false} />
              </FanCard>
            ))
          : cards.map((card, index) => (
              <FanCard
                key={card.id}
                index={index}
                count={count}
                selected={selectedCardId === card.id}
                disabled={card.used}
                onPress={() => onSelectCard(card.id)}
              >
                <GameCard data={effectCardToCardData(card)} width={cardWidth} glow={false} />
              </FanCard>
            ))}
        {count === 0 ? (
          <Text style={handStyles.empty}>{mode === "cards" ? "A compra entra automaticamente na mao." : "Sem fighters."}</Text>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  variant = "base",
  disabled,
  onPress,
}: {
  label: string;
  variant?: "base" | "attack" | "card" | "ghost";
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      haptic={disabled ? null : variant === "attack" ? "reveal" : "tap"}
      disabled={disabled}
      onPress={onPress}
      style={[actionStyles.button, actionStyles[variant], disabled && actionStyles.disabled]}
    >
      <Text style={[actionStyles.text, variant === "attack" && actionStyles.attackText]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </PressableScale>
  );
}

function ImpactOverlay({ event }: { event: BattleAction | null }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!event) return;
    progress.value = 0;
    progress.value = withSequence(
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 360, easing: Easing.in(Easing.cubic) })
    );
  }, [event, progress]);

  const ring = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.35 + progress.value * 2.4 }],
  }));

  const flash = useAnimatedStyle(() => ({
    opacity: progress.value * 0.18,
  }));

  if (!event) return null;

  const color = event.type === "attack" ? COLORS.red : event.type === "card" ? COLORS.accent : COLORS.gold;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color }, flash]} />
      <Animated.View style={[arenaStyles.impactRing, { borderColor: color, shadowColor: color }, ring]} />
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
    y.value = withSequence(withTiming(-6, { duration: 220 }), withDelay(1100, withTiming(-18, { duration: 240 })));
    opacity.value = withSequence(withTiming(1, { duration: 160 }), withDelay(1180, withTiming(0, { duration: 220 })));
  }, [event, opacity, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  if (!event) return null;

  return (
    <Animated.View pointerEvents="none" style={[arenaStyles.floatingEvent, style]}>
      <Text style={arenaStyles.floatingTitle}>{event.label}</Text>
      <Text style={arenaStyles.floatingLog} numberOfLines={2}>{latestLog}</Text>
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
  const isLandscape = width > height;
  const layout = useMemo(() => battleLayout(width, height), [height, width]);
  const [p1, setP1] = useState("Jogador 1");
  const [p2, setP2] = useState("Jogador 2");
  const [event, setEvent] = useState<BattleAction | null>(null);
  const [handMode, setHandMode] = useState<HandMode>("fighters");

  const latestLog = b.battle?.log?.[b.battle.log.length - 1] ?? "";
  const selectedOwn = useMemo(
    () => b.curPlayer?.fighters.find((fighter) => fighter.id === b.battle?.selectedOwnId) ?? null,
    [b.battle?.selectedOwnId, b.curPlayer?.fighters]
  );
  const selectedEnemy = useMemo(
    () => b.foePlayer?.fighters.find((fighter) => fighter.id === b.battle?.selectedEnemyId) ?? null,
    [b.battle?.selectedEnemyId, b.foePlayer?.fighters]
  );
  const selectedCard = useMemo(
    () => b.curPlayer?.hand.find((card) => card.id === b.battle?.selectedCardId) ?? null,
    [b.battle?.selectedCardId, b.curPlayer?.hand]
  );

  function markEvent(type: BattleUiEvent, label: string) {
    setEvent({ key: Date.now(), type, label });
  }

  useEffect(() => {
    if (!b.battle || b.waitingPass || !b.curPlayer || b.curPlayer.drawn_this_turn) return;
    const timer = setTimeout(() => {
      markEvent("draw", "Carta comprada");
      setHandMode("cards");
      b.draw();
    }, 260);
    return () => clearTimeout(timer);
  }, [b.battle?.turn, b.curPlayer?.drawn_this_turn, b.waitingPass]);

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
    return (
      <SetupShell>
        <Text style={setupStyles.eyebrow}>VITORIA</Text>
        <Text style={setupStyles.title}>{winner.name} venceu</Text>
        <Text style={setupStyles.subtitle}>A arena foi encerrada.</Text>
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

  if (b.waitingPass) {
    const nextName = b.curPlayer?.name ?? "proximo jogador";
    return (
      <View style={setupStyles.center}>
        <StatusBar hidden />
        <ArenaBackground />
        <Animated.View entering={FadeIn.springify().damping(16)} style={setupStyles.passPanel}>
          <Text style={setupStyles.eyebrow}>TROCA DE TURNO</Text>
          <Text style={setupStyles.title}>Passe o celular</Text>
          <Text style={setupStyles.subtitle}>A vez agora e de {nextName}.</Text>
          <PressableScale haptic="success" style={setupStyles.primary} onPress={b.confirmPass}>
            <Text style={setupStyles.primaryText}>Revelar arena</Text>
          </PressableScale>
        </Animated.View>
      </View>
    );
  }

  if (!isLandscape) return <RotateGate />;

  const cur = b.curPlayer!;
  const foe = b.foePlayer!;
  const guidance = b.guidance;

  return (
    <View style={[arenaStyles.root, { padding: layout.rootPad }]}>
      <StatusBar hidden />
      <ArenaBackground />
      <ImpactOverlay event={event} />
      <FloatingEvent event={event} latestLog={latestLog} />

      <Animated.View entering={FadeInDown.duration(260)} style={[arenaStyles.topHud, { height: layout.topH }]}>
        <View style={arenaStyles.playerScore}>
          <Text style={arenaStyles.scoreName} numberOfLines={1}>{cur.name}</Text>
          <HpBar current={totalHp(cur)} max={cur.fighters.reduce((sum, fighter) => sum + fighter.max_hp, 0)} tall />
        </View>
        <View style={arenaStyles.phasePill}>
          <Text style={arenaStyles.phaseText}>{guidance?.phase ?? "Arena"}</Text>
          <Text style={arenaStyles.phaseHint} numberOfLines={1}>{guidance?.hint ?? latestLog}</Text>
        </View>
        <View style={[arenaStyles.playerScore, arenaStyles.enemyScore]}>
          <Text style={arenaStyles.scoreName} numberOfLines={1}>{foe.name}</Text>
          <HpBar current={totalHp(foe)} max={foe.fighters.reduce((sum, fighter) => sum + fighter.max_hp, 0)} tall />
        </View>
      </Animated.View>

      <View style={[arenaStyles.stage, { height: layout.boardH }]}>
        <View style={arenaStyles.boardGridBg} pointerEvents="none">
          <View style={arenaStyles.boardLine} />
          <View style={[arenaStyles.boardLine, arenaStyles.boardLineVertical]} />
          <View style={[arenaStyles.boardLine, arenaStyles.boardLineVerticalAlt]} />
        </View>

        <TeamPanel title="CAMPO INIMIGO" player={foe} side="enemy" layout={layout} selectedId={b.battle.selectedEnemyId} onSelect={b.selectEnemy} />

        <Animated.View entering={FadeIn.duration(340)} style={[arenaStyles.centerStage, { height: layout.centerH }]}>
          <LinearGradient colors={["rgba(52,225,255,.16)", "rgba(255,61,180,.10)", "rgba(245,197,66,.08)"]} style={StyleSheet.absoluteFill} />
          <View style={[arenaStyles.duelSlot, { width: layout.duelSlot, height: layout.duelSlot }]}>
            {selectedEnemy ? <GameCard data={fighterToCardData(selectedEnemy)} width={layout.duelCardW} glow={false} /> : <Text style={arenaStyles.slotHint}>ALVO</Text>}
          </View>
          <View style={arenaStyles.portalCore}>
            <Text style={arenaStyles.vsText}>VS</Text>
            {b.matchup ? (
              <View style={[arenaStyles.matchup, b.matchup === "vantagem" ? arenaStyles.matchupGood : arenaStyles.matchupBad]}>
                <Text style={arenaStyles.matchupText}>{b.matchup === "vantagem" ? "VANTAGEM" : "RESISTIDO"}</Text>
              </View>
            ) : null}
            {selectedCard ? (
              <View style={arenaStyles.effectSlot}>
                <GameCard data={effectCardToCardData(selectedCard)} width={layout.effectCardW} glow={false} />
              </View>
            ) : null}
          </View>
          <View style={[arenaStyles.duelSlot, { width: layout.duelSlot, height: layout.duelSlot }]}>
            {selectedOwn ? <GameCard data={fighterToCardData(selectedOwn)} width={layout.duelCardW} glow={false} /> : <Text style={arenaStyles.slotHint}>ATACANTE</Text>}
          </View>
        </Animated.View>

        <TeamPanel title="SEU CAMPO" player={cur} side="own" layout={layout} selectedId={b.battle.selectedOwnId} onSelect={b.selectOwn} />
      </View>

      <Animated.View entering={FadeInUp.duration(260)} style={[arenaStyles.bottomHud, { height: layout.bottomH }]}>
        <View style={arenaStyles.handPanel}>
          <HandSwitch mode={handMode} onChange={setHandMode} />
          <HandFan
            mode={handMode}
            fighters={cur.fighters}
            cards={cur.hand}
            cardWidth={layout.handCardW}
            selectedFighterId={b.battle.selectedOwnId}
            selectedCardId={b.battle.selectedCardId}
            onSelectFighter={b.selectOwn}
            onSelectCard={b.selectCard}
          />
        </View>
        <View style={arenaStyles.logBox}>
          <Text style={arenaStyles.logKicker}>ULTIMO EVENTO</Text>
          <Text style={arenaStyles.logLine} numberOfLines={2}>{latestLog}</Text>
        </View>
        <View style={arenaStyles.actions}>
          <ActionButton
            label="Usar carta"
            variant="card"
            disabled={!b.canUseCard}
            onPress={() => {
              markEvent("card", "Efeito ativado");
              b.useCard();
            }}
          />
          <ActionButton
            label="Atacar"
            variant="attack"
            disabled={!b.canAttack}
            onPress={() => {
              markEvent("attack", "Ataque lancado");
              b.attack();
            }}
          />
          <ActionButton
            label="Passar"
            variant="ghost"
            onPress={() => {
              markEvent("pass", "Turno passado");
              b.endTurn();
            }}
          />
        </View>
      </Animated.View>
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
  selected: { borderWidth: 2, backgroundColor: "rgba(24,41,79,.94)" },
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
  hpLine: { marginTop: 3, gap: 2 },
  hpText: { color: COLORS.greenSoft, fontSize: 8, lineHeight: 10, fontWeight: "800" },
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
    borderRadius: RADIUS.sm,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  selectedRealCard: { shadowOpacity: 0.55 },
  empty: { color: COLORS.textMuted, fontSize: 12, lineHeight: 15, fontWeight: "700", padding: 12 },
});

const actionStyles = StyleSheet.create({
  button: {
    minWidth: 86,
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
  teamPanel: { width: "100%", paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  enemyPanel: {},
  teamHeader: {
    padding: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.12)",
    backgroundColor: "rgba(6,12,26,.58)",
  },
  teamKicker: { color: COLORS.textMuted, fontSize: 8, lineHeight: 10, fontWeight: "900" },
  teamName: { color: COLORS.cream, fontSize: 12, lineHeight: 14, fontWeight: "900", marginTop: 1 },
  teamHp: { color: COLORS.gold, fontSize: 10, lineHeight: 12, fontWeight: "900", marginTop: 2 },
  teamSlots: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
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
  bottomHud: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  handPanel: {
    flex: 1.15,
    minWidth: 0,
    padding: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.18)",
    backgroundColor: "rgba(6,12,26,.68)",
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
  actions: { width: 94, justifyContent: "center", gap: 6 },
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
  floatingEvent: {
    position: "absolute",
    left: "30%",
    right: "30%",
    top: "34%",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.32)",
    backgroundColor: "rgba(6,12,26,.86)",
  },
  floatingTitle: { color: COLORS.gold, fontSize: 14, lineHeight: 16, fontWeight: "900" },
  floatingLog: { color: COLORS.cream, fontSize: 11, lineHeight: 14, fontWeight: "800", marginTop: 4, textAlign: "center" },
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
