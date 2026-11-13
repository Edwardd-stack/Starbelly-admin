export const AUTH_TIMER = 6; // soat

/** Rezervatsiya qoidalari */
export const RESERVATION_RULES = {
  MAX_DAYS_AHEAD: 30,
  MAX_GUESTS: 12,
};

/** Bugungi sana Koreya vaqti bilan: "YYYY-MM-DD" */
export const getKstDate = (offsetDays = 0): string =>
  new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400 * 1000).toISOString().slice(0, 10);

/** Ball: har 1000 KRW uchun 1 ball */
export const POINT_PER_KRW = 1000;

/** Buyurtma qoidalari (narxlar KRW, butun son) */
export const ORDER_RULES = {
  FREE_DELIVERY_FROM: 30000, // shundan kam bo'lsa yetkazish pullik
  DELIVERY_FEE: 3000,
  MAX_ITEMS: 20,
  MAX_QUANTITY: 50,
};
export const MORGAN_FORMAT = `:method :url :response-time [:status] \n`;

import mongoose from "mongoose";
export const shapeIntoMongooseObjectId = (target: any) => {
  return typeof target === "string"
    ? new mongoose.Types.ObjectId(target)
    : target;
};
