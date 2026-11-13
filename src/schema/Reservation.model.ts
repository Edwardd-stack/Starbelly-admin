import mongoose, { Schema } from "mongoose";
import { ReservationStatus, TIME_SLOTS } from "../libs/enums/reservation.enum";

const reservationSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Member",
    },

    tableId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Table",
    },

    reservationDate: {
      type: String, // "YYYY-MM-DD" (KST)
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    timeSlot: {
      type: String,
      enum: TIME_SLOTS,
      required: true,
    },

    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },

    reservationStatus: {
      type: String,
      enum: ReservationStatus,
      default: ReservationStatus.PAUSE,
    },

    // Faol bron (PAUSE / CONFIRM) joyni band qiladi; bekor qilingani — yo'q
    reservationActive: {
      type: Boolean,
      default: true,
    },

    reservationMemo: {
      type: String,
      maxlength: 200,
    },
  },
  { timestamps: true },
);

/**
 * Double booking himoyasi: bitta stol + sana + vaqt uchun faqat BITTA faol bron.
 * Tekshiruvni kod emas, baza qiladi — parallel so'rovlarda ham ishonchli.
 */
reservationSchema.index(
  { tableId: 1, reservationDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { reservationActive: true } },
);
reservationSchema.index({ memberId: 1, reservationDate: -1 });

export default mongoose.model("Reservation", reservationSchema);
