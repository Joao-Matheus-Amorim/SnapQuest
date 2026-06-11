const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TransformTarget = "fighter" | "effect_card";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const DEFAULT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash",
  "gemini-3.5-flash",
];
const MODEL_CHAIN = (Deno.env.get("GEMINI_MODELS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const ACTIVE_MODELS = MODEL_CHAIN.length ? MODEL_CHAIN : DEFAULT_MODELS;

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

const FIGHTER_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON valido, sem markdown nem blocos de codigo:
{"kind":"fighter","name":"nome proprio criativo de personagem em portugues baseado no que voce ve","classKey":"guerreiro","attackName":"nome epico de um golpe especial inspirado na foto","missName":"frase curta e engracada do vacilo do personagem quando erra o ataque","description":"descricao curta de 1 frase em portugues","confidence":0.8}
Escolha classKey entre: guerreiro, arqueiro, mago, paladino.
Responda somente com o JSON, sem mais nada.`;

const CARD_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON valido, sem markdown nem blocos de codigo:
{"kind":"effect_card","name":"nome criativo de efeito magico em portugues baseado no que voce ve","categoryKey":"ferramenta","attackName":"nome alternativo do efeito","description":"descricao curta de 1 frase em portugues","confidence":0.8}
Escolha categoryKey entre: natural, consumivel, ferramenta, criatura, vestimenta, fogo, liquido, conhecimento.
Responda somente com o JSON, sem mais nada.`;

function urlFor(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function logInfo(message: string, meta?: Record<string, unknown>) {
  console.log(`[gemini-transform] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`);
}

function logWarn(message: string, meta?: Record<string, unknown>) {
  console.warn(`[gemini-transform] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`);
}

async function callOneModel(model: string, photoBase64: string, prompt: string): Promise<Record<string, unknown>> {
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: photoBase64 } },
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
    throw new Error(`${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const text =
    (data?.candidates as Array<Record<string, unknown>>)?.[0]
      ?.content as Record<string, unknown>;
  const raw =
    ((text?.parts as Array<Record<string, unknown>>)?.[0]?.text as string) ?? "";

  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : cleaned;
  if (!jsonStr) throw new Error("empty Gemini response");
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

async function callGemini(photoBase64: string, target: TransformTarget) {
  const prompt = target === "fighter" ? FIGHTER_PROMPT : CARD_PROMPT;
  let lastError: unknown = null;

  for (const model of ACTIVE_MODELS) {
    try {
      logInfo("calling model", { target, model });
      const json = await callOneModel(model, photoBase64, prompt);
      logInfo("model success", { target, model });
      return { json, model };
    } catch (error) {
      lastError = error;
      logWarn("model failed", { target, model, error: String(error).slice(0, 200) });
    }
  }

  throw lastError ?? new Error("No Gemini model available.");
}

Deno.serve(async (request) => {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  if (request.method === "OPTIONS") {
    logInfo("preflight", { requestId });
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    logWarn("method not allowed", { requestId, method: request.method });
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!GEMINI_API_KEY) {
    logWarn("missing secret", { requestId });
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as {
      photoBase64?: string;
      target?: TransformTarget;
    };

    const target = body.target === "fighter" || body.target === "effect_card" ? body.target : null;
    const photoBase64 = normalizeString(body.photoBase64);

    if (!target || !photoBase64) {
      logWarn("invalid payload", {
        requestId,
        hasTarget: Boolean(target),
        hasPhotoBase64: Boolean(photoBase64),
      });
      return new Response(JSON.stringify({ error: "photoBase64 and target are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logInfo("request received", {
      requestId,
      target,
      payloadBytes: photoBase64.length,
      modelCount: ACTIVE_MODELS.length,
    });

    const { json, model } = await callGemini(photoBase64, target);

    if (target === "fighter") {
      const classKey = fighterClasses.includes(json.classKey as typeof fighterClasses[number])
        ? json.classKey
        : "guerreiro";

      logInfo("request completed", {
        requestId,
        target,
        model,
        name: normalizeString(json.name, "unknown"),
        resolvedKey: classKey,
        durationMs: Date.now() - startedAt,
      });

      return new Response(JSON.stringify({
        target: "fighter",
        name: normalizeString(json.name),
        key: classKey,
        attackName: normalizeString(json.attackName),
        missName: normalizeString(json.missName),
        description: normalizeString(json.description),
        confidence: typeof json.confidence === "number" ? json.confidence : 0.8,
        provider: "gemini-backend",
        model,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryKey = cardCategories.includes(json.categoryKey as typeof cardCategories[number])
      ? json.categoryKey
      : "natural";

    logInfo("request completed", {
      requestId,
      target,
      model,
      name: normalizeString(json.name, "unknown"),
      resolvedKey: categoryKey,
      durationMs: Date.now() - startedAt,
    });

    return new Response(JSON.stringify({
      target: "effect_card",
      name: normalizeString(json.name),
      key: categoryKey,
      attackName: normalizeString(json.attackName),
      missName: "",
      description: normalizeString(json.description),
      confidence: typeof json.confidence === "number" ? json.confidence : 0.8,
      provider: "gemini-backend",
      model,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logWarn("request failed", {
      requestId,
      durationMs: Date.now() - startedAt,
      error: String(error).slice(0, 300),
    });
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
