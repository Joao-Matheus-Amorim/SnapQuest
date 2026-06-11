import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { COLORS } from "../theme/tokens";

function CloudSyncBridge() {
  useCloudSync();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <CloudSyncBridge />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bgDeep },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="camera" />
            <Stack.Screen name="inventory" />
            <Stack.Screen name="battle" />
            <Stack.Screen name="login" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
