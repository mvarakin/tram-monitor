import { DANGER_ZONE_FILL, TONE_COLOR } from '../constants';

type DangerZoneProps = {
  y: number;
  width: number;
  height: number;
};

/** Аварийная зона оси значений: заливка выше порога и пунктирная отметка самого порога. */
export function DangerZone({ y, width, height }: DangerZoneProps) {
  // Порог может оказаться вне домена — отрицательная высота у rect это ошибка SVG.
  const zoneHeight = Math.max(0, Math.min(height, y));

  return (
    <>
      <rect x={0} y={0} width={width} height={zoneHeight} fill={DANGER_ZONE_FILL} />

      <line
        x1={0}
        x2={width}
        y1={y}
        y2={y}
        stroke={TONE_COLOR.danger}
        strokeDasharray='6 4'
        strokeWidth={1}
      />
    </>
  );
}
