/**
 * Normalizes an Indian mobile number into a clean, 10-digit standard format (e.g. 9876543210).
 * Handles formats like:
 *  - "+91 98765 43210" -> "9876543210"
 *  - "91 9876543210"   -> "9876543210"
 *  - "919876543210"    -> "9876543210"
 *  - "09876543210"     -> "9876543210"
 *  - "9876543210"      -> "9876543210"
 */
export function normalizeIndianMobile(raw: string | null | undefined): string {
  if (!raw) return '';

  // 1. Remove all non-digit characters (spaces, dashes, plus signs, brackets)
  let digits = raw.replace(/\D/g, '');

  // 2. If 12 digits starting with '91' and the next digit is 6-9, strip country code
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    digits = digits.slice(2);
  }

  // 3. If 11 digits starting with '0' and the next digit is 6-9, strip leading zero
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    digits = digits.slice(1);
  }

  // 4. Return standard 10-digit string if valid length
  return digits.slice(0, 10);
}

/**
 * Validates if the normalized mobile number is a valid 10-digit Indian mobile.
 */
export function isValidIndianMobile(raw: string | null | undefined): boolean {
  const normalized = normalizeIndianMobile(raw);
  return /^[6-9]\d{9}$/.test(normalized);
}

/**
 * Formats a 10-digit mobile number for display with country code (e.g. "+91 98765 43210").
 */
export function formatIndianMobileDisplay(raw: string | null | undefined): string {
  const normalized = normalizeIndianMobile(raw);
  if (!normalized || normalized.length < 10) return raw || '—';
  return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
}
