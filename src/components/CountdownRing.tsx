type CountdownRingProps = {
  durationMs?: number;
};

const RADIUS = 6.3;

const SIZE = 16;

const CENTER = SIZE / 2;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({ durationMs = 10000 }: CountdownRingProps) {
  return (
    <svg
      className='countdown-ring'
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <circle className='countdown-ring__track' cx={CENTER} cy={CENTER} r={RADIUS} />

      <circle
        className='countdown-ring__progress'
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        style={{
          strokeDasharray: CIRCUMFERENCE,
          animationDuration: `${durationMs}ms`,
          ['--countdown-ring-length' as string]: `${CIRCUMFERENCE}px`,
        }}
      />
    </svg>
  );
}
