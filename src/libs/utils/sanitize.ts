/**
 * pickFields — so'rovdan (req.body) faqat ruxsat etilgan maydonlarni oladi.
 * Mass assignment hujumidan himoya: mijoz yuborgan ortiqcha maydonlar
 * (memberType, memberPoints, productViews ...) bazaga yetib bormaydi.
 */
export const pickFields = <T extends object, K extends keyof T>(
  source: T,
  allowed: readonly K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  if (!source || typeof source !== "object") return result;

  for (const key of allowed) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  }
  return result;
};
