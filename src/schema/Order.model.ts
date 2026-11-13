import mongoose, { Schema } from "mongoose";
import { OrderStatus } from "../libs/enums/order.enum";

const orderSchema = new Schema(
  {
    orderTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    orderDelivery: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.PAUSE,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Member",
    },
  },
  { timestamps: true },
);

orderSchema.index({ memberId: 1, orderStatus: 1, updatedAt: -1 });

export default mongoose.model("Order", orderSchema);
