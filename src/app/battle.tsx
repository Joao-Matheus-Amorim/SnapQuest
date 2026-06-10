import { useState } from "react";
import { Link } from "expo-router";
import { ScrollView, View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { useInventory } from "../hooks/useInventory";
import { useBattle } from "../hooks/useBattle";
import type { BattleFighter, BattleCard, BattlePlayer } from "../js/core/battle.js";

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(1, current / max));
  const color = pct > 0.5 ? "#4caf50" : pct > 0.25 ? "#ff9800" : "#e94560";
  return (
    <View style={hpStyles.track}>
      <View style={[hpStyles.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const hpStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: "#0d1117", borderRadius: 3, marginTop: 4 },
  fill: { height: 6, borderRadius: 3 },
});

function FighterBtn({
  fighter,
  selected,
  onPress,
}: {
  fighter: BattleFighter;
  selected: boolean;
  onPress: () => void;
}) {
  const dead = !fighter.alive;
  return (
    <Pressable
      onPress={dead ? undefined : onPress}
      style={[fStyles.card, selected && fStyles.selected, dead && fStyles.dead]}
    >
      <Text style={fStyles.name}>{fighter.icon} {fighter.nome}</Text>
      <Text style={fStyles.detail}>
        {fighter.classe} · HP {fighter.current_hp}/{fighter.max_hp}
      </Text>
      {!dead && <HpBar current={fighter.current_hp!} max={fighter.max_hp!} />}
      {dead && <Text style={fStyles.deadLabel}>💀 Derrotado</Text>}
    </Pressable>
  );
}

const fStyles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderColor: "rgba(245,166,35,.35)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  selected: { borderColor: "#f5a623", borderWidth: 2, backgroundColor: "#1e2e5a" },
  dead: { opacity: 0.3 },
  name: { color: "#f5a623", fontWeight: "800", fontSize: 15 },
  detail: { color: "#fff", fontSize: 12, marginTop: 2 },
  deadLabel: { color: "#e94560", fontSize: 12, marginTop: 4 },
});

function CardBtn({
  card,
  selected,
  onPress,
}: {
  card: BattleCard;
  selected: boolean;
  onPress: () => void;
}) {
  const used = Boolean(card.used);
  const isDebuff = card.polaridade === "DEBUFF";
  return (
    <Pressable
      onPress={used ? undefined : onPress}
      style={[cStyles.card, selected && cStyles.selected, used && cStyles.used]}
    >
      <Text style={cStyles.name}>{card.icon} {card.nome_efeito}</Text>
      <Text style={[cStyles.detail, isDebuff && cStyles.debuff]}>
        {card.polaridade} · {card.atributo} +{card.intensidade} · {card.raridade}
      </Text>
    </Pressable>
  );
}

const cStyles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderColor: "rgba(245,166,35,.35)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  selected: { borderColor: "#f5a623", borderWidth: 2, backgroundColor: "#1e2e5a" },
  used: { opacity: 0.3 },
  name: { color: "#f5a623", fontWeight: "800", fontSize: 14 },
  detail: { color: "#4caf50", fontSize: 12, marginTop: 2 },
  debuff: { color: "#e94560" },
});

