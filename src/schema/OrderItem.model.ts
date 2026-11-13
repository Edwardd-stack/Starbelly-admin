import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema(
  {
    itemQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Buyurtma paytidagi narx (keyin menyu narxi o'zgarsa ham chek o'zgarmaydi)
    itemPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },

    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
  },
  { timestamps: true, collection: "orderItems" },
);

orderItemSchema.index({ orderId: 1 });

export default mongoose.model("OrderItem", orderItemSchema);
