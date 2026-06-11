import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { CapturedPhoto } from "../hooks/useCapturedPhotos";
import { generateGolpe, generateMiss } from "../js/core/balance.js";
import { supabase } from "../lib/supabase";

export type TransformTarget = "fighter" | "effect_card";

export type GeminiTransformResult = {
  target: TransformTarget;
  name: string;
  key: string;
  attackName: string;
  missName: string;
  description: string;
  confidence: number;
  provider: "gemini-backend" | "mock-gemini";
};

const fighterClasses = ["guerreiro", "arqueiro", "mago", "paladino"] as const;
const cardCategories = [
  "natural",
  "consumivel",
  "ferramenta",
  "criatura",
  "vestimenta",
  "fogo",
  "liquido",
  "conhecimento",
] as const;

const FIGHTER_FIRST = ["Guardiao", "Cacador", "Espirito", "Lorde", "Fera", "Sombra", "Mestre", "Brasa", "Lamina", "Tita", "Fenix", "Lobo"];
const FIGHTER_LAST = ["do Vento", "das Trevas", "de Ferro", "do Trovao", "Selvagem", "Ancestral", "do Abismo", "Flamejante", "da Aurora", "Imortal", "do Caos", "Mistico"];
const CARD_FIRST = ["Bencao", "Maldicao", "Selo", "Toque", "Aura", "Eco", "Veu", "Marca", "Sopro", "Pulso", "Chama", "Onda"];
const CARD_LAST = ["do Trovao", "Sombrio", "da Vida", "Flamejante", "Gelido", "Ancestral", "do Vazio", "Radiante", "Venenoso", "Cosmico", "do Caos", "Astral"];

function hashText(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function pickByHash<T>(items: readonly T[], seed: string) {
  return items[hashText(seed) % items.length];
}

function nameFromBank(first: string[], last: string[], seed: string) {
  const h = hashText(seed);
  return `${first[h % first.length]} ${last[(h * 7) % last.length]}`;
}

async function toBase64Payload(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 512 });
  const ref = await context.renderAsync();
  const result = await ref.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
  return result.base64 ?? "";
}

export function mockTransform(photo: CapturedPhoto, target: TransformTarget): GeminiTransformResult {
  return mockFallback(photo, target);
}

function mockFallback(photo: CapturedPhoto, target: TransformTarget): GeminiTransformResult {
  if (target === "fighter") {
    const name = nameFromBank(FIGHTER_FIRST, FIGHTER_LAST, photo.id);
    return {
      target: "fighter",
      name,
      key: pickByHash(fighterClasses, photo.id) as string,
      attackName: generateGolpe(name),
      missName: generateMiss(name),
      description: "Fighter criado a partir da captura.",
      confidence: 0.5,
      provider: "mock-gemini",
    };
  }

  const name = nameFromBank(CARD_FIRST, CARD_LAST, photo.id);
  return {
    target: "effect_card",
    name,
    key: pickByHash(cardCategories, photo.id) as string,
    attackName: name,
    missName: "",
    description: "Carta criada a partir da captura.",
    confidence: 0.5,
    provider: "mock-gemini",
  };
}

async function callGeminiBackend(photo: CapturedPhoto, target: TransformTarget): Promise<GeminiTransformResult> {
  const photoBase64 = await toBase64Payload(photo.uri);
  const { data, error } = await supabase.functions.invoke("gemini-transform", {
    body: { photoBase64, target },
  });

  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") throw new Error("Invalid edge function response.");

  const payload = data as Partial<GeminiTransformResult>;

  if (payload.target !== target) throw new Error("Edge function returned mismatched target.");

  if (target === "fighter") {
    const classKey = fighterClasses.includes(payload.key as typeof fighterClasses[number])
      ? payload.key
      : (pickByHash(fighterClasses, photo.id) as string);
    const name = typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : nameFromBank(FIGHTER_FIRST, FIGHTER_LAST, photo.id);

    return {
      target: "fighter",
      name,
      key: classKey as string,
      attackName: typeof payload.attackName === "string" && payload.attackName.trim()
        ? payload.attackName.trim()
        : generateGolpe(name),
      missName: typeof payload.missName === "string" && payload.missName.trim()
        ? payload.missName.trim()
        : generateMiss(name),
      description: typeof payload.description === "string" ? payload.description : "",
      confidence: typeof payload.confidence === "number" ? payload.confidence : 0.8,
      provider: "gemini-backend",
    };
  }

  const categoryKey = cardCategories.includes(payload.key as typeof cardCategories[number])
    ? payload.key
    : (pickByHash(cardCategories, photo.id) as string);
  const cardName = typeof payload.name === "string" && payload.name.trim()
    ? payload.name.trim()
    : nameFromBank(CARD_FIRST, CARD_LAST, photo.id);

  return {
    target: "effect_card",
    name: cardName,
    key: categoryKey as string,
    attackName: typeof payload.attackName === "string" && payload.attackName.trim()
      ? payload.attackName.trim()
      : cardName,
    missName: "",
    description: typeof payload.description === "string" ? payload.description : "",
    confidence: typeof payload.confidence === "number" ? payload.confidence : 0.8,
    provider: "gemini-backend",
  };
}

export async function transformCapturedPhoto(input: {
  photo: CapturedPhoto;
  target: TransformTarget;
}): Promise<GeminiTransformResult> {
  try {
    return await callGeminiBackend(input.photo, input.target);
  } catch (err) {
    console.warn("[transform] Edge Gemini failed, using mock fallback:", String(err));
    return mockFallback(input.photo, input.target);
  }
}
