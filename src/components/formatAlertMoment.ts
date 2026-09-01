const ALERT_MOMENT_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
};

export function formatAlertMoment(timestamp: string): string {
  return new Date(timestamp).toLocaleString('ru-RU', ALERT_MOMENT_FORMAT);
}
