/**
 * Money representation for every FieldForge wire contract.
 *
 * Floating point dollars cannot represent common currency values exactly, so
 * every amount that crosses a service boundary — DTO field, event payload,
 * query parameter — is an integer count of **minor units** (cents for USD).
 * Fields carrying minor units are suffixed `Minor` so a reader never has to
 * guess the scale of a number named `amount`.
 *
 * The database keeps `DECIMAL(10,2)` columns, which MySQL returns to the driver
 * as strings. Convert at the repository edge with {@link decimalStringToMinor}
 * and {@link minorToDecimalString}; never let a `DECIMAL` string reach a
 * consumer as a `number`, and never let a major-unit float reach the database.
 */

/** Minor units in one major unit. USD only for now; see docs/SRS.md section 3. */
export const MINOR_UNITS_PER_MAJOR = 100;

/**
 * An integer count of minor units (e.g. 45000 === $450.00).
 *
 * This is a documentation alias rather than a branded type: the wire format is
 * JSON, so a nominal type would have to be cast away at every boundary. Runtime
 * enforcement belongs in the Zod validators, which use `z.number().int()`.
 */
export type MinorUnits = number;

/** Thrown when a value cannot be a valid minor-unit amount. */
export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** True when `value` is a safe, non-negative integer count of minor units. */
export function isMinorUnits(value: unknown): value is MinorUnits {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Throws unless `value` is a valid minor-unit amount. Returns it otherwise. */
export function assertMinorUnits(value: unknown, label = 'amount'): MinorUnits {
  if (!isMinorUnits(value)) {
    throw new MoneyError(
      `${label} must be a non-negative integer number of minor units, received: ${String(value)}`
    );
  }
  return value;
}

/**
 * Converts major units (what a user types: `450`, `12.34`) to minor units.
 *
 * Rounds to the nearest minor unit, because a major-unit float carrying more
 * precision than the currency supports has no exact representation to preserve.
 * Prefer {@link decimalStringToMinor} whenever the source is already a string,
 * since that path never touches floating point.
 */
export function toMinor(major: number): MinorUnits {
  if (typeof major !== 'number' || !Number.isFinite(major)) {
    throw new MoneyError(`Cannot convert non-finite value to minor units: ${String(major)}`);
  }
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

/**
 * Converts minor units back to major units for display.
 *
 * The result is a float and is therefore suitable for rendering only — never
 * for arithmetic, comparison, or persistence. Do the arithmetic in minor units.
 */
export function fromMinor(minor: MinorUnits): number {
  assertMinorUnits(minor, 'minor');
  return minor / MINOR_UNITS_PER_MAJOR;
}

/**
 * Formats minor units as a localized currency string (`45000` -> `"$450.00"`).
 */
export function formatMinor(
  minor: MinorUnits,
  options: { currency?: string; locale?: string } = {}
): string {
  const { currency = 'USD', locale = 'en-US' } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(fromMinor(minor));
}

/**
 * Parses a `DECIMAL(n,2)` string as returned by the MySQL driver (`"450.00"`)
 * into minor units, without going through a float.
 *
 * Accepts an optional sign, at most two fractional digits, and tolerates a
 * missing fractional part.
 */
export function decimalStringToMinor(decimal: string): MinorUnits {
  if (typeof decimal !== 'string' || !/^-?\d+(\.\d{1,2})?$/.test(decimal.trim())) {
    throw new MoneyError(`Not a DECIMAL(n,2) string: ${String(decimal)}`);
  }
  const [whole, fraction = ''] = decimal.trim().replace('-', '').split('.');
  const minor = Number(whole) * MINOR_UNITS_PER_MAJOR + Number(fraction.padEnd(2, '0'));
  return decimal.trim().startsWith('-') ? -minor : minor;
}

/**
 * Renders minor units as a `DECIMAL(n,2)` string for persistence (`45000` ->
 * `"450.00"`). Drizzle expects `decimal` columns as strings.
 */
export function minorToDecimalString(minor: MinorUnits): string {
  assertMinorUnits(minor, 'minor');
  const whole = Math.trunc(minor / MINOR_UNITS_PER_MAJOR);
  const fraction = minor % MINOR_UNITS_PER_MAJOR;
  return `${whole}.${String(fraction).padStart(2, '0')}`;
}
