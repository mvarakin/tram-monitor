import { useId, type ReactNode } from 'react';

import { INNER_HEIGHT, INNER_WIDTH } from './chartLayout';

type PlotAreaProps = {
  children: ReactNode;
};

/*
 * Обрезает содержимое по области построения,
 * чтобы марки не выходили за оси.
 */
export function PlotArea({ children }: PlotAreaProps) {
  const clipId = useId();

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={INNER_WIDTH} height={INNER_HEIGHT} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>{children}</g>
    </>
  );
}
