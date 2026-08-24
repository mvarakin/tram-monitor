import type { SpeedPoint } from './speed';
import type { TemperaturePoint } from './temperature';

export type Transport = {
  id: number;
  name: string;

  temperature: number;
  history: TemperaturePoint[];

  speed: number;
  speedHistory: SpeedPoint[];
};