export default function BattleScreen() {
  const { battleRequirements, fighters, cards } = useInventory();
  const b = useBattle();
  const [p1, setP1] = useState("Jogador 1");
  const [p2, setP2] = useState("Jogador 2");

  // Sem inventário suficiente
  if (!battleRequirements.canBattle) {
    return (
      <View style={s.center}>
        <Text style={s.title}>Batalha bloqueada</Text>
        <Text style={s.subtitle}>
          Precisa de {battleRequirements.minFighters} fighters e {battleRequirements.minCards} cartas.
        </Text>
        <View style={s.reqBox}>
          <Text style={s.reqText}>Fighters: {battleRequirements.fighterCount}/{battleRequirements.minFighters}</Text>
          <Text style={s.reqText}>Cartas: {battleRequirements.cardCount}/{battleRequirements.minCards}</Text>
        </View>
        <Link href="/camera" asChild>
          <Pressable style={s.primary}><Text style={s.primaryText}>Criar Fighter</Text></Pressable>
        </Link>
        <Link href="/inventory" asChild>
          <Pressable style={s.secondary}><Text style={s.secondaryText}>Ver Inventário</Text></Pressable>
        </Link>
      </View>
    );
  }

  // Vencedor
  if (b.winner) {
    const winner = b.winner as BattlePlayer | { name: string };
    return (
      <View style={s.center}>
        <Text style={s.bigEmoji}>🏆</Text>
        <Text style={s.title}>{winner.name} venceu!</Text>
        <Pressable style={s.primary} onPress={b.reset}>
          <Text style={s.primaryText}>Jogar de Novo</Text>
        </Pressable>
        <Link href="/" asChild>
          <Pressable style={s.secondary}><Text style={s.secondaryText}>Voltar ao Menu</Text></Pressable>
        </Link>
      </View>
    );
  }

  // Setup
  if (!b.battle) {
    return (
      <View style={s.center}>
        <Text style={s.title}>Batalha Local</Text>
        <Text style={s.subtitle}>Dois jogadores passando o celular.</Text>
        <View style={s.inputGroup}>
          <Text style={s.label}>Jogador 1</Text>
          <TextInput
            value={p1}
            onChangeText={setP1}
            style={s.input}
            placeholderTextColor="#888"
            selectTextOnFocus
          />
          <Text style={s.label}>Jogador 2</Text>
          <TextInput
            value={p2}
            onChangeText={setP2}
            style={s.input}
            placeholderTextColor="#888"
            selectTextOnFocus
          />
        </View>
        <Pressable
          style={s.primary}
          onPress={() => b.start(fighters, cards, p1.trim() || "Jogador 1", p2.trim() || "Jogador 2")}
        >
          <Text style={s.primaryText}>⚔️ Iniciar Batalha</Text>
        </Pressable>
      </View>
    );
  }

  // Passar celular
  if (b.waitingPass) {
    const nextName = b.curPlayer?.name ?? "próximo jogador";
    return (
      <View style={s.center}>
        <Text style={s.bigEmoji}>📱</Text>
        <Text style={s.title}>Passe o celular!</Text>
        <Text style={s.subtitle}>É a vez de {nextName}</Text>
        <Pressable style={s.primary} onPress={b.confirmPass}>
          <Text style={s.primaryText}>Estou pronto — Revelar</Text>
        </Pressable>
      </View>
    );
  }

  // Batalha ativa
  const cur = b.curPlayer!;
  const foe = b.foePlayer!;
  const guidance = b.guidance;

  return (
    <ScrollView contentContainerStyle={s.scroll}>
      {/* Cabeçalho do turno */}
      <View style={s.turnHeader}>
        <Text style={s.turnName}>⚔️ {cur.name}</Text>
        {guidance && (
          <View style={s.guidanceBox}>
            <Text style={s.guidancePhase}>{guidance.phase}</Text>
            <Text style={s.guidanceHint}>{guidance.hint}</Text>
          </View>
        )}
      </View>

      {/* Time inimigo */}
      <Text style={s.section}>Time de {foe.name}</Text>
      {foe.fighters.map((f) => (
        <FighterBtn
          key={f.id}
          fighter={f}
          selected={b.battle!.selectedEnemyId === f.id}
          onPress={() => b.selectEnemy(f.id)}
        />
      ))}

      {/* Seu time */}
      <Text style={s.section}>Seu Time</Text>
      {cur.fighters.map((f) => (
        <FighterBtn
          key={f.id}
          fighter={f}
          selected={b.battle!.selectedOwnId === f.id}
          onPress={() => b.selectOwn(f.id)}
        />
      ))}

      {/* Mão */}
      <Text style={s.section}>Sua Mão ({cur.hand.length})</Text>
      {cur.hand.length === 0 ? (
        <Text style={s.empty}>Sem cartas. Compre uma para começar.</Text>
      ) : (
        cur.hand.map((c) => (
          <CardBtn
            key={c.id}
            card={c}
            selected={b.battle!.selectedCardId === c.id}
            onPress={() => b.selectCard(c.id)}
          />
        ))
      )}

      {/* Ações */}
      <View style={s.actionsRow}>
        <Pressable
          style={[s.actionBtn, cur.drawn_this_turn && s.disabled]}
          disabled={cur.drawn_this_turn}
          onPress={b.draw}
        >
          <Text style={s.actionText}>🃏 Comprar</Text>
        </Pressable>

        <Pressable
          style={[s.actionBtn, !b.canUseCard && s.disabled]}
          disabled={!b.canUseCard}
          onPress={b.useCard}
        >
          <Text style={s.actionText}>✨ Usar Carta</Text>
        </Pressable>

        <Pressable
          style={[s.actionBtn, s.attackBtn, !b.canAttack && s.disabled]}
          disabled={!b.canAttack}
          onPress={b.attack}
        >
          <Text style={[s.actionText, s.attackText]}>⚔️ Atacar</Text>
        </Pressable>
      </View>

      <Pressable style={s.passBtn} onPress={b.endTurn}>
        <Text style={s.passBtnText}>Passar Turno →</Text>
      </Pressable>

      {/* Log */}
      <Text style={s.section}>Log</Text>
      {b.battle.log.slice(-5).reverse().map((line, i) => (
        <Text key={i} style={[s.logLine, i === 0 && s.logLatest]}>{line}</Text>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scroll: { backgroundColor: "#1a1a2e", padding: 20, paddingBottom: 52 },
  bigEmoji: { fontSize: 64, marginBottom: 12 },
  title: {
    color: "#f5a623",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: { color: "#fff", textAlign: "center", marginBottom: 24 },
  reqBox: {
    borderColor: "#f5a623",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    width: "100%",
    maxWidth: 320,
  },
  reqText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  primary: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 14,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondary: {
    borderColor: "#f5a623",
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  secondaryText: { color: "#f5a623", fontSize: 18, fontWeight: "700" },
  inputGroup: { width: "100%", maxWidth: 320, marginBottom: 24 },
  label: { color: "#f5a623", fontWeight: "700", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#16213e",
    color: "#fff",
    borderColor: "rgba(245,166,35,.5)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  turnHeader: {
    backgroundColor: "#16213e",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderColor: "#f5a623",
    borderWidth: 1,
  },
  turnName: {
    color: "#f5a623",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  guidanceBox: { marginTop: 10 },
  guidancePhase: {
    color: "#f5a623",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  guidanceHint: { color: "#fff", fontSize: 13, textAlign: "center", marginTop: 4 },
  section: {
    color: "#f5a623",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 14,
  },
  empty: { color: "rgba(255,255,255,.6)", fontSize: 13, marginBottom: 8 },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
    flexWrap: "wrap",
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#16213e",
    borderColor: "#f5a623",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  attackBtn: { backgroundColor: "#e94560", borderColor: "#e94560" },
  disabled: { opacity: 0.3 },
  actionText: { color: "#f5a623", fontWeight: "800", fontSize: 13 },
  attackText: { color: "#fff" },
  passBtn: {
    marginTop: 12,
    borderColor: "rgba(255,255,255,.3)",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  passBtnText: { color: "rgba(255,255,255,.6)", fontSize: 14 },
  logLine: { color: "rgba(255,255,255,.65)", fontSize: 12, marginBottom: 4 },
  logLatest: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
