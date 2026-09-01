import { TEMPERATURE_DANGER, VOLTAGE_DANGER } from '../constants';
import { getLocalDayRange } from '../time';
import { clamp, mulberry32, pick, randInt, randRange, round1 } from './rng';

import type { Alert, AlertType } from '../types/alert';
import type { Rng } from './rng';

const DEFAULT_SEED = 20260901;

const CARRIAGE_POOL_SIZE = 6;
const CARRIAGE_TYPES = ['LVONOK', 'VITYAZ', 'KTM'];
const MIN_BATTERIES_PER_CARRIAGE = 2;
const MAX_BATTERIES_PER_CARRIAGE = 4;

const BURST_COUNT_MIN = 2;
const BURST_COUNT_MAX = 5;
const BURST_DURATION_MIN_SEC = 5;
const BURST_DURATION_MAX_SEC = 60;
const BURST_STEP_MS = 1000;
const BURST_STEP_JITTER_MS = 300;

const SINGLE_ALERT_COUNT_MIN = 0;
const SINGLE_ALERT_COUNT_MAX = 5;

const TEMP_BASELINE_MIN = 25;
const TEMP_BASELINE_MAX = 35;
const VOLT_BASELINE_MIN = 380;
const VOLT_BASELINE_MAX = 420;

/*
 * Значение нарушающего параметра держится выше порога весь burst (батарея "провисла"
 * за пределами диапазона), с небольшим дрейфом — TEMP_DRIFT_STEP/VOLT_DRIFT_STEP ниже.
 * Верхняя граница — как у criticalValueFor() в generateEdcStatistic.ts.
 */
const DANGER_BY_TYPE: Record<AlertType, number> = {
  TEMPERATURE: TEMPERATURE_DANGER,
  VOLTAGE: VOLTAGE_DANGER,
};

const MAX_BY_TYPE: Record<AlertType, number> = {
  TEMPERATURE: 60,
  VOLTAGE: 480,
};

const DRIFT_STEP_MAX: Record<AlertType, number> = {
  TEMPERATURE: 0.3,
  VOLTAGE: 3,
};

/** Диапазон правдоподобного значения второго (не нарушенного) параметра. */
const OTHER_BASELINE_RANGE: Record<AlertType, [number, number]> = {
  TEMPERATURE: [VOLT_BASELINE_MIN, VOLT_BASELINE_MAX],
  VOLTAGE: [TEMP_BASELINE_MIN, TEMP_BASELINE_MAX],
};

const OTHER_FIELD_JITTER: Record<AlertType, number> = {
  TEMPERATURE: 1,
  VOLTAGE: 0.3,
};

const ALERT_TYPES: AlertType[] = ['TEMPERATURE', 'VOLTAGE'];

type CarriageFixture = {
  number: string;
  type: string;
  batteryNumbers: string[];
};

function makeCarriageNumber(rng: Rng): string {
  const base = randInt(rng, 30000, 39999);
  const suffix = randInt(rng, 100, 999);
  return `${base}/${suffix}`;
}

function makeBatteryNumber(index: number): string {
  return `BAT-${String(index + 1).padStart(2, '0')}`;
}

function buildCarriagePool(rng: Rng): CarriageFixture[] {
  const pool: CarriageFixture[] = [];

  for (let c = 0; c < CARRIAGE_POOL_SIZE; c++) {
    const batteryCount = randInt(rng, MIN_BATTERIES_PER_CARRIAGE, MAX_BATTERIES_PER_CARRIAGE);

    pool.push({
      number: makeCarriageNumber(rng),
      type: pick(rng, CARRIAGE_TYPES),
      batteryNumbers: Array.from({ length: batteryCount }, (_, b) => makeBatteryNumber(b)),
    });
  }

  return pool;
}

