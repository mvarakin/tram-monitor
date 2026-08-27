import { PERIOD_FORMAT } from '../constants';

export function formatPeriod(from: string, to: string): string {
  const start = new Date(from).toLocaleString('ru-RU', PERIOD_FORMAT);

  const end = new Date(to).toLocaleString('ru-RU', PERIOD_FORMAT);

  return `${start} — ${end}`;
}
