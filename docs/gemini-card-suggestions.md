# Gemini para sugestao de cartas

## Objetivo

Usar IA como assistente criativo para sugerir cartas a partir de fotos reais, sem substituir as regras do jogo.

O fluxo alvo e:

```txt
foto real -> sugestao estruturada -> revisao humana -> core cria carta valida -> inventario
```

## Regra principal

A IA nao cria carta final sozinha.

Ela pode sugerir:

- nome da carta;
- lore curta;
- categoria provavel;
- atributo provavel;
- polaridade provavel;
- justificativa visual.

O core continua responsavel por:

- validar categoria;
- validar atributo;
- validar polaridade;
- limitar intensidade;
- criar a carta real;
- manter balanceamento.

## Contrato inicial

O contrato inicial vive em:

```txt
src/js/services/cardSuggestionService.js
```

A funcao principal e:

```js
suggestCardFromPhoto({ photoUri, visualHint })
```

Ela retorna uma sugestao estruturada, por exemplo:

```json
{
  "schemaVersion": "card-suggestion-v1",
  "suggestedName": "Eco de Livro Azul",
  "shortLore": "Uma foto comum ganhou poder de aventura.",
  "categoryKey": "conhecimento",
  "polarityHint": "BÔNUS",
  "attributeHint": "LCK",
  "intensityHint": 1,
  "rarityHint": "⚪ Comum",
  "visualReason": "Sugestao baseada na pista visual.",
  "requiresReview": true,
  "source": "mock"
}
```

## Estado atual

Nesta etapa, a implementacao e mock/local.

Ela existe para travar o contrato antes da integracao real com Gemini.

## Segurança

A chave da IA nao deve ficar no frontend web nem no app mobile.

Quando a integracao real entrar, o app deve chamar uma camada controlada de backend/Edge Function. Essa camada chama Gemini e devolve apenas a sugestao estruturada.

## Fora do escopo deste contrato

- Chamar Gemini real.
- Salvar carta no inventario.
- Salvar foto em Storage.
- Criar Fighter.
- Alterar balanceamento.
- Liberar batalha.

## Proximos PRs

1. Ligar tela de foto/carta ao adapter mock.
2. Criar revisao humana antes de salvar.
3. Chamar backend/Edge Function para IA real.
4. Validar retorno da IA contra o contrato.
5. Integrar com `createEffectCard` para criar carta real aprovada.
