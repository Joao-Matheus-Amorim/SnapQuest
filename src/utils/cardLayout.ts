/**
 * Zonas de conteúdo da carta em coordenadas RELATIVAS (0..1) ao tamanho do PNG.
 *
 * O template (9:16) já desenha: plate de título no topo, janela de arte grande,
 * divisor de diamante central, faixa de 5 slots de atributo, caixa de descrição
 * e plate de footer embaixo. Estas zonas posicionam o conteúdo dinâmico EXATAMENTE
 * sobre esses espaços vazios — sem redesenhar nada.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * COMO AJUSTAR (quando o PNG real entrar e algo sair do lugar):
 *   - x/y = canto superior-esquerdo da zona, como fração da largura/altura.
 *   - width/height = tamanho da zona, também em fração.
 *   - Aumente `y` para descer; aumente `x` para ir à direita.
 *   - Para centralizar horizontal: x = (1 - width) / 2.
 *   - Os 5 slots de stats são distribuídos automaticamente dentro de statsArea,
 *     então só mexa em statsArea (não nos slots individuais).
 * Valores são um ponto de partida calibrado pelo design enviado; refine no device.
 * ──────────────────────────────────────────────────────────────────────────
 */
export interface CardZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CARD_LAYOUT: Record<string, CardZone> = {
  /** Plate de título no topo da moldura. */
  titleArea: { x: 0.165, y: 0.052, width: 0.67, height: 0.058 },
  /** Janela central de arte/foto. */
  artArea: { x: 0.105, y: 0.150, width: 0.79, height: 0.455 },
  /** Faixa horizontal com os 5 slots de atributo. */
  statsArea: { x: 0.105, y: 0.650, width: 0.79, height: 0.082 },
  /** Caixa de descrição (ataque / passiva / vacilo). */
  descriptionArea: { x: 0.115, y: 0.752, width: 0.77, height: 0.120 },
  /** Plate inferior — rótulo de raridade. */
  footerArea: { x: 0.235, y: 0.905, width: 0.53, height: 0.045 },
};

/** Converte uma zona relativa em estilo absoluto para dado width/height de carta. */
export function zoneStyle(zone: CardZone, width: number, height: number) {
  return {
    position: "absolute" as const,
    left: zone.x * width,
    top: zone.y * height,
    width: zone.width * width,
    height: zone.height * height,
  };
}
