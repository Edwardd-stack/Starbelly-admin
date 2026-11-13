import mongoose, { Schema } from "mongoose";
import { PointReason } from "../libs/enums/point.enum";

/** Ball daftari (ledger): balans o'zgarishining har biri alohida yozuv */
const pointHistorySchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Member",
    },

    pointAmount: {
      type: Number, // +qo'shildi / -ayirildi
      required: true,
    },

    pointReason: {
      type: String,
      enum: PointReason,
      required: true,
    },

    refId: {
      type: Schema.Types.ObjectId, // masalan orderId
    },

    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, collection: "pointHistories" },
);

pointHistorySchema.index({ memberId: 1, createdAt: -1 });
// Bitta buyurtma uchun ball ikki marta berilmaydi
pointHistorySchema.index(
  { refId: 1, pointReason: 1 },
  { unique: true, partialFilterExpression: { refId: { $exists: true } } },
);

export default mongoose.model("PointHistory", pointHistorySchema);
