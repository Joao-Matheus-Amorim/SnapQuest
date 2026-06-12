/**
 * Metadados de carta independentes do template visual:
 * - proporção/largura padrão (carta 9:16)
 * - guard de foto renderizável
 * - cor de acento por classe (fighter) e categoria (carta de efeito)
 *
 * Cores e dimensões; nada de regra de jogo aqui.
 */
import { COLORS } from "../theme/tokens";

/** Proporção real dos templates PNG em assets/cards/templates: 1059 x 1881. */
export const CARD_ASPECT = 1881 / 1059;
export const CARD_WIDTH = 164;
export const CARD_HEIGHT = Math.round(CARD_WIDTH * CARD_ASPECT);

/** Cor de acento por classe de fighter. */
export const CLASS_COLORS: Record<string, string> = {
  guerreiro: "#ff4d6d",
  mago: "#ff3db4",
  arqueiro: "#22c55e",
  curandeiro: "#34e1ff",
  paladino: "#f5c542",
  invocador: "#ff8a3d",
  sombrio: "#8ea4c8",
  elemental: "#34e1ff",
};

/** Cor de acento por categoria de carta de efeito. */
export const CATEGORY_COLORS: Record<string, string> = {
  natural: "#22c55e",
  consumivel: "#f5c542",
  ferramenta: "#8ea4c8",
  criatura: "#ff8a3d",
  vestimenta: "#ff3db4",
  fogo: "#ff4d6d",
  liquido: "#34e1ff",
  conhecimento: "#6c8cff",
};

export function classColor(key?: string | null): string {
  return CLASS_COLORS[key ?? ""] ?? COLORS.primary;
}

export function categoryColor(key?: string | null): string {
  return CATEGORY_COLORS[key ?? ""] ?? COLORS.accent;
}

/** Só renderiza fotos que o RN consegue carregar (evita ph:// e caminhos nativos). */
export function isRenderableCardPhoto(uri?: string | null): boolean {
  if (!uri) return false;
  if (uri.includes("/var/mobile/Media/") || uri.includes("/DCIM/")) return false;
  return (
    uri.startsWith("file://") ||
    uri.startsWith("http") ||
    uri.startsWith("data:") ||
    uri.startsWith("content://")
  );
}
