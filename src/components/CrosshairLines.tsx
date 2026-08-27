import { TONE_COLOR, CROSSHAIR_DASHARRAY, CROSSHAIR_OPACITY } from '../constants';

type CrosshairLinesProps = {
  x: number;
  y: number;
  /** Низ площадки: вертикальная направляющая доводится до оси времени. */
  bottom: number;
};

/** Направляющие от ромба под курсором к обеим осям. */
export function CrosshairLines({ x, y, bottom }: CrosshairLinesProps) {
  return (
    <g
      pointerEvents='none'
      stroke={TONE_COLOR.danger}
      strokeWidth={1}
      strokeDasharray={CROSSHAIR_DASHARRAY}
      opacity={CROSSHAIR_OPACITY}>
      <line x1={x} x2={x} y1={y} y2={bottom} />

      <line x1={0} x2={x} y1={y} y2={y} />
    </g>
  );
}
