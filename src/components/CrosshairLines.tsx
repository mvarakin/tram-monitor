import { TONE_COLOR } from './thresholds';

type CrosshairLinesProps = {
  x: number;
  y: number;
  /** Низ площадки: вертикальная направляющая доводится до оси времени. */
  bottom: number;
};

/* Пунктир мельче порогового ('6 4'), чтобы линии не путались. */
const DASHARRAY = '3 3';

const OPACITY = 0.9;

/** Направляющие от ромба под курсором к обеим осям. */
export function CrosshairLines({ x, y, bottom }: CrosshairLinesProps) {
  return (
    <g
      pointerEvents='none'
      stroke={TONE_COLOR.danger}
      strokeWidth={1}
      strokeDasharray={DASHARRAY}
      opacity={OPACITY}>
      <line x1={x} x2={x} y1={y} y2={bottom} />

      <line x1={0} x2={x} y1={y} y2={y} />
    </g>
  );
}
