import { NOW_LINE_COLOR, NOW_LINE_WIDTH } from '../constants';

type NowLineProps = {
  x: number;
  bottom: number;
};

/** Вертикальная отметка текущего времени на оси X. */
export function NowLine({ x, bottom }: NowLineProps) {
  return (
    <line
      x1={x}
      x2={x}
      y1={0}
      y2={bottom}
      stroke={NOW_LINE_COLOR}
      strokeWidth={NOW_LINE_WIDTH}
      pointerEvents='none'
    />
  );
}
