const dateFmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'long' });

export function formatDate(ms: number): string {
  return dateFmt.format(new Date(ms));
}

export function formatTime(ms: number): string {
  return timeFmt.format(new Date(ms));
}

export function formatDateTime(ms: number): string {
  return `${formatDate(ms)}, ${formatTime(ms)}`;
}

export function formatWeekday(ms: number): string {
  return weekdayFmt.format(new Date(ms));
}

export function ageLabel(birthDate: number | null, now = Date.now()): string | null {
  if (birthDate == null) return null;
  const birth = new Date(birthDate);
  const today = new Date(now);
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return null;
  if (months < 24) return months === 1 ? '1 mês' : `${months} meses`;
  const years = Math.floor(months / 12);
  return `${years} anos`;
}
