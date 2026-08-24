import type { Tone } from './thresholds';

type InfoItemProps = {
  label: string;
  value: string;
  tone?: Tone;
  variant?: 'value' | 'status';
};

export function InfoItem({ label, value, tone, variant = 'value' }: InfoItemProps) {
  const base = variant === 'status' ? 'status' : 'info-value';

  const className = tone ? `${base} ${base}--${tone}` : base;

  return (
    <div className='info-item'>
      <span className='info-label'>{label}</span>

      <span className={className}>{value}</span>
    </div>
  );
}
