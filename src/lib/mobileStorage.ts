import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  return AsyncStorage.getItem(key);
}

export async function setStorageItem(key: string, value: string) {
  if (Platform.OS === "web") {
    setWebValue(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}
