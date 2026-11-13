export const AUTH_TIMER = 6; // soat

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
