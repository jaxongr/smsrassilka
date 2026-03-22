/**
 * Normalizes a phone number for Uzbekistan.
 * Strips spaces, dashes, parentheses, and adds +998 prefix if needed.
 *
 * @param phone - Raw phone number string
 * @returns Normalized phone number in +998XXXXXXXXX format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading + for processing
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // If starts with 998 and has 12 digits total, it's already full format
  if (cleaned.startsWith('998') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If 9 digits starting with 9 (e.g., 901234567), add 998
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+998${cleaned}`;
  }

  // If 10 digits starting with 0 (e.g., 0901234567), strip 0 and add +998
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `+998${cleaned.substring(1)}`;
  }

  // If 11 digits starting with 8 (e.g., 89012345678 — old format), strip 8 and add +998
  if (cleaned.length === 11 && cleaned.startsWith('8')) {
    return `+998${cleaned.substring(2)}`;
  }

  // Return with + prefix for any other international number
  return `+${cleaned}`;
}
