import { env } from './env';

const LOCALE = 'en-US'; // pinned — identical SSR/client output (hydration-safe)
const formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: env.NEXT_PUBLIC_CURRENCY });

export function formatPrice(cents) {
  return formatter.format((Number(cents) || 0) / 100);
}

/** "12.5" | 12.5 | "" → 1250 | null. The ONLY place UI money → cents (ADR-07). */
export function dollarsToCents(input) {
  if (input === '' || input == null) return null;
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

/** 1250 → "12.5" for form inputs. */
export function centsToDollarInput(cents) {
  if (cents == null) return '';
  return String(cents / 100);
}