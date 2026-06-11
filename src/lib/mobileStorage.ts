import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SECURE_STORE_MAX = 1800;

function getWebValue(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function setWebValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export async function getStorageItem(key: string) {
  if (Platform.OS === "web") return getWebValue(key);
  try {
    const secure = await SecureStore.getItemAsync(key);
    if (secure !== null) return secure;
  } catch {
    // Expo Go/iOS can reject SecureStore reads while user interaction is blocked.
    // AsyncStorage is the compatibility fallback for local game state.
  }
  return AsyncStorage.getItem(key);
}

export async function setStorageItem(key: string, value: string) {
  if (Platform.OS === "web") {
    setWebValue(key, value);
    return;
  }
  if (value.length <= SECURE_STORE_MAX) {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      // Fall through to AsyncStorage when SecureStore is unavailable.
    }
  }
  await AsyncStorage.setItem(key, value);
  await SecureStore.deleteItemAsync(key).catch(() => {});
}
