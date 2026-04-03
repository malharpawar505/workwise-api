export function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function getDayName(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

export function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function hoursToHM(hours) {
  if (!hours || hours <= 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function statusColor(status) {
  switch (status) {
    case 'extra': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    case 'complete': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    case 'deficit': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    case 'active': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400';
    case 'absent': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    default: return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400';
  }
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
