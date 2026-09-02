import { TONE_COLOR, CROSSHAIR_DASHARRAY, CROSSHAIR_OPACITY } from '../constants';

type CrosshairLinesProps = {
  x: number;
  y: number;
  /** Y нижней границы бара (min value группы) — вторая горизонталь до оси Y. */
  yMin: number;
  /** Низ площадки: вертикальная направляющая доводится до оси времени. */
  bottom: number;
};

/** Направляющие от бара под курсором к обеим осям: вертикаль вниз и горизонтали по верхней и нижней границе. */
export function CrosshairLines({ x, y, yMin, bottom }: CrosshairLinesProps) {
  return (
    <g
      pointerEvents='none'
      stroke={TONE_COLOR.danger}
      strokeWidth={1}
      strokeDasharray={CROSSHAIR_DASHARRAY}
      opacity={CROSSHAIR_OPACITY}>
      <line x1={x} x2={x} y1={y} y2={bottom} />

      <line x1={0} x2={x} y1={y} y2={y} />

      <line x1={0} x2={x} y1={yMin} y2={yMin} />
    </g>
  );
}
