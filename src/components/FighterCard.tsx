import { View, Text, StyleSheet } from "react-native";

type FighterCardProps = {
  name: string;
  role?: string;
};

export function FighterCard({ name, role }: FighterCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      {role ? <Text style={styles.role}>{role}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 18,
    padding: 16,
  },
  name: {
    color: "#f5a623",
    fontSize: 20,
    fontWeight: "800",
  },
  role: {
    color: "#ffffff",
    marginTop: 4,
  },
});
