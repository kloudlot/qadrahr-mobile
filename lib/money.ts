/**
 * Decimal places per currency (ISO 4217): the currencies that aren't 2.
 *
 * Mirrors the backend's catalogue (`common/money/iso-4217.ts`) and the web
 * console. The platform operator can enable any ISO currency, and the API
 * stores every amount in that currency's minor units — 1 for a yen, 1/1000
 * of a Kuwaiti dinar — so dividing by 100 everywhere showed a JPY payslip
 * a hundred times too small.
 */
const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE_DECIMAL = new Set([
  "BHD",
  "IQD",
  "JOD",
  "KWD",
  "LYD",
  "OMR",
  "TND",
]);

/** Decimal places for a currency; 2 when it isn't known yet. */
export function decimalsFor(currency: string | null | undefined): number {
  const code = (currency ?? "").toUpperCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

/** What an empty amount box shows: "0.00", "0" for yen, "0.000" for dinar. */
export function amountPlaceholder(currency: string | null | undefined): string {
  const digits = decimalsFor(currency);
  return digits ? `0.${"0".repeat(digits)}` : "0";
}

/** Integer minor units (what the API sends) → major units (what people read). */
export function toMajor(
  minorUnits: number,
  currency: string | null | undefined,
): number {
  return minorUnits / 10 ** decimalsFor(currency);
}

/** Major units (what people type) → integer minor units (what the API takes). */
export function toMinor(
  major: number,
  currency: string | null | undefined,
): number {
  return Math.round(major * 10 ** decimalsFor(currency));
}
