export type Tone = 'normal' | 'warning' | 'danger';

export const TEMPERATURE_DANGER = 80;

export const SPEED_WARNING = 60;
export const SPEED_DANGER = 80;

export const TONE_COLOR: Record<Tone, string> = {
  normal: 'green',
  warning: '#ff8c00',
  danger: 'red',
};

export function getTemperatureTone(temperature: number): Tone {
  if (temperature > TEMPERATURE_DANGER) {
    return 'danger';
  }

  return 'normal';
}

export function getSpeedTone(speed: number): Tone {
  if (speed >= SPEED_DANGER) {
    return 'danger';
  }

  if (speed >= SPEED_WARNING) {
    return 'warning';
  }

  return 'normal';
}

/*
 * У температуры всего два состояния, поэтому warning
 * недостижим — запись нужна только для полноты Tone.
 */
export const TEMPERATURE_STATUS: Record<Tone, string> = {
  normal: 'НОРМА',
  warning: 'НОРМА',
  danger: 'ПЕРЕГРЕВ',
};

export const SPEED_STATUS: Record<Tone, string> = {
  normal: 'НОРМА',
  warning: 'ПОВЫШЕННАЯ',
  danger: 'ПРЕВЫШЕНИЕ',
};
