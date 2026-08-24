/*
 * Категориальная палитра (skill dataviz), без зелёного/красного —
 * они здесь заняты статусами normal/danger.
 */
const BATTERY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'];

export function getBatteryColor(index: number): string {
  return BATTERY_COLORS[index % BATTERY_COLORS.length];
}
