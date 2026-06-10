import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { CapturedPhoto } from "../hooks/useCapturedPhotos";
import { generateGolpe, generateMiss } from "../js/core/balance.js";

export type TransformTarget = "fighter" | "effect_card";

export type GeminiTransformResult = {
  target: TransformTarget;
  name: string;
  key: string;
  attackName: string;
  missName: string;
  description: string;
  confidence: number;
  provider: "gemini" | "mock-gemini";
};

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Cadeia de modelos GRÁTIS que leem imagem, do maior pro menor bucket diário.
// Tenta um por um: se der 429 (cota) ou 404 (modelo ausente), pula pro próximo.
// Soma das cotas grátis ≈ 580 chamadas/dia. Modelos 2.0 ficam de fora (cota ZERO).
// Configurável pelo .env: EXPO_PUBLIC_GEMINI_MODELS="modelo1,modelo2,..."
const DEFAULT_MODELS = [
  "gemini-3.1-flash-lite", // ~500/dia
  "gemini-2.5-flash",      // 20/dia
  "gemini-2.5-flash-lite", // 20/dia
  "gemini-3-flash",        // 20/dia
  "gemini-3.5-flash",      // 20/dia
];
const ENV_MODELS = (process.env.EXPO_PUBLIC_GEMINI_MODELS ?? process.env.EXPO_PUBLIC_GEMINI_MODEL ?? "")
  .split(",").map((m: string) => m.trim()).filter(Boolean);
const MODEL_CHAIN = ENV_MODELS.length ? ENV_MODELS : DEFAULT_MODELS;

function urlFor(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
}

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

// Bancos de nomes pro mock (quando a IA não está disponível).
// Combinados por hash da foto => variados entre fotos, estáveis na mesma foto.
const FIGHTER_FIRST = ["Guardião", "Caçador", "Espírito", "Lorde", "Fera", "Sombra", "Mestre", "Brasa", "Lâmina", "Titã", "Fênix", "Lobo"];
const FIGHTER_LAST = ["do Vento", "das Trevas", "de Ferro", "do Trovão", "Selvagem", "Ancestral", "do Abismo", "Flamejante", "da Aurora", "Imortal", "do Caos", "Místico"];
const CARD_FIRST = ["Bênção", "Maldição", "Selo", "Toque", "Aura", "Eco", "Véu", "Marca", "Sopro", "Pulso", "Chama", "Onda"];
const CARD_LAST = ["do Trovão", "Sombrio", "da Vida", "Flamejante", "Gélido", "Ancestral", "do Vazio", "Radiante", "Venenoso", "Cósmico", "do Caos", "Astral"];

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

// Redimensiona pra no máx. 512px de largura e comprime em JPEG antes de enviar.
// Corta drasticamente o tamanho do payload (e o consumo de tokens da IA).
async function resizeToBase64(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 512 });
  const ref = await context.renderAsync();
  const result = await ref.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
  return result.base64 ?? "";
}

const FIGHTER_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON válido, sem markdown nem blocos de código:
{"kind":"fighter","name":"nome próprio criativo de personagem em português baseado no que você vê","classKey":"guerreiro","attackName":"nome épico de um golpe especial inspirado na foto","missName":"frase curta e engraçada do vacilo do personagem quando ERRA o ataque, com humor ligado à foto","description":"descrição curta de 1 frase em português","confidence":0.8}
Escolha classKey entre: guerreiro, arqueiro, mago, paladino.
O attackName deve soar como um golpe de RPG (ex: "Garras Fatais", "Corte do Dragão").
O missName é o que dá errado quando ele falha (ex: "tontura pelo cheiro de açúcar", "tropeçou na própria capa").
Responda somente com o JSON, sem mais nada.`;

const CARD_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON válido, sem markdown nem blocos de código:
{"kind":"effect_card","name":"nome criativo de efeito mágico em português baseado no que você vê","categoryKey":"ferramenta","attackName":"nome alternativo do efeito","description":"descrição curta de 1 frase em português","confidence":0.8}
Escolha categoryKey entre: natural, consumivel, ferramenta, criatura, vestimenta, fogo, liquido, conhecimento.
Responda somente com o JSON, sem mais nada.`;

