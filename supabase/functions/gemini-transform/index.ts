const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TransformTarget = "fighter" | "effect_card";

// Aceita o segredo em qualquer um dos dois nomes para evitar quebra por nomenclatura.
const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ||
  Deno.env.get("EXPO_PUBLIC_GEMINI_API_KEY") ||
  "";

// Modelos validos e disponiveis (fallback garantido).
const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];
// Modelos extras opcionais via secret (tentados primeiro), seguidos SEMPRE
// pelos defaults validos — assim um nome inexistente no secret nao derruba tudo.
const MODEL_CHAIN = (Deno.env.get("GEMINI_MODELS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const ACTIVE_MODELS = [...new Set([...MODEL_CHAIN, ...DEFAULT_MODELS])];

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

const FIGHTER_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON valido, sem markdown nem blocos de codigo:
{"kind":"fighter","name":"nome proprio curto, memoravel, divertido ou grotesco em portugues baseado no objeto/ser real que voce ve","classKey":"guerreiro","attackName":"nome epico de um golpe especial inspirado na foto, no nome e na lore","missName":"frase curta e engracada, coerente com a foto, para falha critica em batalha","description":"fic de origem em 1 frase, no universo do jogo, sem explicar mecanica e sem mencionar golpe, vacilo, foto, carta ou fighter","confidence":0.8}
Escolha classKey entre: guerreiro, arqueiro, mago, paladino.
Regras de coerencia visual:
- objetos pesados, duros, pontudos ou ferramentas tendem a guerreiro.
- animais, plantas, objetos leves, longos ou de mira tendem a arqueiro.
- fogo, luz, telas, livros, simbolos ou objetos misteriosos tendem a mago.
- agua, comida, roupa, escudos, caixas, objetos protetores ou curativos tendem a paladino.
- Nao use fogo/chama/flamejante se a foto nao tiver sinal visual de fogo, calor ou luz intensa.
- O name deve parecer personagem de card game, curto, forte e especifico ao objeto/ser analisado.
- Varie o tom do name conforme a foto: fofo para objetos/seres fofos, bruto para objetos pesados/agressivos, grotesco para formas estranhas, divertido para objetos banais ou absurdos.
- Misture palavras de impacto com apelidos memoraveis quando fizer sentido, por exemplo estruturas como "Boca de Abismo", "Mugrento Dourado", "Bolota Arcana", "Dente-Roxo", "Princesa Ferrugem"; nao copie esses exemplos.
- Evite nomes simples demais como "Guardiao da Agua", "Mago do Livro", "Espada Mistica" ou combinacoes genericas de substantivo + elemento.
- Nao use sempre titulos nobres como Guardiao, Lorde, Mestre, Rei ou Sombra.
- A description deve ser uma fic de origem individual, com lugar, mito, maldicao, pacto, evento ou reputacao propria.
- Varie a estrutura da frase. Nao comece sempre com "[nome] surgiu", "[nome] nasceu", "foi criado" ou formulas parecidas.
- Nao copie exemplos, nao use template fixo e nao invente lore generica que serviria para qualquer imagem.
- attackName deve combinar com name e description.
- missName deve ser uma falha curta, fisica e coerente com o corpo/objeto/personagem inferido.
- A description NAO pode conter: foto, imagem, carta, fighter, usa, golpe, vacilo, ataque, falha, batalha.
Responda somente com o JSON, sem mais nada.`;

const CARD_PROMPT =
  `Analise esta foto e responda APENAS com um objeto JSON valido, sem markdown nem blocos de codigo:
{"kind":"effect_card","name":"nome curto, memoravel, divertido ou estranho em portugues baseado no objeto real que voce ve","categoryKey":"liquido","polarity":"BÔNUS","attribute":"HP","intensity":2,"attackName":"nome curto alternativo do efeito","description":"fic de origem em 1 frase, individual ao objeto analisado, incluindo naturalmente o efeito mecanico","confidence":0.8}
Escolha categoryKey entre: natural, consumivel, ferramenta, criatura, vestimenta, fogo, liquido, conhecimento.
Escolha polarity entre: BÔNUS, DEBUFF.
Escolha attribute entre: ATK, DEF, LCK, SPD, HP.
Escolha intensity entre 1 e 5.
Regras de coerencia visual:
- agua, copo, garrafa, suco, bebida, fonte ou liquido tendem a categoryKey liquido/consumivel, polarity BÔNUS e attribute HP.
- fogo, chama, sol, faca, ferramenta agressiva ou objeto cortante tendem a ATK.
- escudo, parede, capa, roupa, caixa resistente ou objeto protetor tendem a DEF.
- tenis, rodas, animal rapido, vento ou movimento tendem a SPD.
- livro, papel, tecnologia, simbolos, objeto curioso ou amuleto tendem a LCK.
- Nao use fogo/chama/flamejante se a foto nao tiver sinal visual de fogo, calor ou luz intensa.
- O name deve ter feel de card game: pode ser fofo, bruto, grotesco, ironico ou magico conforme a foto.
- Misture apelido + mito/efeito quando fizer sentido, por exemplo estruturas como "Caneco da Ressaca Eterna", "Meia do Azar", "Bolacha Oraculo", "Martelo Rabugento"; nao copie esses exemplos.
- Evite nomes simples demais como "Pocao de HP", "Aura da Sorte", "Selo Magico", "Copo de Agua" ou combinacoes genericas de objeto + atributo.
- Nao force tom sombrio quando a imagem for fofa, comum ou engraçada; a personalidade do nome deve nascer do objeto.
- A description deve ser uma fic de origem individual, com lugar, mito, maldicao, pacto, evento ou reputacao propria.
- Varie a estrutura da frase. Nao comece sempre com "[nome] surgiu", "[nome] nasceu", "foi criado" ou formulas parecidas.
- Nao copie exemplos, nao use template fixo e nao invente lore generica que serviria para qualquer imagem.
- A description deve incluir o efeito mecanico de forma natural, por exemplo informando que concede ou drena o atributo escolhido, mas sem usar frase pronta repetitiva.
- A description NAO pode conter: foto, imagem, carta, item, usa, golpe, vacilo, ataque, falha, batalha.
Responda somente com o JSON, sem mais nada.`;

function urlFor(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function promptWithNameHint(prompt: string, nameHint: string) {
  if (!nameHint) return prompt;

  return `${prompt}

Nome escolhido pelo usuario: "${nameHint}".
Use exatamente esse valor no campo "name". Nao sugira outro nome.
Gere todos os outros campos de forma coerente com esse nome e com a foto: classe/categoria, atributos, golpe, vacilo, efeito e description.
O resultado ainda deve ser apenas o JSON valido, sem markdown nem texto extra.`;
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

async function callGemini(photoBase64: string, target: TransformTarget, nameHint = "") {
  const basePrompt = target === "fighter" ? FIGHTER_PROMPT : CARD_PROMPT;
  const prompt = promptWithNameHint(basePrompt, nameHint);
  let lastError: unknown = null;

  for (const model of ACTIVE_MODELS) {
    try {
      logInfo("calling model", { target, model, hasNameHint: Boolean(nameHint) });
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
      nameHint?: string;
    };

    const target = body.target === "fighter" || body.target === "effect_card" ? body.target : null;
    const photoBase64 = normalizeString(body.photoBase64);
    const nameHint = normalizeString(body.nameHint).slice(0, 60);

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
      hasNameHint: Boolean(nameHint),
    });

    const { json, model } = await callGemini(photoBase64, target, nameHint);

    if (target === "fighter") {
      const classKey = fighterClasses.includes(json.classKey as typeof fighterClasses[number])
        ? json.classKey
        : "guerreiro";

      logInfo("request completed", {
        requestId,
        target,
        model,
        name: nameHint || normalizeString(json.name, "unknown"),
        resolvedKey: classKey,
        durationMs: Date.now() - startedAt,
      });

      return new Response(JSON.stringify({
        target: "fighter",
        name: nameHint || normalizeString(json.name),
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
    const polarity = cardPolarities.includes(json.polarity as typeof cardPolarities[number])
      ? json.polarity
      : "BÔNUS";
    const attribute = cardAttributes.includes(json.attribute as typeof cardAttributes[number])
      ? json.attribute
      : "LCK";
    const intensity = Math.max(1, Math.min(5, Math.round(Number(json.intensity) || 1)));

    logInfo("request completed", {
      requestId,
      target,
      model,
      name: nameHint || normalizeString(json.name, "unknown"),
      resolvedKey: categoryKey,
      durationMs: Date.now() - startedAt,
    });

    return new Response(JSON.stringify({
      target: "effect_card",
      name: nameHint || normalizeString(json.name),
      key: categoryKey,
      attackName: normalizeString(json.attackName),
      missName: "",
      description: normalizeString(json.description),
      polarity,
      attribute,
      intensity,
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
