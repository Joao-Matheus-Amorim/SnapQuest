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
  polarity?: "BÔNUS" | "DEBUFF";
  attribute?: "ATK" | "DEF" | "LCK" | "SPD" | "HP";
  intensity?: number;
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
const cardPolarities = ["BÔNUS", "DEBUFF"] as const;
const cardAttributes = ["ATK", "DEF", "LCK", "SPD", "HP"] as const;

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

function inferCardFromText(text: string) {
  const value = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(agua|copo|garrafa|suco|liquido|bebida|fonte|chuva|rio|lago)/.test(value)) {
    return {
      category: "liquido",
      attribute: "HP" as const,
    };
  }
  if (/(comida|fruta|pao|bolo|biscoito|lanche|doce)/.test(value)) {
    return {
      category: "consumivel",
      attribute: "HP" as const,
    };
  }
  if (/(chave|martelo|ferramenta|controle|caneta|tesoura|fone)/.test(value)) {
    return {
      category: "ferramenta",
      attribute: "ATK" as const,
    };
  }
  if (/(livro|caderno|papel|documento|tela|computador|teclado)/.test(value)) {
    return {
      category: "conhecimento",
      attribute: "LCK" as const,
    };
  }
  if (/(roupa|camisa|tenis|sapato|jaqueta|mochila)/.test(value)) {
    return {
      category: "vestimenta",
      attribute: "DEF" as const,
    };
  }
  if (/(gato|cachorro|animal|bicho|criatura|pata)/.test(value)) {
    return {
      category: "criatura",
      attribute: "SPD" as const,
    };
  }
  if (/(fogo|chama|vela|sol|luz|lampada)/.test(value)) {
    return {
      category: "fogo",
      attribute: "ATK" as const,
    };
  }

  return {
    category: pickByHash(cardCategories, text) as string,
    attribute: "LCK" as const,
  };
}

function inferFighterClassFromText(text: string) {
  const value = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(agua|copo|garrafa|suco|liquido|bebida|fonte)/.test(value)) {
    return "paladino";
  }
  if (/(livro|caderno|papel|documento|tela|computador|teclado|luz)/.test(value)) {
    return "mago";
  }
  if (/(gato|cachorro|animal|bicho|planta|folha|pena)/.test(value)) {
    return "arqueiro";
  }
  if (/(chave|martelo|ferramenta|controle|pedra|caixa|metal|faca)/.test(value)) {
    return "guerreiro";
  }

  return pickByHash(fighterClasses, text) as string;
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

function mockFallback(photo: CapturedPhoto, target: TransformTarget, nameHint = ""): GeminiTransformResult {
  if (target === "fighter") {
    const name = nameHint.trim() || nameFromBank(FIGHTER_FIRST, FIGHTER_LAST, photo.id);
    const classKey = inferFighterClassFromText(`${name} ${photo.id} ${photo.uri}`);
    return {
      target: "fighter",
      name,
      key: classKey,
      attackName: generateGolpe(name),
      missName: generateMiss(name),
      description: "",
      confidence: 0.5,
      provider: "mock-gemini",
    };
  }

  const name = nameHint.trim() || nameFromBank(CARD_FIRST, CARD_LAST, photo.id);
  const inferred = inferCardFromText(`${name} ${photo.id} ${photo.uri}`);
  return {
    target: "effect_card",
    name,
    key: inferred.category,
    attackName: name,
    missName: "",
    description: "",
    polarity: "BÔNUS",
    attribute: inferred.attribute,
    intensity: 1,
    confidence: 0.5,
    provider: "mock-gemini",
  };
}

function isRenderableUri(uri: string) {
  return uri.startsWith("file://") || uri.startsWith("http") || uri.startsWith("data:") || uri.startsWith("content://");
}

async function callGeminiBackend(photo: CapturedPhoto, target: TransformTarget, nameHint?: string): Promise<GeminiTransformResult> {
  // URIs ph:// (galeria iOS sem acesso total) podem TRAVAR o ImageManipulator. Aborta cedo.
  if (!isRenderableUri(photo.uri)) throw new Error("photo uri not renderable for AI");
  const photoBase64 = await toBase64Payload(photo.uri);
  const { data, error } = await supabase.functions.invoke("gemini-transform", {
    body: { photoBase64, target, nameHint: nameHint?.trim() || undefined },
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

  const polarity = cardPolarities.includes(payload.polarity as typeof cardPolarities[number])
    ? payload.polarity
    : "BÔNUS";
  const attribute = cardAttributes.includes(payload.attribute as typeof cardAttributes[number])
    ? payload.attribute
    : "LCK";
  const intensity = Math.max(1, Math.min(5, Math.round(Number(payload.intensity) || 1)));

  return {
    target: "effect_card",
    name: cardName,
    key: categoryKey as string,
    attackName: typeof payload.attackName === "string" && payload.attackName.trim()
      ? payload.attackName.trim()
      : cardName,
    missName: "",
    description: typeof payload.description === "string" ? payload.description : "",
    polarity,
    attribute,
    intensity,
    confidence: typeof payload.confidence === "number" ? payload.confidence : 0.8,
    provider: "gemini-backend",
  };
}

export async function transformCapturedPhoto(input: {
  photo: CapturedPhoto;
  target: TransformTarget;
  nameHint?: string;
}): Promise<GeminiTransformResult> {
  try {
    // Nunca trava: corre contra um timeout. Se demorar/pendurar, cai no offline.
    return await Promise.race([
      callGeminiBackend(input.photo, input.target, input.nameHint),
      new Promise<GeminiTransformResult>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout (15s)")), 15000)
      ),
    ]);
  } catch (err) {
    console.warn("[transform] Edge Gemini failed, using mock fallback:", String(err));
    return mockFallback(input.photo, input.target, input.nameHint);
  }
}
