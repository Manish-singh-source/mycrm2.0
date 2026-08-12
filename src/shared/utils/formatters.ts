export function formatDate(value: unknown, locale = 'en-IN') {
  if (!value) return 'Not set';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: unknown, locale = 'en-IN') {
  if (!value) return 'Not set';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatCurrency(value: unknown, currency = 'INR', locale = 'en-IN') {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return 'Not set';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function maskSecret(value: unknown, visible = 4) {
  const text = String(value ?? '');
  if (!text) return 'Not set';
  if (text.length <= visible) return '*'.repeat(text.length);
  return `${'*'.repeat(Math.max(4, text.length - visible))}${text.slice(-visible)}`;
}
