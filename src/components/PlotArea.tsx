import { useId, type ReactNode } from 'react';

type PlotAreaProps = {
  width: number;
  height: number;
  children: ReactNode;
};

/*
 * Обрезает содержимое по области построения,
 * чтобы марки не выходили за оси.
 */
export function PlotArea({ width, height, children }: PlotAreaProps) {
  const clipId = useId();

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={width} height={height} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>{children}</g>
    </>
  );
}
