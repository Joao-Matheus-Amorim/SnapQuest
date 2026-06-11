import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";

function CloudSyncBridge() {
  useCloudSync();
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CloudSyncBridge />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#f5a623",
          contentStyle: { backgroundColor: "#1a1a2e" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "SnapQuest" }} />
        <Stack.Screen name="camera" options={{ title: "Novo Fighter" }} />
        <Stack.Screen name="inventory" options={{ title: "Inventario" }} />
        <Stack.Screen name="battle" options={{ title: "Batalha" }} />
        <Stack.Screen name="login" options={{ title: "Conta" }} />
      </Stack>
    </AuthProvider>
  );
}
