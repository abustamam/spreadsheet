/**
 * Format a raw cell string for display.
 *
 * Rules:
 * - Empty string → ""
 * - Non-numeric string → return as-is
 * - "$" prefix → strip prefix, format number, re-add "$"
 * - Pure number (int or decimal) → format with thousands separator
 * - Negative numbers → preserve the minus sign
 */
export function formatValue(raw: string): string {
  if (!raw || raw.trim() === '') return '';

  const trimmed = raw.trim();

  // Currency: starts with $ (optionally negative after $)
  if (trimmed.startsWith('$')) {
    const rest = trimmed.slice(1);
    const formatted = formatNumber(rest);
    return formatted !== null ? `$${formatted}` : trimmed;
  }

  // Plain number
  const formatted = formatNumber(trimmed);
  return formatted !== null ? formatted : trimmed;
}

/**
 * Format a numeric string with thousands separators.
 * Returns null if the string is not a valid number.
 */
function formatNumber(value: string): string | null {
  // Allow optional leading minus, digits, optional decimal point + digits
  if (!/^-?\d*\.?\d+$/.test(value) && !/^-?\d+\.?\d*$/.test(value)) {
    return null;
  }

  const num = parseFloat(value);
  if (isNaN(num)) return null;

  // Check if original had decimal component
  const hasDecimal = value.includes('.');
  if (hasDecimal) {
    // Preserve original decimal places
    const decimalPlaces = value.split('.')[1]?.length ?? 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }

  return num.toLocaleString('en-US', {
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
  return /^-?\d*\.?\d+$/.test(withoutCurrency) || /^-?\d+\.?\d*$/.test(withoutCurrency);
}
