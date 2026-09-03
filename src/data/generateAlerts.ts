import { HOUR_MS, TEMPERATURE_DANGER, VOLTAGE_DANGER } from '../constants';
import { getLocalDayRange } from '../time';
import { clamp, mulberry32, pick, randInt, randRange, round1 } from './rng';

import type { Alert, AlertType } from '../types/alert';
import type { Rng } from './rng';

const DEFAULT_SEED = 20260901;

const CARRIAGE_POOL_SIZE = 6;
const CARRIAGE_TYPES = ['LVONOK', 'VITYAZ', 'KTM'];
const MIN_BATTERIES_PER_CARRIAGE = 2;
const MAX_BATTERIES_PER_CARRIAGE = 4;

/* Плотность алертов задаётся ставкой в час и домножается на прошедшее с полуночи время —
 * иначе фиксированное число событий на всё окно [полночь, сейчас] к вечеру размазывается
 * на много часов и график выглядит пустым. */
const BURSTS_PER_HOUR_MIN = 13.7;
const BURSTS_PER_HOUR_MAX = 20;
const BURST_EVENTS_MIN = 15;
const BURST_EVENTS_MAX = 60;
const BURST_STEP_MS = 1000;
const BURST_STEP_JITTER_MS = 300;

const TEMP_BASELINE_MIN = 25;
const TEMP_BASELINE_MAX = 35;
const VOLT_BASELINE_MIN = 380;
const VOLT_BASELINE_MAX = 420;

const TEMP_ALERT_MIN = 46;
const TEMP_ALERT_MAX = 55;

/*
 * Значение нарушающего параметра держится выше порога весь burst (батарея "провисла"
 * за пределами диапазона), с небольшим дрейфом — TEMP_DRIFT_STEP/VOLT_DRIFT_STEP ниже.
 * Верхняя граница voltage — как у criticalValueFor() в generateEdcStatistic.ts;
 * у temperature диапазон задан отдельно (TEMP_ALERT_MIN/MAX) шире и без привязки к нему.
 */
const DANGER_BY_TYPE: Record<AlertType, number> = {
  TEMPERATURE: TEMPERATURE_DANGER,
  VOLTAGE: VOLTAGE_DANGER,
};

const MAX_BY_TYPE: Record<AlertType, number> = {
  TEMPERATURE: TEMP_ALERT_MAX,
  VOLTAGE: 480,
};

/** Начальное значение нарушающего параметра берётся отсюда — не из узкой полосы над порогом,
 * иначе алерты одного типа кучкуются у danger вместо разброса по всему диапазону. */
const INIT_VALUE_RANGE: Record<AlertType, [number, number]> = {
  TEMPERATURE: [TEMP_ALERT_MIN, TEMP_ALERT_MAX],
  VOLTAGE: [VOLTAGE_DANGER + 0.1, VOLTAGE_DANGER + 5],
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
 * Один burst = одна (вагон, батарея, тип): батарея "сглючила" и это сразу серия из
 * BURST_EVENTS_MIN..MAX алертов подряд (не единичный выброс), с шагом ~раз в секунду
 * (с джиттером шага). Число событий выбирается сразу — длительность серии её побочный
 * эффект и может выйти за пределы минуты. Резерв места под burst считается по худшему
 * случаю шага; если в окне [windowStart, windowEnd] не хватает места — burst пропускается
 * (актуально сразу после полуночи).
 */
function generateBurst(rng: Rng, pool: CarriageFixture[], windowStart: number, windowEnd: number): Alert[] {
  const eventCount = randInt(rng, BURST_EVENTS_MIN, BURST_EVENTS_MAX);
  const reservedMs = eventCount * (BURST_STEP_MS + BURST_STEP_JITTER_MS);
  const maxStart = windowEnd - reservedMs;

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

  let t = Math.floor(randRange(rng, windowStart, maxStart));
  let value = randRange(rng, ...INIT_VALUE_RANGE[type]);

  const alerts: Alert[] = [];

  for (let i = 0; i < eventCount; i++) {
    value = clamp(value + randRange(rng, -driftStep, driftStep), danger + 0.1, max);

    const other = otherBaseline + randRange(rng, -otherJitter, otherJitter);

    alerts.push(makeAlert(type, carriage, batteryNumber, t, value, other));

    t += Math.round(clamp(BURST_STEP_MS + randRange(rng, -BURST_STEP_JITTER_MS, BURST_STEP_JITTER_MS), 400, 1600));
  }

  return alerts;
}

/** Алерты за сегодня: [локальная полночь, сейчас]. Формат — см. src/data/edc_alert_desc.ts. */
export function generateAlerts(seed = DEFAULT_SEED): Alert[] {
  const rng = mulberry32(seed);
  const pool = buildCarriagePool(rng);

  const [dayStart] = getLocalDayRange(Date.now());
  const windowStart = dayStart;
  const windowEnd = Date.now();

  const alerts: Alert[] = [];

  const elapsedHours = (windowEnd - windowStart) / HOUR_MS;

  const burstCount = randInt(rng, Math.round(BURSTS_PER_HOUR_MIN * elapsedHours), Math.round(BURSTS_PER_HOUR_MAX * elapsedHours));

  for (let i = 0; i < burstCount; i++) {
    alerts.push(...generateBurst(rng, pool, windowStart, windowEnd));
  }

  return alerts;
}
