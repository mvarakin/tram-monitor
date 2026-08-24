import { getSpeedTone, getTemperatureTone, TEMPERATURE_DANGER, type Tone } from './thresholds';

import type { SpeedPoint } from '../types/speed';
import type { TemperaturePoint } from '../types/temperature';

/*
 * Линия метрики режется на куски по порогам,
 * чтобы каждый кусок красился своим цветом.
 */
export type Segment<TPoint> = {
  tone: Tone;
  points: TPoint[];
};

export type TonePath = {
  tone: Tone;
  d: string;
};

export function createTemperatureSegments(data: TemperaturePoint[]): Segment<TemperaturePoint>[] {
  const segments: Segment<TemperaturePoint>[] = [];

  if (data.length === 0) {
    return segments;
  }

  let current: TemperaturePoint[] = [data[0]];

  let currentTone = getTemperatureTone(data[0].temperature);

  for (let i = 1; i < data.length; i++) {
    const previous = data[i - 1];
    const currentPoint = data[i];

    const previousTone = getTemperatureTone(previous.temperature);

    const pointTone = getTemperatureTone(currentPoint.temperature);

    if (previousTone === pointTone) {
      current.push(currentPoint);
      continue;
    }

    /*
     * Цвет меняется ровно на пороге, а не в точке
     * измерения — иначе излом уезжает от линии 80 °C.
     */
    const temperatureDifference = currentPoint.temperature - previous.temperature;

    const timeDifference = currentPoint.timestamp - previous.timestamp;

    const ratio = (TEMPERATURE_DANGER - previous.temperature) / temperatureDifference;

    const crossingPoint: TemperaturePoint = {
      timestamp: previous.timestamp + timeDifference * ratio,

      temperature: TEMPERATURE_DANGER,
    };

    current.push(crossingPoint);

    segments.push({
      tone: currentTone,
      points: current,
    });

    current = [crossingPoint, currentPoint];

    currentTone = pointTone;
  }

  segments.push({
    tone: currentTone,
    points: current,
  });

  return segments;
}

export function createSpeedSegments(data: SpeedPoint[]): Segment<SpeedPoint>[] {
  if (data.length === 0) {
    return [];
  }

  const segments: Segment<SpeedPoint>[] = [];

  let currentTone = getSpeedTone(data[0].speed);

  let currentPoints: SpeedPoint[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const point = data[i];

    const pointTone = getSpeedTone(point.speed);

    if (pointTone === currentTone) {
      currentPoints.push(point);
      continue;
    }

    /*
     * Цвет изменился.
     *
     * Добавляем предыдущий сегмент.
     */

    segments.push({
      tone: currentTone,
      points: currentPoints,
    });

    /*
     * Начинаем новый сегмент.
     */

    currentTone = pointTone;

    currentPoints = [data[i - 1], point];
  }

  segments.push({
    tone: currentTone,
    points: currentPoints,
  });

  return segments;
}

/*
 * Склеивает сегменты одного тона в один путь: куски
 * разделены командой M, поэтому линия не соединяется
 * через разрывы. Для сотни транспортов это разница
 * между парой узлов на транспорт и парой тысяч.
 */
export function buildTonePaths<TPoint>(
  segments: Segment<TPoint>[],
  x: (point: TPoint) => number,
  y: (point: TPoint) => number,
): TonePath[] {
  const commandsByTone = new Map<Tone, string>();

  for (const segment of segments) {
    if (segment.points.length === 0) {
      continue;
    }

    const command = segment.points
      .map(
        (point, index) => `${index === 0 ? 'M' : 'L'}${x(point).toFixed(1)} ${y(point).toFixed(1)}`,
      )
      .join(' ');

    const previous = commandsByTone.get(segment.tone);

    commandsByTone.set(segment.tone, previous ? `${previous} ${command}` : command);
  }

  return [...commandsByTone].map(([tone, d]) => ({ tone, d }));
}
