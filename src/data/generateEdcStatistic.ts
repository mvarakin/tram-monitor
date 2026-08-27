import { TEMPERATURE_DANGER, VOLTAGE_DANGER } from '../constants';

import type {
  Battery,
  Carriage,
  CriticalEvent,
  CriticalType,
  EdcStatistic,
  MinuteData,
} from '../types/edcStatistic';

const DEFAULT_SEED = 20260824;
const MINUTES_PER_DAY = 1440;

const CARRIAGE_COUNT = 3;
const CARRIAGE_TYPES = ['LVONOK', 'VITYAZ', 'KTM'];
const MIN_BATTERIES_PER_CARRIAGE = 2;
const MAX_BATTERIES_PER_CARRIAGE = 4;

const TEMP_BASELINE_MIN = 25;
const TEMP_BASELINE_MAX = 35;
const TEMP_STEP_MAX = 0.4;
const TEMP_CLAMP_MIN = 15;
const TEMP_CLAMP_MAX = 40;

const VOLT_BASELINE_MIN = 380;
const VOLT_BASELINE_MAX = 420;
const VOLT_STEP_MAX = 3;
const VOLT_CLAMP_MIN = 350;
const VOLT_CLAMP_MAX = 440;

const MIN_CRITICAL_EVENTS = 600;
const MAX_CRITICAL_EVENTS = 900;
const LAST_MINUTE_WINDOW = 3;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function randRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(randRange(rng, min, max + 1));
}

function pick<T>(rng: Rng, arr: T[]): T {
  return arr[randInt(rng, 0, arr.length - 1)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getDayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function makeCarriageNumber(rng: Rng): string {
  const base = randInt(rng, 30000, 39999);
  const suffix = randInt(rng, 100, 999);
  return `${base}/${suffix}`;
}

function makeBatteryNumber(index: number): string {
  return `BAT-${String(index + 1).padStart(2, '0')}`;
}

type WalkState = { temp: number; vol: number; };

function initWalkState(rng: Rng): WalkState {
  return {
    temp: randRange(rng, TEMP_BASELINE_MIN, TEMP_BASELINE_MAX),
    vol: randRange(rng, VOLT_BASELINE_MIN, VOLT_BASELINE_MAX),
  };
}

function stepWalkState(rng: Rng, state: WalkState): WalkState {
  return {
    temp: clamp(state.temp + randRange(rng, -TEMP_STEP_MAX, TEMP_STEP_MAX), TEMP_CLAMP_MIN, TEMP_CLAMP_MAX),
    vol: clamp(state.vol + randRange(rng, -VOLT_STEP_MAX, VOLT_STEP_MAX), VOLT_CLAMP_MIN, VOLT_CLAMP_MAX),
  };
}

function criticalValueFor(rng: Rng, type: CriticalType): number {
  return type === 'TEMPERATURE'
    ? randRange(rng, TEMPERATURE_DANGER + 0.1, 60)
    : randRange(rng, VOLTAGE_DANGER + 0.1, 480);
}

function buildCarriages(rng: Rng, dayStart: Date): Carriage[] {
  const carriages: Carriage[] = [];

  for (let c = 0; c < CARRIAGE_COUNT; c++) {
    const batteryCount = randInt(rng, MIN_BATTERIES_PER_CARRIAGE, MAX_BATTERIES_PER_CARRIAGE);
    const batteryNumbers = Array.from({ length: batteryCount }, (_, b) => makeBatteryNumber(b));
    let walkStates = batteryNumbers.map(() => initWalkState(rng));

    const data: MinuteData[] = [];
    for (let m = 0; m < MINUTES_PER_DAY; m++) {
      walkStates = walkStates.map((state) => stepWalkState(rng, state));

      const minuteFrom = new Date(dayStart.getTime() + m * 60_000);
      const minuteTo = new Date(minuteFrom.getTime() + 60_000);

      const batteries: Battery[] = walkStates.map((state, b) => ({
        number: batteryNumbers[b],
        avg_temp: round1(state.temp),
        avg_vol: round1(state.vol),
        critical: [],
      }));

      data.push({
        from: minuteFrom.toISOString(),
        to: minuteTo.toISOString(),
        batteries,
      });
    }

    carriages.push({
      number: makeCarriageNumber(rng),
      type: CARRIAGE_TYPES[c],
      data,
    });
  }

  return carriages;
}

function makeCriticalEvent(rng: Rng, minuteFrom: Date, type: CriticalType, minValue: number): CriticalEvent {
  const timestamp = new Date(minuteFrom.getTime() + randRange(rng, 0, 60_000));
  return {
    type,
    timestamp: timestamp.toISOString(),
    value: Math.max(minValue, criticalValueFor(rng, type)),
  };
}

/**
  getCarriageRows() (см. carriageSelectors.ts) считает макс за весь период и учитывает critical[],
  так что danger-тон в таблице поднимает любой critical-выброс — в том числе placeOutlierEvent.
  Эта функция дополнительно поднимает и сам avg выше порога: так в данных остаётся случай,
  когда вагон греется устойчиво, а не одной точкой-выбросом.
*/
function placeDangerAvgEvent(rng: Rng, carriages: Carriage[], minuteIndex: number): void {
  const carriage = pick(rng, carriages);
  const minute = carriage.data[minuteIndex];
  const battery = pick(rng, minute.batteries);
  const type = pick<CriticalType>(rng, ['TEMPERATURE', 'VOLTAGE']);
  const danger = type === 'TEMPERATURE' ? TEMPERATURE_DANGER : VOLTAGE_DANGER;
  const elevatedAvg = round1(randRange(rng, danger + 0.1, danger + 5));

  if (type === 'TEMPERATURE') {
    battery.avg_temp = elevatedAvg;
  } else {
    battery.avg_vol = elevatedAvg;
  }

  battery.critical.push(makeCriticalEvent(rng, new Date(minute.from), type, elevatedAvg));
}

function placeOutlierEvent(rng: Rng, carriages: Carriage[], minuteIndex: number): void {
  const carriage = pick(rng, carriages);
  const minute = carriage.data[minuteIndex];
  const battery = pick(rng, minute.batteries);
  const type = pick<CriticalType>(rng, ['TEMPERATURE', 'VOLTAGE']);
  battery.critical.push(makeCriticalEvent(rng, new Date(minute.from), type, 0));
}

function injectCriticalEvents(rng: Rng, carriages: Carriage[]): void {
  const eventCount = randInt(rng, MIN_CRITICAL_EVENTS, MAX_CRITICAL_EVENTS);

  const lastMinuteIndex = randInt(rng, MINUTES_PER_DAY - LAST_MINUTE_WINDOW, MINUTES_PER_DAY - 1);
  placeDangerAvgEvent(rng, carriages, lastMinuteIndex);

  for (let i = 1; i < eventCount; i++) {
    placeOutlierEvent(rng, carriages, randInt(rng, 0, MINUTES_PER_DAY - 1));
  }
}

export function generateEdcStatistic(seed = DEFAULT_SEED): EdcStatistic {
  const rng = mulberry32(seed);
  const dayStart = getDayStart();
  const dayEnd = new Date(dayStart.getTime() + MINUTES_PER_DAY * 60_000);

  const carriages = buildCarriages(rng, dayStart);
  injectCriticalEvents(rng, carriages);

  return {
    from: dayStart.toISOString(),
    to: dayEnd.toISOString(),
    carriages,
  };
}
