/**
 * Format a raw cell string for display.
 *
 * Rules:
 * - Empty string → ""
 * - Non-numeric string → return as-is
 * - "$" prefix → format as USD currency via Intl.NumberFormat
 *     - No decimal typed ($10)    → $10      (0 fraction digits)
 *     - Decimal typed ($10.0)     → $10.00   (min 2 fraction digits)
 *     - Extra precision ($10.123) → $10.123  (preserve original places)
 * - Pure number (int or decimal) → format with thousands separator
 * - Negative numbers → preserve the minus sign
 */
export function formatValue(raw: string): string {
  if (!raw || raw.trim() === '') return '';

  const trimmed = raw.trim();

  // Currency: starts with $ (optionally negative after $)
  if (trimmed.startsWith('$')) {
    const rest = trimmed.slice(1);
    if (!isValidNumericString(rest)) return trimmed;
    const num = parseFloat(rest);
    if (isNaN(num)) return trimmed;

    const hasDecimal = rest.includes('.');
    const rawDecimalPlaces = hasDecimal ? (rest.split('.')[1]?.length ?? 0) : 0;
    // Currency convention: at least 2 decimal places when a decimal is present
    const fractionDigits = hasDecimal ? Math.max(2, rawDecimalPlaces) : 0;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  }

  // Plain number
  const formatted = formatNumber(trimmed);
  return formatted !== null ? formatted : trimmed;
}

function isValidNumericString(value: string): boolean {
  return /^-?\d*\.?\d+$/.test(value) || /^-?\d+\.?\d*$/.test(value);
}

/**
 * Format a numeric string with thousands separators.
 * Returns null if the string is not a valid number.
 */
function formatNumber(value: string): string | null {
  if (!isValidNumericString(value)) {
    return null;
  }

  const num = parseFloat(value);
  if (isNaN(num)) return null;
  const normalized = num === 0 ? 0 : num;

  // Check if original had decimal component
  const hasDecimal = value.includes('.');
  if (hasDecimal) {
    // Preserve original decimal places
    const decimalPlaces = value.split('.')[1]?.length ?? 0;
    return normalized.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }

  return normalized.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

/**
 * Returns true if a raw value should be right-aligned (numeric or currency).
 */
export function isNumericValue(raw: string): boolean {
  if (!raw || raw.trim() === '') return false;
  const trimmed = raw.trim();
  const withoutCurrency = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  return isValidNumericString(withoutCurrency);
}
