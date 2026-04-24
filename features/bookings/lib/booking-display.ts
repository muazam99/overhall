export function deriveBookingDisplayCode(bookingId: string) {
  const numericPart = bookingId.replace(/\D/g, "");
  if (numericPart.length >= 4) {
    return `BK-${numericPart.slice(-4).padStart(4, "0")}`;
  }

  let hash = 0;
  for (const char of bookingId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10000;
  }

  return `BK-${String(hash).padStart(4, "0")}`;
}