function makeAlert(
  type: AlertType,
  carriage: CarriageFixture,
  batteryNumber: string,
  timestampMs: number,
  violatingValue: number,
  otherValue: number,
): Alert {
  return {
    type,
    timestamp: new Date(timestampMs).toISOString(),
    carriage_number: carriage.number,
    carriage_type: carriage.type,
    battery_number: batteryNumber,
    temperature: round1(type === 'TEMPERATURE' ? violatingValue : otherValue),
    voltage: round1(type === 'VOLTAGE' ? violatingValue : otherValue),
  };
}

function randomOtherValue(rng: Rng, type: AlertType): number {
  const [min, max] = OTHER_BASELINE_RANGE[type];

  return randRange(rng, min, max);
}

/*
 * Один burst = одна (вагон, батарея, тип), непрерывная серия алертов ~раз в секунду
 * (с джиттером шага), пока значение держится выше порога. Если в окне [windowStart, windowEnd]
 * не хватает места под минимальную длительность — burst пропускается (актуально сразу после полуночи).
 */
function generateBurst(rng: Rng, pool: CarriageFixture[], windowStart: number, windowEnd: number): Alert[] {
  const durationMs = randInt(rng, BURST_DURATION_MIN_SEC, BURST_DURATION_MAX_SEC) * 1000;
  const maxStart = windowEnd - durationMs;

  if (maxStart < windowStart) {
    return [];
  }

  const carriage = pick(rng, pool);
  const batteryNumber = pick(rng, carriage.batteryNumbers);
  const type = pick(rng, ALERT_TYPES);

  const danger = DANGER_BY_TYPE[type];
  const max = MAX_BY_TYPE[type];
  const driftStep = DRIFT_STEP_MAX[type];
  const otherJitter = OTHER_FIELD_JITTER[type];
  const otherBaseline = randomOtherValue(rng, type);

  const startMs = Math.floor(randRange(rng, windowStart, maxStart));
  const endMs = startMs + durationMs;

  let value = randRange(rng, danger + 0.1, danger + 5);

  const alerts: Alert[] = [];

  for (let t = startMs; t <= endMs; t += Math.round(clamp(BURST_STEP_MS + randRange(rng, -BURST_STEP_JITTER_MS, BURST_STEP_JITTER_MS), 400, 1600))) {
    value = clamp(value + randRange(rng, -driftStep, driftStep), danger + 0.1, max);

    const other = otherBaseline + randRange(rng, -otherJitter, otherJitter);

    alerts.push(makeAlert(type, carriage, batteryNumber, t, value, other));
  }

  return alerts;
}

function generateSingleAlert(rng: Rng, pool: CarriageFixture[], windowStart: number, windowEnd: number): Alert {
  const carriage = pick(rng, pool);
  const batteryNumber = pick(rng, carriage.batteryNumbers);
  const type = pick(rng, ALERT_TYPES);

  const danger = DANGER_BY_TYPE[type];
  const timestampMs = Math.floor(randRange(rng, windowStart, windowEnd));
  const value = randRange(rng, danger + 0.1, danger + 5);
  const other = randomOtherValue(rng, type);

  return makeAlert(type, carriage, batteryNumber, timestampMs, value, other);
}

/** Алерты за сегодня: [локальная полночь, сейчас]. Формат — см. src/data/edc_alert_desc.ts. */
export function generateAlerts(seed = DEFAULT_SEED): Alert[] {
  const rng = mulberry32(seed);
  const pool = buildCarriagePool(rng);

  const [dayStart] = getLocalDayRange(Date.now());
  const windowStart = dayStart;
  const windowEnd = Date.now();

  const alerts: Alert[] = [];

  const burstCount = randInt(rng, BURST_COUNT_MIN, BURST_COUNT_MAX);

  for (let i = 0; i < burstCount; i++) {
    alerts.push(...generateBurst(rng, pool, windowStart, windowEnd));
  }

  const singleCount = randInt(rng, SINGLE_ALERT_COUNT_MIN, SINGLE_ALERT_COUNT_MAX);

  for (let i = 0; i < singleCount; i++) {
    alerts.push(generateSingleAlert(rng, pool, windowStart, windowEnd));
  }

  return alerts;
}
