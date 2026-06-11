import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { loading: authLoading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "neutral" | "success" | "error"; text: string } | null>(null);

  async function handleSignIn() {
    if (!email || !password) {
      setNotice({ tone: "error", text: "Preencha email e senha." });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      await signIn(email, password);
      setNotice({ tone: "success", text: "Conta conectada. Sincronizando seu deck..." });
      router.replace("/");
    } catch (e: unknown) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      setNotice({ tone: "error", text: "Preencha email e senha." });
      return;
    }

    if (password.length < 6) {
      setNotice({ tone: "error", text: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const result = await signUp(email, password);
      setNotice({
        tone: result.requiresEmailConfirmation ? "neutral" : "success",
        text: result.message,
      });

      if (!result.requiresEmailConfirmation) {
        router.replace("/");
      }
    } catch (e: unknown) {
      setNotice({ tone: "error", text: e instanceof Error ? e.message : "Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  const busy = authLoading || submitting;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conta SnapQuest</Text>
      <Text style={styles.subtitle}>
        Entre para sincronizar seu deck pessoal. Sem conta, voce continua jogando no modo local.
      </Text>

      {authLoading && (
        <View style={styles.statusBox}>
          <ActivityIndicator color="#f5a623" />
          <Text style={styles.statusText}>Verificando sessao...</Text>
        </View>
      )}

      {notice && (
        <View
          style={[
            styles.noticeBox,
            notice.tone === "success" && styles.noticeSuccess,
            notice.tone === "error" && styles.noticeError,
          ]}
        >
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!busy}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!busy}
      />

      {busy ? (
        <ActivityIndicator color="#f5a623" style={{ marginVertical: 20 }} />
      ) : (
        <>
          <Pressable style={styles.primaryButton} onPress={handleSignIn}>
            <Text style={styles.primaryText}>Entrar</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={handleSignUp}>
            <Text style={styles.outlineText}>Criar Conta</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={() => router.back()}>
            <Text style={styles.ghostText}>Continuar sem conta</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  title: {
    color: "#f5a623",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 340,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  statusText: {
    color: "rgba(255,255,255,.7)",
    fontSize: 13,
  },
  noticeBox: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.35)",
  },
  noticeSuccess: {
    borderColor: "rgba(76,175,80,.45)",
    backgroundColor: "rgba(76,175,80,.12)",
  },
  noticeError: {
    borderColor: "rgba(233,69,96,.5)",
    backgroundColor: "rgba(233,69,96,.12)",
  },
  noticeText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: "#16213e",
    color: "#ffffff",
    borderColor: "rgba(245,166,35,.4)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    width: "100%",
    maxWidth: 340,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  outlineButton: {
    borderColor: "#f5a623",
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    marginBottom: 12,
  },
  outlineText: {
    color: "#f5a623",
    fontSize: 17,
    fontWeight: "700",
  },
  ghostButton: {
    paddingVertical: 12,
  },
  ghostText: {
    color: "rgba(255,255,255,.5)",
    fontSize: 14,
  },
});
