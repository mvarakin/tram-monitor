import { CountdownRing } from './CountdownRing';

type ChartDescriptionProps = {
  title: string;
  description: string;
  updatedAt?: number;
};

export function ChartDescription({ title, description, updatedAt }: ChartDescriptionProps) {
  return (
    <div className='chart-description'>
      <h2>{title}</h2>

      <p>
        {description} <CountdownRing key={updatedAt} />
      </p>
    </div>
  );
}
