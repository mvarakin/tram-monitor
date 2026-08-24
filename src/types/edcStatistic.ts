export type CriticalType = 'TEMPERATURE' | 'VOLTAGE';

export type CriticalEvent = {
  type: CriticalType;
  timestamp: string;
  value: number;
};

export type Battery = {
  number: string;
  avg_temp: number | null;
  avg_vol: number | null;
  critical: CriticalEvent[];
};

export type MinuteData = {
  from: string;
  to: string;
  batteries: Battery[];
};

export type Carriage = {
  number: string;
  type: string;
  data: MinuteData[];
};

export type EdcStatistic = {
  from: string;
  to: string;
  carriages: Carriage[];
};
