/** MongoDB duplicate key xatosi (unique index buzilganda) */
export const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

/** Foydalanuvchi matnini regex uchun xavfsiz qilish (ReDoS / maxsus belgilar) */
export const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
