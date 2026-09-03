import { DAY_MS, TEMPERATURE_DANGER, VOLTAGE_DANGER } from '../constants';
import { getLocalDayRange, parseLocalDateInputValue } from '../time';
import { clamp, mulberry32, pick, randInt, randRange, round1 } from './rng';

import type {
  Battery,
  Carriage,
  CriticalEvent,
  CriticalType,
  EdcStatistic,
  MinuteData,
} from '../types/edcStatistic';
import type { Rng } from './rng';

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

const INCIDENT_COUNT_MIN = 1;
const INCIDENT_COUNT_MAX = 3;
const BURST_EVENTS_MIN = 15;
const BURST_EVENTS_MAX = 60;
const BURST_STEP_MS = 1000;
const BURST_STEP_JITTER_MS = 300;
const LAST_MINUTE_WINDOW = 3;

function getDayStart(date?: string): Date {
  const instant = date ? parseLocalDateInputValue(date) : Date.now();
  const [dayStart] = getLocalDayRange(instant);
  return new Date(dayStart);
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
  так что danger-тон в таблице поднимает любой critical-выброс — в том числе placeCriticalBurst.
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

/*
 * Один инцидент = одна (вагон, батарея, тип): серия из BURST_EVENTS_MIN..MAX critical-событий
 * подряд (не единичная точка), с шагом ~раз в секунду (с джиттером). Число событий выбирается
 * сразу — длительность серии её побочный эффект и может перекинуться на соседнюю минуту, events
 * просто попадают в MinuteData той минуты, куда пришёлся их timestamp. avg_temp/avg_vol серия не
 * трогает — critical остаётся точкой-выбросом поверх плавного тренда.
 */
function placeCriticalBurst(rng: Rng, carriages: Carriage[], dayStart: Date): void {
  const carriage = pick(rng, carriages);
  const batteryIndex = randInt(rng, 0, carriage.data[0].batteries.length - 1);
  const type = pick<CriticalType>(rng, ['TEMPERATURE', 'VOLTAGE']);

  const eventCount = randInt(rng, BURST_EVENTS_MIN, BURST_EVENTS_MAX);
  const reservedMs = eventCount * (BURST_STEP_MS + BURST_STEP_JITTER_MS);

  const windowStart = dayStart.getTime();
  const windowEnd = windowStart + MINUTES_PER_DAY * 60_000;
  const maxStart = windowEnd - reservedMs;

  if (maxStart < windowStart) {
    return;
  }

  let t = Math.floor(randRange(rng, windowStart, maxStart));

  for (let i = 0; i < eventCount; i++) {
    const minuteIndex = Math.min(Math.floor((t - windowStart) / 60_000), MINUTES_PER_DAY - 1);
    const battery = carriage.data[minuteIndex].batteries[batteryIndex];

    battery.critical.push({
      type,
      timestamp: new Date(t).toISOString(),
      value: criticalValueFor(rng, type),
    });

    t += Math.round(clamp(BURST_STEP_MS + randRange(rng, -BURST_STEP_JITTER_MS, BURST_STEP_JITTER_MS), 400, 1600));
  }
}

function injectCriticalEvents(rng: Rng, carriages: Carriage[], dayStart: Date): void {
  const lastMinuteIndex = randInt(rng, MINUTES_PER_DAY - LAST_MINUTE_WINDOW, MINUTES_PER_DAY - 1);
  placeDangerAvgEvent(rng, carriages, lastMinuteIndex);

  const incidentCount = randInt(rng, INCIDENT_COUNT_MIN, INCIDENT_COUNT_MAX);

  for (let i = 0; i < incidentCount; i++) {
    placeCriticalBurst(rng, carriages, dayStart);
  }
}

export function generateEdcStatistic(date?: string): EdcStatistic {
  const dayStart = getDayStart(date);
  const seed = date ? DEFAULT_SEED + Math.floor(dayStart.getTime() / DAY_MS) : DEFAULT_SEED;
  const rng = mulberry32(seed);
  const dayEnd = new Date(dayStart.getTime() + MINUTES_PER_DAY * 60_000);

  const carriages = buildCarriages(rng, dayStart);
  injectCriticalEvents(rng, carriages, dayStart);

  return {
    from: dayStart.toISOString(),
    to: dayEnd.toISOString(),
    carriages,
  };
}
