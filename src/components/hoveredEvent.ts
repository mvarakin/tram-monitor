import type { CriticalPoint } from '../data/carriageSelectors';

export function isSameEvent(
  hovered: { battery: string; event: CriticalPoint } | null,
  battery: string,
  event: CriticalPoint,
): boolean {
  return (
    hovered !== null &&
    hovered.battery === battery &&
    hovered.event.timestamp === event.timestamp &&
    hovered.event.value === event.value
  );
}
