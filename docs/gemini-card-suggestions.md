# Gemini para Sugestao de Cartas

Ultima atualizacao: 2026-06-10.

## Objetivo

Usar IA como assistente criativo para sugerir cartas a partir de fotos reais, sem substituir as regras do jogo.

## Dois contratos existem hoje

### 1. Contrato web/legado de sugestao

Local:

```txt
src/js/services/cardSuggestionService.js
```

Funcao:

```js
suggestCardFromPhoto({ photoUri, visualHint })
```

Status:

- mock/local;
- usado para travar contrato de sugestao estruturada;
- coberto por `scripts/check.mjs` e `scripts/check-card-suggestion.mjs`.

### 2. Contrato mobile de transformacao

Local:

```txt
src/services/geminiTransform.ts
```

Funcao:

```ts
transformCapturedPhoto({
  photo,
  target: "fighter" | "effect_card"
})
```

Status:

- Gemini real opcional;
- fallback offline deterministico;
- usado por `src/app/inventory.tsx`;
- documentado em `docs/gemini-transform-flow.md`.

## Regra principal

A IA nao cria carta final sozinha.

Ela pode sugerir:

- nome;
- categoria provavel;
- atributo provavel;
- polaridade provavel;
- golpe/efeito;
- descricao curta;
- justificativa visual.

O core continua responsavel por:

- validar categoria;
- validar atributo;
- validar polaridade;
- limitar intensidade;
- criar a Carta real;
- manter balanceamento.

## Exemplo do contrato legado

```json
{
  "schemaVersion": "card-suggestion-v1",
  "suggestedName": "Eco de Livro Azul",
  "shortLore": "Uma foto comum ganhou poder de aventura.",
  "categoryKey": "conhecimento",
  "polarityHint": "BÔNUS",
  "attributeHint": "LCK",
  "intensityHint": 1,
  "rarityHint": "Comum",
  "visualReason": "Sugestao baseada na pista visual.",
  "requiresReview": true,
  "source": "mock"
}
```

Observacao: o contrato legado atual valida `BÔNUS` e `DEBUFF`.

## Seguranca

O contrato mobile atual chama Gemini diretamente do app quando `EXPO_PUBLIC_GEMINI_API_KEY` existe.

Isso e aceitavel para prototipo, mas nao para producao.

Antes de producao:

- mover chamada Gemini para backend/edge function;
- guardar chave em env privada;
- aplicar rate limit;
- registrar falhas;
- preservar fallback offline.

## Fora do escopo deste documento

- Design visual da cerimonia.
- Supabase Storage.
- RLS de catalogo.
- Regras de batalha de LCK/SPD; fonte atual: `battle-rules.md`.
