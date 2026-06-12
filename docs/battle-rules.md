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
6. O turno so troca quando o jogador toca em `Encerrar Turno`.

## Energia

- Energia inicial efetiva no primeiro turno: 2/5, porque o jogador comeca com 1 e recebe +1 no inicio do turno.
- Cada carta tem custo calculado por raridade:
  - comum: 1 a 2;
  - incomum: 2;
  - raro: 3;
  - lendario/epico: 4.
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

## Habilidades passivas

### Provocar

Enquanto existir um Fighter inimigo vivo com `provocar`, ataques precisam mirar nele primeiro.

### Escudo

Bloqueia o primeiro ataque recebido e consome o escudo.

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
