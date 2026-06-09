import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

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
  return SecureStore.getItemAsync(key);
}

export async function setStorageItem(key: string, value: string) {
  if (Platform.OS === "web") {
    setWebValue(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
