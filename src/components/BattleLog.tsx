import { View, Text, StyleSheet } from "react-native";

type BattleLogProps = {
  entries: string[];
};

export function BattleLog({ entries }: BattleLogProps) {
  return (
    <View style={styles.box}>
      {entries.map((entry, index) => (
        <Text key={`${entry}-${index}`} style={styles.entry}>
          {entry}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 8,
  },
  entry: {
    color: "#ffffff",
  },
});
