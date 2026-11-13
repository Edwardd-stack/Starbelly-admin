import { ObjectId } from "mongoose";
import { ReservationStatus, TableStatus, TimeSlot } from "../enums/reservation.enum";

export interface Table {
  _id: ObjectId;
  tableNumber: number;
  tableSeats: number;
  tableStatus: TableStatus;
}

export interface Reservation {
  _id: ObjectId;
  memberId: ObjectId;
  tableId: ObjectId;
  reservationDate: string;
  timeSlot: TimeSlot;
  guestCount: number;
  reservationStatus: ReservationStatus;
  reservationActive: boolean;
  reservationMemo?: string;
  createdAt: Date;
  updatedAt: Date;
  /** aggregation'dan **/
  tableData?: Table;
  memberData?: { memberNick: string; memberPhone: string };
}

export interface ReservationInput {
  tableId: string;
  reservationDate: string;
  timeSlot: TimeSlot;
  guestCount: number;
  reservationMemo?: string;
}

/** Kun bo'yicha bo'sh joylar: har bir vaqt uchun bo'sh stollar */
export interface SlotAvailability {
  timeSlot: TimeSlot;
  tables: Table[];
}
