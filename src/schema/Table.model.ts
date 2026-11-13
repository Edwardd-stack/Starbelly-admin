import mongoose, { Schema } from "mongoose";
import { TableStatus } from "../libs/enums/reservation.enum";

const tableSchema = new Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    tableSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    tableStatus: {
      type: String,
      enum: TableStatus,
      default: TableStatus.ACTIVE,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Table", tableSchema);
