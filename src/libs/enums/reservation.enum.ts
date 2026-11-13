export enum ReservationStatus {
  PAUSE = "PAUSE", // so'rov yuborildi, admin tasdiqlamagan
  CONFIRM = "CONFIRM", // tasdiqlandi
  CANCEL = "CANCEL", // bekor qilindi
  FINISH = "FINISH", // mehmon keldi, yakunlandi
}

export enum TableStatus {
  ACTIVE = "ACTIVE",
  PAUSE = "PAUSE",
}

/** Bron qilish mumkin bo'lgan vaqtlar (KST) */
export const TIME_SLOTS = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];
