/*
 * Диапазоны осей и окно истории — общие для всех графиков,
 * иначе панель транспорта и общая панель разъезжаются
 * по масштабу и их нельзя сравнивать глазами.
 */

export const TEMPERATURE_DOMAIN: [number, number] = [10, 100];

export const SPEED_DOMAIN: [number, number] = [0, 120];

export const HISTORY_WINDOW_MS = 60 * 60 * 1000;
