import { PERIOD_FORMAT } from '../constants';

export function formatDate(date: string): string {
  return new Date(date).toLocaleString('ru-RU', PERIOD_FORMAT);
}
