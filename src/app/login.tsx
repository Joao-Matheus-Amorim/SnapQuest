import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Preencha email e senha.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.back();
    } catch (e: unknown) {
      Alert.alert("Erro ao entrar", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert("Preencha email e senha.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert("Conta criada!", "Verifique seu email para confirmar o cadastro, depois entre com sua senha.");
    } catch (e: unknown) {
      Alert.alert("Erro ao cadastrar", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conta SnapQuest</Text>
      <Text style={styles.subtitle}>Entre para sincronizar seu deck na nuvem.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      {loading ? (
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
    marginBottom: 32,
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
