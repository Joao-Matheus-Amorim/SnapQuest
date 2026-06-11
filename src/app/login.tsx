import { useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { ArenaBackground } from "../components/game/ArenaBackground";
import { GameButton } from "../components/game/GameButton";
import { COLORS } from "../theme/tokens";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const cloudSync = useCloudSync();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "neutral" | "success" | "error"; text: string } | null>(null);

  const busy = authLoading || submitting;

  async function handleSignIn() {
    if (!email || !password) { setNotice({ tone: "error", text: "Preencha email e senha." }); return; }
    setSubmitting(true); setNotice(null);
    try {
      await signIn(email, password);
      setNotice({ tone: "success", text: "Conta conectada. Sincronizando seu deck..." });
      router.replace("/");
    } catch (e: unknown) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Tente novamente." });
    } finally { setSubmitting(false); }
  }

  async function handleSignUp() {
    if (!email || !password) { setNotice({ tone: "error", text: "Preencha email e senha." }); return; }
    if (password.length < 6) { setNotice({ tone: "error", text: "A senha deve ter pelo menos 6 caracteres." }); return; }
    setSubmitting(true); setNotice(null);
    try {
      const result = await signUp(email, password);
      setNotice({ tone: result.requiresEmailConfirmation ? "neutral" : "success", text: result.message });
      if (!result.requiresEmailConfirmation) router.replace("/");
    } catch (e: unknown) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Tente novamente." });
    } finally { setSubmitting(false); }
  }

  async function handleSignOut() {
    setSubmitting(true); setNotice(null);
    try {
      await signOut();
      setNotice({ tone: "neutral", text: "Voce saiu. Modo local ativo." });
    } catch (e: unknown) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Nao consegui sair." });
    } finally { setSubmitting(false); }
  }

  const label = profile?.displayName || user?.email || "Jogador";
  const initial = (label[0] || "P").toUpperCase();

  return (
    <View style={styles.root}>
      <ArenaBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 30 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.realm}>SNAPQUEST</Text>
        <Text style={styles.title}>{user ? "Sua conta" : "Entrar na arena"}</Text>

        {notice && (
          <View style={[styles.notice, notice.tone === "success" && styles.noticeSuccess, notice.tone === "error" && styles.noticeError]}>
            <Text style={styles.noticeText}>{notice.text}</Text>
          </View>
        )}

        {user ? (
          /* ---- LOGADO ---- */
          <View style={styles.card}>
            <View style={styles.profileHead}>
              <View style={styles.sigil}>
                <Text style={styles.sigilText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.connectedRow}>
                  <View style={styles.dot} />
                  <Text style={styles.connectedText}>CONECTADO</Text>
                </View>
                <Text style={styles.name} numberOfLines={1}>{label}</Text>
                {user.email ? <Text style={styles.email} numberOfLines={1}>{user.email}</Text> : null}
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.stat}><Text style={styles.statValue}>{profile?.level ?? 1}</Text><Text style={styles.statLabel}>NIVEL</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{profile?.xp ?? 0}</Text><Text style={styles.statLabel}>XP</Text></View>
              <View style={styles.stat}><Text style={[styles.statValue, { fontSize: 14 }]}>{profile?.canManageCatalog ? "Mestre" : "Jogador"}</Text><Text style={styles.statLabel}>PAPEL</Text></View>
            </View>

            <Text style={styles.sync}>☁  {cloudSync.message}</Text>

            <View style={{ height: 14 }} />
            <GameButton title="Voltar a arena" icon="⚔" variant="accent" onPress={() => router.replace("/")} />
            <View style={{ height: 12 }} />
            <GameButton title="Sair da conta" variant="dark" size="md" haptic="warning" onPress={handleSignOut} disabled={busy} />
          </View>
        ) : (
          /* ---- DESLOGADO ---- */
          <View style={styles.card}>
            <Text style={styles.subtitle}>Entre para sincronizar seu deck. Sem conta, voce continua jogando no modo local.</Text>

            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="rgba(234,242,255,.4)" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy} />
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="rgba(234,242,255,.4)" secureTextEntry value={password} onChangeText={setPassword} editable={!busy} />

            {busy ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 22 }} />
            ) : (
              <>
                <View style={{ height: 6 }} />
                <GameButton title="ENTRAR" icon="⚔" variant="primary" onPress={handleSignIn} />
                <View style={{ height: 12 }} />
                <GameButton title="Criar conta" variant="accent" size="md" onPress={handleSignUp} />
                <Pressable style={styles.ghost} onPress={() => router.back()}>
                  <Text style={styles.ghostText}>Continuar sem conta</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgNav },
  content: { paddingHorizontal: 22, paddingBottom: 40, alignItems: "center" },
  realm: { color: COLORS.gold, fontSize: 12, fontWeight: "900", letterSpacing: 4, textShadowColor: "rgba(255,61,180,.6)", textShadowRadius: 12 },
  title: { color: COLORS.cream, fontSize: 28, fontWeight: "900", marginTop: 8, marginBottom: 18, textAlign: "center" },

  card: {
    width: "100%", maxWidth: 380, backgroundColor: "rgba(18,33,66,.82)",
    borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(108,140,255,.3)", padding: 20,
    shadowColor: "#6c8cff", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  subtitle: { color: "rgba(234,242,255,.72)", textAlign: "center", marginBottom: 18, lineHeight: 20, fontSize: 13 },

  input: {
    backgroundColor: "rgba(10,18,38,.8)", color: COLORS.cream,
    borderColor: "rgba(52,225,255,.35)", borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, width: "100%", marginBottom: 12, fontWeight: "600",
  },

  profileHead: { flexDirection: "row", alignItems: "center", gap: 14 },
  sigil: {
    width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.primary, borderWidth: 2, borderColor: "rgba(255,255,255,.4)",
    shadowColor: COLORS.primary, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  sigilText: { color: "#fff", fontSize: 30, fontWeight: "900" },
  connectedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green, shadowColor: COLORS.green, shadowOpacity: 1, shadowRadius: 5 },
  connectedText: { color: COLORS.greenSoft, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  name: { color: COLORS.cream, fontSize: 20, fontWeight: "900", marginTop: 3 },
  email: { color: "rgba(234,242,255,.6)", fontSize: 12, marginTop: 1 },

  statRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  stat: { flex: 1, backgroundColor: "rgba(10,18,38,.7)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(108,140,255,.2)", paddingVertical: 12, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "rgba(234,242,255,.55)", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 3 },
  sync: { color: "rgba(234,242,255,.7)", fontSize: 12, marginTop: 16, textAlign: "center", fontWeight: "600" },

  notice: { width: "100%", maxWidth: 380, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, backgroundColor: "rgba(18,33,66,.8)", borderWidth: 1, borderColor: "rgba(108,140,255,.3)" },
  noticeSuccess: { borderColor: "rgba(34,197,94,.5)", backgroundColor: "rgba(34,197,94,.12)" },
  noticeError: { borderColor: "rgba(255,77,109,.5)", backgroundColor: "rgba(255,77,109,.12)" },
  noticeText: { color: COLORS.cream, fontSize: 13, lineHeight: 18 },

  ghost: { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  ghostText: { color: "rgba(234,242,255,.5)", fontSize: 14, fontWeight: "700" },
});
