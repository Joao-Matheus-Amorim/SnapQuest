# Regras de Batalha

Data de referencia: 2026-06-10.

Este documento registra o contrato atual da batalha local. A fonte executavel fica em `src/js/core/battle.js`; este documento serve para produto, QA e rastreabilidade.

## Condicao de inicio

- A batalha exige no minimo 6 Fighters e 6 Cartas.
- O setup divide 3 Fighters e 3 Cartas para cada jogador.
- Os 2 primeiros Fighters de cada time entram ativos; o terceiro fica como reserva.
- O time com maior soma de SPD efetivo inicia. Empate inicia com Jogador 1.

## Turno

1. O jogador compra no maximo 1 carta por turno.
2. O jogador pode selecionar uma carta e aplicar em aliado ou inimigo, conforme polaridade.
3. O jogador seleciona atacante e alvo.
4. O ataque rola d20, calcula dano, aplica queda/reserva e passa o turno se nao houver vencedor.

## Stats efetivos

ATK, DEF, LCK e SPD usam o valor base do Fighter somado aos buffs/debuffs de cartas.

O valor efetivo nunca fica abaixo de zero.

```txt
stat efetivo = max(0, stat base + buffs[stat])
```

## LCK

LCK controla a faixa de critico.

```txt
limiar critico = 20 - min(3, floor(LCK efetivo / 3))
```

Efeito atual:

- LCK 0 a 2: critico apenas no 20.
- LCK 3 a 5: critico em 19 ou 20.
- LCK 6 a 8: critico em 18, 19 ou 20.
- LCK 9 ou mais: critico em 17, 18, 19 ou 20.

Critico dobra o dano antes do multiplicador de classe.

## SPD

SPD tem dois efeitos:

- iniciativa inicial do time;
- pressao de ataque contra o alvo.

No ataque, a diferenca entre SPD efetivo do atacante e SPD efetivo do defensor gera um modificador de dano antes do multiplicador de classe.

```txt
modificador SPD = clamp(trunc((SPD atacante - SPD defensor) / 3), -3, 3)
dano base = max(1, ATK atacante + d20 + modificador SPD - DEF defensor)
```

O limite de -3 a +3 evita que SPD domine ATK, DEF, LCK e vantagem de classe.

## Classe

Vantagem de classe aplica multiplicador final:

- vantagem: 1.3x;
- desvantagem: 0.75x;
- neutro: 1x.

Ciclo atual:

```txt
guerreiro vence arqueiro
arqueiro vence mago
mago vence paladino
paladino vence guerreiro
```

## Falha critica

d20 igual a 1 causa falha critica.

Efeito:

- dano final fixo em 1;
- ignora critico e vantagem de classe.

## Reserva e vitoria

- Fighter com HP zero fica derrotado e sai do campo ativo.
- Se houver reserva viva, ela entra automaticamente.
- A batalha termina quando apenas um time tem Fighters vivos.