async function callOneModel(model: string, base64: string, prompt: string): Promise<Record<string, unknown>> {
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
  };

  const response = await fetch(urlFor(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`${response.status}: ${errText.slice(0, 160)}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const text =
    (data?.candidates as Array<Record<string, unknown>>)?.[0]
      ?.content as Record<string, unknown>;
  const raw =
    ((text?.parts as Array<Record<string, unknown>>)?.[0]?.text as string) ?? "";

  // O modelo às vezes embrulha em ```json ... ``` ou adiciona texto antes/depois.
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : cleaned;
  if (!jsonStr) throw new Error(`resposta vazia. raw="${raw.slice(0, 120)}"`);
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

// Tenta cada modelo da cadeia até um funcionar. Retorna o JSON + qual modelo entregou.
async function callGemini(photo: CapturedPhoto, prompt: string): Promise<{ json: Record<string, unknown>; model: string }> {
  const base64 = await resizeToBase64(photo.uri);
  let lastErr: unknown;
  for (const model of MODEL_CHAIN) {
    try {
      const json = await callOneModel(model, base64, prompt);
      return { json, model };
    } catch (e) {
      lastErr = e;
      console.warn(`[transform] ↪ ${model} falhou (${String(e).slice(0, 80)}), tentando próximo...`);
    }
  }
  throw lastErr ?? new Error("nenhum modelo disponível");
}

// Geração offline instantânea (sem custo de IA). Usada por padrão na criação.
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

export async function transformCapturedPhoto(input: {
  photo: CapturedPhoto;
  target: TransformTarget;
}): Promise<GeminiTransformResult> {
  if (!API_KEY) {
    return mockFallback(input.photo, input.target);
  }

  try {
    const prompt = input.target === "fighter" ? FIGHTER_PROMPT : CARD_PROMPT;
    const { json, model } = await callGemini(input.photo, prompt);

    if (input.target === "fighter") {
      const classKey = fighterClasses.includes(json.classKey as typeof fighterClasses[number])
        ? (json.classKey as string)
        : (pickByHash(fighterClasses, input.photo.id) as string);
      const name = typeof json.name === "string" && json.name.trim()
        ? json.name.trim()
        : nameFromBank(FIGHTER_FIRST, FIGHTER_LAST, input.photo.id);

      console.log(`[transform] ✅ ${model} fighter:`, name, "| golpe:", json.attackName, "| miss:", json.missName);
      return {
        target: "fighter",
        name,
        key: classKey,
        attackName: typeof json.attackName === "string" && json.attackName.trim()
          ? json.attackName.trim()
          : generateGolpe(name),
        missName: typeof json.missName === "string" && json.missName.trim()
          ? json.missName.trim()
          : generateMiss(name),
        description: typeof json.description === "string" ? json.description : "",
        confidence: typeof json.confidence === "number" ? json.confidence : 0.8,
        provider: "gemini",
      };
    }

    const categoryKey = cardCategories.includes(json.categoryKey as typeof cardCategories[number])
      ? (json.categoryKey as string)
      : (pickByHash(cardCategories, input.photo.id) as string);
    const cardName = typeof json.name === "string" && json.name.trim()
      ? json.name.trim()
      : nameFromBank(CARD_FIRST, CARD_LAST, input.photo.id);

    console.log(`[transform] ✅ ${model} card:`, cardName);
    return {
      target: "effect_card",
      name: cardName,
      key: categoryKey,
      attackName: typeof json.attackName === "string" && json.attackName.trim()
        ? json.attackName.trim()
        : cardName,
      missName: "",
      description: typeof json.description === "string" ? json.description : "",
      confidence: typeof json.confidence === "number" ? json.confidence : 0.8,
      provider: "gemini",
    };
  } catch (err) {
    console.warn(`[transform] ⚠️ Todos os modelos [${MODEL_CHAIN.join(", ")}] falharam, usando mock. Último motivo:`, String(err));
    return mockFallback(input.photo, input.target);
  }
}
