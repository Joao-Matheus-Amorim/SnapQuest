# SnapQuest — Guia de transformação com Gemini

## Decisão de arquitetura

A foto original não deve entrar direto no deck.

Ela entra primeiro em uma fila temporária chamada Capturas Brutas. Essa fila guarda apenas a matéria-prima que ainda não virou item jogável.

O deck deve receber somente itens finais, isto é, Fighter ou Carta já transformados, com nome, tipo, atributos e descrição definidos.

## Por que não criar direto no deck?

Criar direto no deck antes do Gemini mistura três estados diferentes no mesmo lugar:

1. Foto bruta capturada.
2. Transformação em andamento.
3. Item final jogável.

Isso deixa o jogo confuso e abre espaço para falso positivo: o jogador veria algo no deck que ainda não é Fighter nem Carta de verdade.

A regra correta é:

```txt
Câmera -> Capturas Brutas -> Gemini -> Deck
```

## Estados do fluxo

### 1. Captura bruta

Criada pela câmera.

Campos mínimos:

```ts
CapturedPhoto = {
  id: string;
  uri: string;
  createdAt: string;
  source: "camera";
  status: "raw";
}
```

A captura bruta:

- aparece na área de pendentes;
- não conta para batalha;
- não aparece como Fighter ou Carta;
- pode ser transformada.

### 2. Transformação em andamento

Quando o jogador aperta Virar Fighter ou Virar Carta, o app deve:

1. bloquear os botões daquele item;
2. enviar a imagem para o serviço Gemini;
3. aguardar o retorno estruturado;
4. validar o retorno;
5. criar o item final;
6. remover a captura bruta.

Enquanto isso, o item pode aparecer como:

```txt
Transformando...
```

### 3. Item final no deck

Depois que o Gemini responder com sucesso, o app cria um item final.

Para Fighter:

```ts
GeneratedFighter = {
  type: "fighter";
  nome: string;
  classe: string;
  class_key: string;
  icon: string;
  hp: number;
  atk: number;
  def: number;
  lck: number;
  spd: number;
  foto: string;
  criado_em: string;
}
```

Para Carta:

```ts
GeneratedEffectCard = {
  type: "effect_card";
  nome_efeito: string;
  categoria: string;
  categoria_key: string;
  icon: string;
  polaridade: "BÔNUS" | "DEBUFF";
  atributo: "ATK" | "DEF" | "LCK" | "SPD";
  intensidade: number;
  raridade: string;
  foto: string;
  criado_em: string;
}
```

## Contrato esperado do Gemini

O Gemini não deve retornar texto livre para o app interpretar de forma frágil.

Ele deve retornar JSON validável.

### Fighter

```json
{
  "kind": "fighter",
  "name": "Guardião da Caneca",
  "classKey": "guerreiro",
  "description": "Um defensor improvisado criado a partir da foto.",
  "confidence": 0.82
}
```

Classes permitidas:

```txt
guerreiro, arqueiro, mago, paladino
```

### Carta

```json
{
  "kind": "effect_card",
  "name": "Poção de Mesa",
  "categoryKey": "consumivel",
  "description": "Uma carta de efeito inspirada no objeto fotografado.",
  "confidence": 0.79
}
```

Categorias permitidas:

```txt
natural, consumivel, ferramenta, criatura, vestimenta, fogo, liquido, conhecimento
```

## Serviço a criar

Criar:

```txt
src/services/geminiTransform.ts
```

Responsabilidades:

- receber `CapturedPhoto` e o tipo desejado: `fighter` ou `effect_card`;
- converter a imagem para formato aceito pela API;
- chamar Gemini;
- validar JSON de resposta;
- normalizar campos inválidos com fallback seguro;
- retornar um objeto limpo para o core criar Fighter ou Carta.

Assinatura sugerida:

```ts
export async function transformCapturedPhoto(input: {
  photoUri: string;
  target: "fighter" | "effect_card";
}): Promise<GeminiTransformResult>
```

## Variável de ambiente

A chave não deve ficar hardcoded.

Usar:

```txt
EXPO_PUBLIC_GEMINI_API_KEY=
```

Para MVP local, pode ficar no `.env`.

Antes de produção, a chamada ao Gemini deve sair do app e ir para backend/edge function, porque app mobile expõe variáveis públicas no bundle.

## Fluxo de implementação em PRs pequenos

### PR 1 — Storage e fila de capturas

Objetivo:

- câmera salva captura bruta;
- inventário mostra pendentes;
- pendentes não contam para batalha.

Status nesta branch: parcialmente implementado.

### PR 2 — Contrato Gemini mockado

Objetivo:

- criar `geminiTransform.ts` com implementação fake determinística;
- botão Virar Fighter/Carta usa esse serviço;
- item sai de pendentes e entra no deck.

Sem API real ainda.

### PR 3 — Gemini real

Objetivo:

- adicionar chamada real ao Gemini;
- validar JSON;
- tratar erro, loading e retry.

### PR 4 — UX final da transformação

Objetivo:

- loading por item;
- erro recuperável;
- preview do resultado;
- confirmação antes de remover a captura bruta.

## Regra de ouro

A captura bruta só pode ser removida depois que o item final for salvo com sucesso no deck.

Nunca remover a foto antes da criação do Fighter ou Carta terminar.
