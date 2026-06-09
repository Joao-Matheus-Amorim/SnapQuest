import type { CapturedPhoto } from "../hooks/useCapturedPhotos";

export type TransformTarget = "fighter" | "effect_card";

export type GeminiTransformResult = {
  target: TransformTarget;
  name: string;
  key: string;
  description: string;
  confidence: number;
  provider: "mock-gemini";
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

export async function transformCapturedPhoto(input: {
  photo: CapturedPhoto;
  target: TransformTarget;
}): Promise<GeminiTransformResult> {
  const suffix = makeSuffix(input.photo);

  if (input.target === "fighter") {
    const classKey = pickByHash(fighterClasses, input.photo.id);

    return {
      target: "fighter",
      name: `Fighter ${suffix}`,
      key: classKey,
      description: "Mock Gemini: Fighter criado a partir da captura bruta.",
      confidence: 0.8,
      provider: "mock-gemini",
    };
  }

  const categoryKey = pickByHash(cardCategories, input.photo.id);

  return {
    target: "effect_card",
    name: `Carta ${suffix}`,
    key: categoryKey,
    description: "Mock Gemini: carta criada a partir da captura bruta.",
    confidence: 0.8,
    provider: "mock-gemini",
  };
}
