const SIZE = 14;

export function AlertIcon() {
  return (
    <svg
      className='alert-icon'
      width={SIZE}
      height={SIZE}
      viewBox='0 0 16 16'
      fill='currentColor'
      aria-hidden='true'>
      <path d='M8 1.5 15.5 14.5H0.5L8 1.5Z' />
      <path d='M7.25 6h1.5l-0.25 4h-1L7.25 6Z' fill='white' />
      <circle cx='8' cy='12' r='0.8' fill='white' />
    </svg>
  );
}
