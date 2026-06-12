import type { CardTextBlock } from "../types/card";

export function blockHeadline(block: CardTextBlock): string {
  if (block.kind && block.title) return `${block.kind} - ${block.title}`;
  return block.title || block.kind || "";
}

export function clampText(text: string | undefined, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "..." : text;
}
