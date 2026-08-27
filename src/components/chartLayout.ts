import { PANEL_GAP } from './eventListLayout';

export const CHART_WIDTH = 1600;
export const CHART_HEIGHT = 500;

export const CHART_MARGIN = {
  top: 20,
  right: 90,
  bottom: 60,
  left: 60,
};

export type ChartLayout = {
  width: number;
  height: number;
  margin: typeof CHART_MARGIN;
  innerWidth: number;
  innerHeight: number;
};

/*
 * Размеры чарта под панель критических событий. Ширина всего svg не меняется (иначе
 * при width='100%' сжались бы и шрифты осей) — панель забирает место у правого поля.
 * Высота растёт, если строк больше, чем помещается: площадка растёт вместе с панелью,
 * так что ромбы и строки всегда лежат в одном вертикальном диапазоне.
 */
export function buildChartLayout(panel: { width: number; height: number } | null): ChartLayout {
  const margin = {
    ...CHART_MARGIN,
    right: panel ? PANEL_GAP + panel.width : CHART_MARGIN.right,
  };

  const height = Math.max(CHART_HEIGHT, margin.top + (panel?.height ?? 0) + margin.bottom);

  return {
    width: CHART_WIDTH,
    height,
    margin,
    innerWidth: CHART_WIDTH - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
  };
}
