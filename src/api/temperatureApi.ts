import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import type { SpeedPoint } from '../types/speed';
import type { Transport } from '../types/transport';
import type { TemperaturePoint } from '../types/temperature';

const HISTORY_MINUTES = 60;

const MEASUREMENT_INTERVAL = 10 * 1000;

const HISTORY_POINTS = (HISTORY_MINUTES * 60 * 1000) / MEASUREMENT_INTERVAL + 1;

const MIN_TEMPERATURE = 10;
const MAX_TEMPERATURE = 100;

const MIN_SPEED = 0;
const MAX_SPEED = 120;

const MAX_CHANGE_PERCENT = 15;

function randomValue(previous: number, min: number, max: number): number {
  const change = (Math.random() * MAX_CHANGE_PERCENT * 2 - MAX_CHANGE_PERCENT) / 100;

  const value = previous * (1 + change);

  return Number(Math.min(max, Math.max(min, value)).toFixed(1));
}

function createTemperatureHistory(): TemperaturePoint[] {
  const now = Date.now();

  const history: TemperaturePoint[] = [];

  let temperature = Number(
    (MIN_TEMPERATURE + Math.random() * (MAX_TEMPERATURE - MIN_TEMPERATURE)).toFixed(1),
  );

  for (let index = 0; index < HISTORY_POINTS; index++) {
    const timestamp = now - (HISTORY_POINTS - 1 - index) * MEASUREMENT_INTERVAL;

    if (index > 0) {
      temperature = randomValue(temperature, MIN_TEMPERATURE, MAX_TEMPERATURE);
    }

    history.push({
      timestamp,
      temperature,
    });
  }

  return history;
}

function createSpeedHistory(): SpeedPoint[] {
  const now = Date.now();

  const history: SpeedPoint[] = [];

  let speed = Number((MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)).toFixed(1));

  for (let index = 0; index < HISTORY_POINTS; index++) {
    const timestamp = now - (HISTORY_POINTS - 1 - index) * MEASUREMENT_INTERVAL;

    if (index > 0) {
      speed = randomValue(speed, MIN_SPEED, MAX_SPEED);
    }

    history.push({
      timestamp,
      speed,
    });
  }

  return history;
}

function createTransports(): Transport[] {
  return Array.from({ length: 100 }, (_, index) => {
    const history = createTemperatureHistory();

    const speedHistory = createSpeedHistory();

    return {
      id: index + 1,
      name: `Транспорт ${index + 1}`,

      temperature: history[history.length - 1].temperature,

      history,

      speed: speedHistory[speedHistory.length - 1].speed,

      speedHistory,
    };
  });
}

let transports: Transport[] | null = null;

function getTransports(): Transport[] {
  if (!transports) {
    transports = createTransports();
  }

  return transports;
}

function updateTransports(): Transport[] {
  const currentTransports = getTransports();

  const now = Date.now();

  transports = currentTransports.map((transport) => {
    /*
     * Температура
     */

    const newTemperature = randomValue(transport.temperature, MIN_TEMPERATURE, MAX_TEMPERATURE);

    const newTemperaturePoint: TemperaturePoint = {
      timestamp: now,
      temperature: newTemperature,
    };

    const temperatureHistory = [...transport.history, newTemperaturePoint].slice(-HISTORY_POINTS);

    /*
     * Скорость
     */

    const newSpeed = randomValue(transport.speed, MIN_SPEED, MAX_SPEED);

    const newSpeedPoint: SpeedPoint = {
      timestamp: now,
      speed: newSpeed,
    };

    const speedHistory = [...transport.speedHistory, newSpeedPoint].slice(-HISTORY_POINTS);

    return {
      ...transport,

      temperature: newTemperature,
      history: temperatureHistory,

      speed: newSpeed,
      speedHistory,
    };
  });

  return transports;
}

export const temperatureApi = createApi({
  reducerPath: 'temperatureApi',

  baseQuery: fakeBaseQuery(),

  endpoints: (builder) => ({
    getTransports: builder.query<Transport[], void>({
      queryFn: async () => {
        if (!transports) {
          return {
            data: getTransports(),
          };
        }

        return {
          data: updateTransports(),
        };
      },
    }),
  }),
});

export const { useGetTransportsQuery } = temperatureApi;
