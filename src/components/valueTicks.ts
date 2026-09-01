const NICE_MULTIPLIERS = [1, 2, 5];

/** Ближайший "круглый" шаг (1/2/5 × 10ⁿ × minStep), дающий не более targetTicks делений. */
function chooseNiceStep(range: number, targetTicks: number, minStep: number): number {
  for (let magnitude = minStep; ; magnitude *= 10) {
    for (const multiplier of NICE_MULTIPLIERS) {
      const step = magnitude * multiplier;

      if (range / step <= targetTicks) {
        return step;
      }
    }
  }
}

/** Запас в тиках сверху/снизу за пределами [min, max]: одного шага не хватает — Math.ceil может
 * округлить "первый" тик почти вплотную к min (если min чуть меньше кратного step), и марка на
 * границе ляжет прямо на ось. Двух шагов запаса достаточно всегда: зазор > 1 * step. */
const EDGE_TICKS = 2;

/** Тики оси значений с адаптивным шагом: не мельче minStep — иначе подписи после округления дублируются. */
export function buildValueTicks(min: number, max: number, targetTicks: number, minStep: number): number[] {
  const step = chooseNiceStep(max - min || minStep, targetTicks, minStep);

  const first = Math.ceil(min / step) * step;

  const ticks: number[] = [];

  for (let tick = first; tick <= max; tick += step) {
    ticks.push(Number(tick.toFixed(10)));
  }

  if (ticks.length === 0) {
    // min === max и оно не кратно step — натуральных тиков нет, берём ближайший кратный как опору.
    ticks.push(Number((Math.round(min / step) * step).toFixed(10)));
  }

  for (let i = 0; i < EDGE_TICKS; i += 1) {
    ticks.unshift(Number((ticks[0] - step).toFixed(10)));
    ticks.push(Number((ticks[ticks.length - 1] + step).toFixed(10)));
  }

  return ticks;
}
