import type { EdcStatistic } from '../types/edcStatistic';

function dataUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}data/${fileName}`;
}

export async function fetchAvailableDates(): Promise<string[]> {
  const response = await fetch(dataUrl('index.json'));

  if (!response.ok) {
    throw new Error(`Не удалось загрузить список дат: ${response.status}`);
  }

  const { dates } = (await response.json()) as { dates: string[] };

  return dates;
}

export async function fetchStatisticsForDate(date: string): Promise<EdcStatistic> {
  const response = await fetch(dataUrl(`statistics_${date}.json`));

  if (!response.ok) {
    throw new Error(`Не удалось загрузить статистику за ${date}: ${response.status}`);
  }

  return (await response.json()) as EdcStatistic;
}

export function resolveDate(requested: string | undefined, available: string[]): string | undefined {
  if (requested && available.includes(requested)) {
    return requested;
  }

  return available[0];
}
