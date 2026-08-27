import { BATTERY_COLORS } from '../constants';

export function getBatteryColor(index: number): string {
  return BATTERY_COLORS[index % BATTERY_COLORS.length];
}
