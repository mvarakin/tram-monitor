import type { SpeedPoint } from '../types/speed';
import type { TemperaturePoint } from '../types/temperature';
import type { Transport } from '../types/transport';

/*
 * Усредняем по номеру измерения, а не по времени:
 * все истории одной длины и растут общим тактом
 * опроса, поэтому i-е точки — это один момент.
 *
 * Округляем до десятых, как значения из API.
 */
function averageAt<TPoint>(
  transports: Transport[],
  index: number,
  getHistory: (transport: Transport) => TPoint[],
  getValue: (point: TPoint) => number,
): number {
  let sum = 0;

  let count = 0;

  for (const transport of transports) {
    const point = getHistory(transport)[index];

    if (!point) {
      continue;
    }

    sum += getValue(point);

    count++;
  }

  return Number((sum / count).toFixed(1));
}

export function averageTemperatureHistory(transports: Transport[]): TemperaturePoint[] {
  const [first] = transports;

  if (!first) {
    return [];
  }

  return first.history.map((point, index) => ({
    timestamp: point.timestamp,

    temperature: averageAt(
      transports,
      index,
      (transport) => transport.history,
      (historyPoint) => historyPoint.temperature,
    ),
  }));
}

export function averageSpeedHistory(transports: Transport[]): SpeedPoint[] {
  const [first] = transports;

  if (!first) {
    return [];
  }

  return first.speedHistory.map((point, index) => ({
    timestamp: point.timestamp,

    speed: averageAt(
      transports,
      index,
      (transport) => transport.speedHistory,
      (historyPoint) => historyPoint.speed,
    ),
  }));
}
