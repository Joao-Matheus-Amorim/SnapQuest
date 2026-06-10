import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useInventory } from "../hooks/useInventory";
import { useAuth } from "../hooks/useAuth";

export default function HomeScreen() {
  const { battleRequirements } = useInventory();
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SnapQuest</Text>
      <Text style={styles.subtitle}>Card Game · Foto · Batalha</Text>
      <Text style={styles.inventorySummary}>
        Fighters {battleRequirements.fighterCount}/{battleRequirements.minFighters} · Cartas {battleRequirements.cardCount}/{battleRequirements.minCards}
      </Text>

      <Link href="/camera" asChild>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>Criar Fighter</Text>
        </Pressable>
      </Link>

      <Link href="/inventory" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Ver Inventário</Text>
        </Pressable>
      </Link>

      <Link href="/battle" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Testar Batalha</Text>
        </Pressable>
      </Link>

      {user ? (
        <Pressable style={styles.accountButton} onPress={signOut}>
          <Text style={styles.accountText}>☁ {user.email}  ·  Sair</Text>
        </Pressable>
      ) : (
        <Link href="/login" asChild>
          <Pressable style={styles.accountButton}>
            <Text style={styles.accountText}>☁ Entrar na conta</Text>
          </Pressable>
        </Link>
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
    padding: 24,
  },
  title: {
    color: "#f5a623",
    fontSize: 42,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 12,
  },
  inventorySummary: {
    color: "#f5a623",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 28,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 14,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    borderColor: "#f5a623",
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 14,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  secondaryText: {
    color: "#f5a623",
    fontSize: 18,
    fontWeight: "700",
  },
  accountButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  accountText: {
    color: "rgba(255,255,255,.45)",
    fontSize: 13,
    textAlign: "center",
  },
});
