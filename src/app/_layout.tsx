import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Cinzel_700Bold, Cinzel_900Black } from "@expo-google-fonts/cinzel";
import { Exo2_700Bold, Exo2_900Black } from "@expo-google-fonts/exo-2";
import { AuthProvider } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { COLORS } from "../theme/tokens";

function CloudSyncBridge() {
  useCloudSync();
  return null;
}

export default function RootLayout() {
  useFonts({
    'Cinzel-Bold':  Cinzel_700Bold,
    'Cinzel-Black': Cinzel_900Black,
    'Exo2-Bold':    Exo2_700Bold,
    'Exo2-Black':   Exo2_900Black,
  });

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
            <Stack.Screen name="card-sandbox" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
