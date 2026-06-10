import { Stack } from "expo-router";
import { useCloudSync } from "../hooks/useCloudSync";

export default function RootLayout() {
  useCloudSync();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#f5a623",
        contentStyle: { backgroundColor: "#1a1a2e" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "SnapQuest" }} />
      <Stack.Screen name="camera" options={{ title: "Novo Fighter" }} />
      <Stack.Screen name="inventory" options={{ title: "Inventário" }} />
      <Stack.Screen name="battle" options={{ title: "Batalha" }} />
      <Stack.Screen name="login" options={{ title: "Conta" }} />
    </Stack>
  );
}
