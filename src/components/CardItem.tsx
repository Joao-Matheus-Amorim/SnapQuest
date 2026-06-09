import { View, Text, StyleSheet } from "react-native";

type CardItemProps = {
  title: string;
  description?: string;
};

export function CardItem({ title, description }: CardItemProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.35)",
  },
  title: {
    color: "#f5a623",
    fontWeight: "800",
    fontSize: 18,
  },
  description: {
    color: "#ffffff",
    marginTop: 6,
  },
});
