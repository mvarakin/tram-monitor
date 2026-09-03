import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { isSameEvent } from './hoveredEvent';
import { TOOLTIP_ANCHOR_GAP, TOOLTIP_ARROW_MARGIN, TOOLTIP_EDGE_PADDING } from '../constants';

import type { CriticalPoint } from '../data/carriageSelectors';

export type SelectedEvent = { battery: string; event: CriticalPoint };

export type ChartAnchor = { left: number; top: number };

type ContainerSize = { width: number; height: number };

type UseEventSelectionParams = {
  /** Размер .chart-plot — нужен для flip/clamp тултипа в его границах. */
  containerSize: ContainerSize | null;
  /** Пиксельные координаты точки события внутри .chart-plot (до flip/clamp). */
  anchorOf: (selected: SelectedEvent) => ChartAnchor | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Клик по метке/строке события: открывает тултип справа от точки, повторный клик по той же
 * точке закрывает (toggle), клик по другой точке переключает сразу. Закрывается кликом снаружи
 * тултипа — см. stopPropagation() у вызывающих onClick (мет­ка, строка панели).
 */
export function useEventSelection({ containerSize, anchorOf }: UseEventSelectionParams) {
  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);

  // Two-pass измерение: первый рендер — у «сырого» анкора, эффект меряет реальный DOM
  // до пейнта (useLayoutEffect) и правит позицию — видимого скачка нет.
  useLayoutEffect(() => {
    if (!selected || !tooltipRef.current) {
      return;
    }

    const rect = tooltipRef.current.getBoundingClientRect();

    setTooltipSize((previous) =>
      previous && previous.width === rect.width && previous.height === rect.height
        ? previous
        : { width: rect.width, height: rect.height },
    );
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    // bubble-фаза: клик по метке/строке гасится их собственным stopPropagation раньше,
    // чем долетит сюда, поэтому здесь остаются только настоящие клики снаружи тултипа.
    const handleDocumentClick = (nativeEvent: MouseEvent) => {
      if (tooltipRef.current?.contains(nativeEvent.target as Node)) {
        return;
      }

      setSelected(null);
    };

    document.addEventListener('click', handleDocumentClick);

    return () => document.removeEventListener('click', handleDocumentClick);
  }, [selected]);

  const toggleSelected = useCallback((event: CriticalPoint, battery: string) => {
    setSelected((previous) => (previous && isSameEvent(previous, battery, event) ? null : { battery, event }));
  }, []);

  const anchor = selected ? anchorOf(selected) : null;

  const tooltipPosition = useMemo(() => {
    if (!anchor || !containerSize) {
      return null;
    }

    const width = tooltipSize?.width ?? 0;
    const height = tooltipSize?.height ?? 0;

    const fitsRight = anchor.left + TOOLTIP_ANCHOR_GAP + width + TOOLTIP_EDGE_PADDING <= containerSize.width;

    const left = fitsRight ? anchor.left + TOOLTIP_ANCHOR_GAP : anchor.left - TOOLTIP_ANCHOR_GAP - width;

    const top = clamp(
      anchor.top - height / 2,
      TOOLTIP_EDGE_PADDING,
      Math.max(TOOLTIP_EDGE_PADDING, containerSize.height - height - TOOLTIP_EDGE_PADDING),
    );

    // Стрелка-уголок указывает точно на anchor.top — карточку могло сдвинуть кламп-ом выше.
    const arrowTop = clamp(anchor.top - top, TOOLTIP_ARROW_MARGIN, Math.max(TOOLTIP_ARROW_MARGIN, height - TOOLTIP_ARROW_MARGIN));

    // Тултип справа от бара -> стрелка сидит на левом крае карточки (и наоборот).
    const side: 'left' | 'right' = fitsRight ? 'left' : 'right';

    return { left, top, side, arrowTop };
  }, [anchor, containerSize, tooltipSize]);

  return { selected, tooltipRef, tooltipPosition, toggleSelected };
}
