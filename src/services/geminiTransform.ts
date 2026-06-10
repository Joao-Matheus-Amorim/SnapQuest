import type { CapturedPhoto } from "../hooks/useCapturedPhotos";

export type TransformTarget = "fighter" | "effect_card";

export type GeminiTransformResult = {
  target: TransformTarget;
  name: string;
  key: string;
  description: string;
  confidence: number;
  provider: "gemini" | "mock-gemini";
};

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

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

function hashText(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function pickByHash<T>(items: readonly T[], seed: string) {
  return items[hashText(seed) % items.length];
}

function makeSuffix(photo: CapturedPhoto) {
  return new Date(photo.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const FIGHTER_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON válido, sem markdown nem blocos de código:
{"kind":"fighter","name":"nome criativo em português baseado no que você vê","classKey":"guerreiro","description":"descrição curta de 1 frase em português","confidence":0.8}
Escolha classKey entre: guerreiro, arqueiro, mago, paladino.
Responda somente com o JSON, sem mais nada.`;

const CARD_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON válido, sem markdown nem blocos de código:
{"kind":"effect_card","name":"nome criativo em português baseado no que você vê","categoryKey":"ferramenta","description":"descrição curta de 1 frase em português","confidence":0.8}
Escolha categoryKey entre: natural, consumivel, ferramenta, criatura, vestimenta, fogo, liquido, conhecimento.
Responda somente com o JSON, sem mais nada.`;

async function callGemini(photo: CapturedPhoto, prompt: string): Promise<Record<string, unknown>> {
  const base64 = await uriToBase64(photo.uri);
  const mimeType = photo.uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini ${response.status}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const text =
    (data?.candidates as Array<Record<string, unknown>>)?.[0]
      ?.content as Record<string, unknown>;
  const raw =
    ((text?.parts as Array<Record<string, unknown>>)?.[0]?.text as string) ?? "";

  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function mockFallback(photo: CapturedPhoto, target: TransformTarget): GeminiTransformResult {
  const suffix = makeSuffix(photo);

  if (target === "fighter") {
    return {
      target: "fighter",
      name: `Fighter ${suffix}`,
      key: pickByHash(fighterClasses, photo.id) as string,
      description: "Mock: Fighter criado a partir da captura.",
      confidence: 0.5,
      provider: "mock-gemini",
    };
  }

  return {
    target: "effect_card",
    name: `Carta ${suffix}`,
    key: pickByHash(cardCategories, photo.id) as string,
    description: "Mock: carta criada a partir da captura.",
    confidence: 0.5,
    provider: "mock-gemini",
  };
}

export async function transformCapturedPhoto(input: {
  photo: CapturedPhoto;
  target: TransformTarget;
}): Promise<GeminiTransformResult> {
  if (!API_KEY) {
    return mockFallback(input.photo, input.target);
  }

  try {
    const prompt = input.target === "fighter" ? FIGHTER_PROMPT : CARD_PROMPT;
    const json = await callGemini(input.photo, prompt);

    if (input.target === "fighter") {
      const classKey = fighterClasses.includes(json.classKey as typeof fighterClasses[number])
        ? (json.classKey as string)
        : (pickByHash(fighterClasses, input.photo.id) as string);

      return {
        target: "fighter",
        name: typeof json.name === "string" ? json.name : `Fighter ${makeSuffix(input.photo)}`,
        key: classKey,
        description: typeof json.description === "string" ? json.description : "",
        confidence: typeof json.confidence === "number" ? json.confidence : 0.8,
        provider: "gemini",
      };
    }

    const categoryKey = cardCategories.includes(json.categoryKey as typeof cardCategories[number])
      ? (json.categoryKey as string)
      : (pickByHash(cardCategories, input.photo.id) as string);

    return {
      target: "effect_card",
      name: typeof json.name === "string" ? json.name : `Carta ${makeSuffix(input.photo)}`,
      key: categoryKey,
      description: typeof json.description === "string" ? json.description : "",
      confidence: typeof json.confidence === "number" ? json.confidence : 0.8,
      provider: "gemini",
    };
  } catch {
    return mockFallback(input.photo, input.target);
  }
}
