import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/app";
import CameraScreen from "./src/app/camera";
import InventoryScreen from "./src/app/inventory";
import BattleScreen from "./src/app/battle";

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Inventory: undefined;
  Battle: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#f5a623",
          contentStyle: { backgroundColor: "#1a1a2e" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "SnapQuest" }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: "Novo Fighter" }} />
        <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Inventário" }} />
        <Stack.Screen name="Battle" component={BattleScreen} options={{ title: "Batalha" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
