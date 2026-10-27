function toRupees(val: number): number {
  return val / 100;
}

export function formatPkrFull(paisa: number): string {
  if (paisa === 0) return 'Rs 0';
  const rupees = toRupees(paisa);
  const isNegative = rupees < 0;
  const abs = Math.abs(rupees);
  const formatted = abs.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  return isNegative ? `-Rs ${formatted}` : `Rs ${formatted}`;
}

export function formatPkrCompact(paisa: number): string {
  if (paisa === 0) return 'Rs 0';
  const rupees = toRupees(paisa);
  const isNegative = rupees < 0;
  const abs = Math.abs(rupees);

  let formatted = '';
  if (abs >= 10_000_000) {
    const cr = abs / 10_000_000;
    formatted = `${Math.round(cr * 10) / 10}Cr`;
  } else if (abs >= 100_000) {
    const lk = abs / 100_000;
    formatted = `${Math.round(lk * 10) / 10}L`;
  } else if (abs >= 1_000) {
    const k = abs / 1_000;
    formatted = `${Math.round(k * 10) / 10}K`;
  } else {
    formatted = `${Math.round(abs)}`;
  }

  return isNegative ? `-Rs ${formatted}` : `Rs ${formatted}`;
}

export function formatPercent(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-PK');
}

export function truncateChartLabel(label: string, maxChars = 22): string {
  const trimmed = label.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatDateLabel(
  dateStr: string,
  granularity: 'day' | 'week' | 'month' | 'hour' = 'day',
): string {
  if (!dateStr) return '';
  if (granularity === 'hour') {
    if (dateStr.includes('T')) {
      return dateStr.slice(11, 16);
    }
    return dateStr;
  }

  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthIdx = Number(parts[1]) - 1;
  const day = String(Number(parts[2]));
  const month = MONTH_NAMES[monthIdx] ?? parts[1];

  if (granularity === 'month') {
    return `${month} ${year}`;
  }

  return `${day} ${month}`;
}
