/**
 * Normalize phone number to 09XXXXXXXX format
 */
export function formatPhoneNumber(phoneNumber?: string): string | undefined {
  if (!phoneNumber) return phoneNumber;

  const digits = phoneNumber.replace(/\D/g, '');

  return digits;
}
