/**
 * Feedback tatil semantico do SnapQuest.
 * Mapeia eventos do jogo para expo-haptics. No-op em web e quando desligado.
 * Nunca lanca: falha de haptics nao pode quebrar uma acao de UI.
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

let enabled = Platform.OS !== "web";

export function setHapticsEnabled(value: boolean) {
  enabled = value && Platform.OS !== "web";
}

export function isHapticsEnabled() {
  return enabled;
}

export type HapticEvent =
  | "tap" // toque leve em botao
  | "select" // troca de aba/filtro/selecao
  | "success" // acao concluida
  | "warning"
  | "error" // acao destrutiva/falha
  | "reveal" // impacto do reveal de carta
  | "legendary"; // jackpot lendario

function run(fn: () => Promise<unknown>) {
  if (!enabled) return;
  // Dispara sem esperar; engole qualquer erro.
  fn().catch(() => {});
}

export const haptic = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  reveal: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  legendary: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};

export function fireHaptic(event: HapticEvent) {
  haptic[event]();
}
