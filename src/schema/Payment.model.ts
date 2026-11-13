import mongoose, { Schema } from "mongoose";
import { PaymentStatus } from "../libs/enums/payment.enum";

const paymentSchema = new Schema(
  {
    // Bitta buyurtma — bitta to'lov (idempotency'ning baza darajasidagi himoyasi)
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "Order",
    },

    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Member",
    },

    paymentKey: {
      type: String,
      required: true,
      unique: true,
    },

    paymentAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      required: true,
    },

    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
