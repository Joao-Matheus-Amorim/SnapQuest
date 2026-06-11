# SnapQuest - Fluxo de Transformacao com Gemini

Ultima atualizacao: 2026-06-10.

## Decisao de arquitetura

A foto original nao entra direto no deck.

Ela entra primeiro em uma fila de Capturas Brutas. Depois o jogador escolhe se aquela foto vira Fighter ou Carta, confirma o nome e so entao o item final e salvo.

Fluxo correto:

```txt
Camera/Galeria -> Capturas Brutas -> Nome/IA -> Persistencia da foto -> Fighter ou Carta -> Deck -> Sync cloud opcional
```

## Implementacao atual

| Etapa | Arquivo | Status |
|---|---|---|
| Captura de foto | `src/app/camera.tsx` | Implementado |
| Fila de capturas brutas | `src/hooks/useCapturedPhotos.ts` | Implementado |
| Transformacao offline | `mockTransform` em `src/services/geminiTransform.ts` | Implementado |
| Gemini via backend | `transformCapturedPhoto` em `src/services/geminiTransform.ts` + `supabase/functions/gemini-transform` | Implementado |
| Modal de nome | `src/components/NameInputModal.tsx` | Implementado |
| Persistencia de foto final | `src/lib/photoStorage.ts` | Implementado |
| Criacao do item | `src/hooks/usePlayerDeck.ts` e `src/app/inventory.tsx` | Implementado |
| Revelacao visual | `src/components/RevealModal.tsx` | Implementado em MVP |
| Cerimonia completa | A definir | Pendente |

## Estados do fluxo

### 1. Captura bruta

Contrato:

```ts
CapturedPhoto = {
  id: string;
  uri: string;
  assetId?: string;
  filename?: string;
  createdAt: string;
  source: "camera" | "gallery";
  status: "raw";
}
```

A captura bruta:

- aparece em Pendentes;
- nao conta para batalha;
- nao aparece como item jogavel;
- so e removida depois que o item final foi salvo.

### 2. Nome e IA opcional

Por padrao, o app gera uma sugestao offline deterministica.

Se o usuario pedir IA:

- a imagem e redimensionada para 512px;
- o app envia a imagem reduzida para a edge function `gemini-transform`;
- a edge function tenta a cadeia de modelos configurada;
- erro de edge, 429, 404 ou falha de JSON cai para fallback;
- o resultado e normalizado antes de criar item.

### 3. Item final

Para Fighter, o core usa `createFighter`.

Para Carta, o core usa `createEffectCard`.

Antes de salvar:

- a foto e persistida em arquivo permanente no dispositivo;
- o nome e confirmado;
- a captura bruta permanece ate o sucesso da criacao.

## Contrato Gemini

### Fighter

Campos esperados:

```json
{
  "kind": "fighter",
  "name": "Guardiao da Caneca",
  "classKey": "guerreiro",
  "attackName": "Corte da Porcelana",
  "missName": "escorregou no cafe",
  "description": "Um defensor improvisado criado a partir da foto.",
  "confidence": 0.82
}
```

Classes permitidas:

```txt
guerreiro, arqueiro, mago, paladino
```

### Carta

Campos esperados:

```json
{
  "kind": "effect_card",
  "name": "Pocao de Mesa",
  "categoryKey": "consumivel",
  "attackName": "Mesa Revigorante",
  "description": "Uma carta de efeito inspirada no objeto fotografado.",
  "confidence": 0.79
}
```

Categorias permitidas:

```txt
natural, consumivel, ferramenta, criatura, vestimenta, fogo, liquido, conhecimento
```

## Variaveis de ambiente

```txt
GEMINI_API_KEY=
GEMINI_MODELS=
```

`GEMINI_MODELS` aceita lista separada por virgula e fica no ambiente privado da edge function.

## Restricao de producao

O app nao guarda mais a chave Gemini. O segredo fica na edge function.

Para producao:

- deployar `supabase/functions/gemini-transform`;
- mover a API key para ambiente privado;
- rate limit por usuario;
- registrar erro/cota;
- manter fallback offline.

## Regra de ouro

A captura bruta so pode ser removida depois que o item final for salvo com sucesso.

Nunca remover a foto antes de concluir a criacao do Fighter ou Carta.
