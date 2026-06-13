# Regras de Batalha

Data de referencia: 2026-06-12.

Este documento registra o contrato atual da batalha local. A fonte executavel fica em `src/js/core/battle.js`; este documento serve para produto, QA e rastreabilidade.

## Condicao de inicio

- A batalha exige no minimo 6 Fighters e 6 Cartas.
- O setup divide 3 Fighters e 3 Cartas para cada jogador.
- Cada jogador entra com 3 Fighters em campo.
- O turno inicial e fixo no Jogador 1.
- SPD e LCK ficam reservados para uma versao futura e nao controlam iniciativa, critico ou dano nesta versao.

## Turno

1. No inicio do turno, o jogador recebe +1 de energia ate o maximo de 5.
2. A carta do turno e comprada automaticamente e entra na mao.
3. O jogador pode tocar em uma carta da mao e tocar no alvo correto, ou arrastar a carta ate o alvo.
4. Cartas de buff sao usadas em aliados; cartas de debuff sao usadas em inimigos.
5. Para atacar, o jogador toca em um Fighter do proprio campo e depois toca em um Fighter inimigo. Tambem pode arrastar o Fighter ate o inimigo.
6. Cada jogador pode fazer apenas 1 ataque por turno (total). Depois de atacar, o ataque fica indisponivel ate o proximo turno; o jogador ainda pode jogar cartas se tiver energia. Vacilo e ataque bloqueado por escudo tambem consomem o ataque do turno.
7. O turno so troca quando o jogador toca em `Encerrar Turno`.

## Energia

- Energia inicial efetiva no primeiro turno: 2/5, porque o jogador comeca com 1 e recebe +1 no inicio do turno.
- O custo da carta = o tier (intensidade), capado em 4: tier 1->1, 2->2, 3->3, 4->4, 5->4.
- Raridade e custo SEMPRE derivam da intensidade (fonte unica), igual ao bonus do fighter. Nao ha campo de raridade independente para divergir.
- Carta sem energia suficiente fica indisponivel na UI.
- Usar carta consome energia imediatamente.

## Stats efetivos

ATK, DEF, LCK, SPD e HP usam o valor base do Fighter somado aos buffs/debuffs de cartas quando aplicavel.

O valor efetivo nunca fica abaixo de zero.

```txt
stat efetivo = max(0, stat base + buffs[stat])
```

Na regra de dano atual, apenas ATK e DEF entram no calculo direto.

## Dano

O ataque usa faixa de dano calculada pelo core:

```txt
base = max(1, ATK atacante - floor(DEF defensor / 2))
min = max(1, round(base * multiplicador de classe))
max = max(2, round((base + 4) * multiplicador de classe))
dano = valor aleatorio entre min e max
```

## Classe

Vantagem de classe aplica multiplicador:

- vantagem: 1.25x;
- desvantagem: 0.85x;
- neutro: 1x.

Ciclo atual:

```txt
guerreiro vence arqueiro
arqueiro vence mago
mago vence paladino
paladino vence guerreiro
```

## Vacilo

Existe uma chance minima de vacilo no ataque.

Efeito atual:

- dano 0;
- o nome do vacilo do Fighter e retornado para a UI;
- a UI mostra o vacilo como evento cinematografico, sem expor mecanica de dado.

## Sorte de classe (proc de 30%)

Cada ataque tem 30% de chance de ativar o proc da classe do ATACANTE (puro dado):

- Guerreiro — Critico: dano x2.
- Arqueiro — Certeiro: ignora a DEF do alvo (recalcula o dano como dano cheio).
- Mago — Arcano: dano x1.6 e atravessa o escudo do alvo.
- Paladino — Escudo: e a sorte defensiva (ver abaixo), 30% de bloquear o golpe recebido.

So um proc por golpe, definido pela classe do atacante. O resultado retorna `critical` e `procName` para a UI.

## Habilidades passivas

> Provocar (taunt/agro) foi removido: ataques nao sao mais forcados a mirar um Fighter especifico.

### Escudo

Cada ataque recebido tem 30% de chance de ser bloqueado (dano 0). E pura sorte: o escudo nao e consumido e a chance vale para todo ataque enquanto o fighter viver.

### Veneno

Quando um Fighter com `veneno` acerta um ataque, o alvo recebe 1 de dano no inicio de cada turno afetado por 3 turnos.

## Queda e vitoria

- Fighter com HP zero fica marcado como derrotado e permanece visualmente no slot ate o fim do turno.
- No fim do turno, Fighters derrotados sao removidos do campo.
- A batalha termina quando apenas um jogador possui Fighters vivos.

## Fora de escopo atual

- Iniciativa por SPD.
- Critico por LCK.
- Economia, XP, moedas ou recompensas.
- Multiplayer online.
