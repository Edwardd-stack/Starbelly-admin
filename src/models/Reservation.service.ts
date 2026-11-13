import mongoose from "mongoose";
import TableModel from "../schema/Table.model";
import ReservationModel from "../schema/Reservation.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { getKstDate, RESERVATION_RULES, shapeIntoMongooseObjectId } from "../libs/config";
import { TokenMember } from "../libs/types/member";
import {
  Reservation,
  ReservationInput,
  SlotAvailability,
  Table,
} from "../libs/types/reservation";
import {
  ReservationStatus,
  TableStatus,
  TimeSlot,
  TIME_SLOTS,
} from "../libs/enums/reservation.enum";
import { isDuplicateKeyError } from "../libs/utils/mongo";

const DEFAULT_TABLES = [
  { tableNumber: 1, tableSeats: 2 },
  { tableNumber: 2, tableSeats: 2 },
  { tableNumber: 3, tableSeats: 4 },
  { tableNumber: 4, tableSeats: 4 },
  { tableNumber: 5, tableSeats: 4 },
  { tableNumber: 6, tableSeats: 6 },
  { tableNumber: 7, tableSeats: 6 },
  { tableNumber: 8, tableSeats: 12 },
];

class ReservationService {
  private readonly tableModel;
  private readonly reservationModel;

  constructor() {
    this.tableModel = TableModel;
    this.reservationModel = ReservationModel;
  }

  // Server ishga tushganda: stollar bo'lmasa — standart zal
  public async ensureDefaultTables(): Promise<void> {
    const count = await this.tableModel.countDocuments().exec();
    if (count === 0) await this.tableModel.insertMany(DEFAULT_TABLES);
  }

  /** SPA **/

  // Tanlangan kun uchun har bir vaqtdagi bo'sh stollar
  public async getAvailability(date: string, guests: number): Promise<SlotAvailability[]> {
    this.validateDate(date);
    const tables = await this.tableModel
      .find({ tableStatus: TableStatus.ACTIVE, tableSeats: { $gte: guests } })
      .sort({ tableSeats: 1, tableNumber: 1 })
      .lean<Table[]>()
      .exec();

    const booked = await this.reservationModel
      .find({ reservationDate: date, reservationActive: true }, { tableId: 1, timeSlot: 1 })
      .lean<Pick<Reservation, "tableId" | "timeSlot">[]>()
      .exec();
    const bookedKeys = new Set(booked.map((r) => `${r.timeSlot}|${r.tableId}`));

    return TIME_SLOTS.filter((slot) => !this.isPastSlot(date, slot)).map((timeSlot) => ({
      timeSlot,
      tables: tables.filter((t) => !bookedKeys.has(`${timeSlot}|${t._id}`)),
    }));
  }

  // Bron yaratish — double booking'ni unique index to'xtatadi (409)
  public async createReservation(
    member: TokenMember,
    input: ReservationInput,
  ): Promise<Reservation> {
    const guestCount = Number(input?.guestCount);
    if (
      !mongoose.isValidObjectId(input?.tableId) ||
      !TIME_SLOTS.includes(input?.timeSlot) ||
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > RESERVATION_RULES.MAX_GUESTS
    )
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);
    this.validateDate(input.reservationDate);
    if (this.isPastSlot(input.reservationDate, input.timeSlot))
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_RESERVATION_TIME);

    const table = await this.tableModel
      .findOne({ _id: shapeIntoMongooseObjectId(input.tableId), tableStatus: TableStatus.ACTIVE })
      .lean<Table>()
      .exec();
    if (!table) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    if (table.tableSeats < guestCount)
      throw new Errors(HttpCode.BAD_REQUEST, Message.TABLE_TOO_SMALL);

    try {
      const created = await this.reservationModel.create({
        memberId: shapeIntoMongooseObjectId(member._id),
        tableId: table._id,
        reservationDate: input.reservationDate,
        timeSlot: input.timeSlot,
        guestCount,
        reservationMemo:
          typeof input.reservationMemo === "string"
            ? input.reservationMemo.trim().slice(0, 200)
            : undefined,
      });
      return created.toObject() as unknown as Reservation;
    } catch (err) {
      if (isDuplicateKeyError(err))
        throw new Errors(HttpCode.CONFLICT, Message.ALREADY_RESERVED);
      throw err;
    }
  }

  // Mening bronlarim (yangilari tepada)
  public async getMyReservations(member: TokenMember): Promise<Reservation[]> {
    return await this.reservationModel
      .aggregate([
        { $match: { memberId: shapeIntoMongooseObjectId(member._id) } },
        { $sort: { reservationDate: -1, timeSlot: -1 } },
        { $limit: 30 },
        {
          $lookup: { from: "tables", localField: "tableId", foreignField: "_id", as: "tableData" },
        },
        { $unwind: "$tableData" },
      ])
      .exec();
  }

  // Mijoz o'z bronini bekor qiladi (faqat faol va hali o'tmagan)
  public async cancelMyReservation(member: TokenMember, reservationId: string): Promise<Reservation> {
    if (!mongoose.isValidObjectId(reservationId))
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    const result = await this.reservationModel
      .findOneAndUpdate(
        {
          _id: shapeIntoMongooseObjectId(reservationId),
          memberId: shapeIntoMongooseObjectId(member._id),
          reservationActive: true,
          reservationDate: { $gte: getKstDate() },
        },
        { reservationStatus: ReservationStatus.CANCEL, reservationActive: false },
        { new: true },
      )
      .lean<Reservation>()
      .exec();
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);
    return result;
  }

  /** SSR (admin) **/

  public async getReservationsByDate(date: string): Promise<Reservation[]> {
    return await this.reservationModel
      .aggregate([
        { $match: { reservationDate: date } },
        { $sort: { timeSlot: 1 } },
        {
          $lookup: { from: "tables", localField: "tableId", foreignField: "_id", as: "tableData" },
        },
        { $unwind: "$tableData" },
        {
          $lookup: {
            from: "members",
            localField: "memberId",
            foreignField: "_id",
            as: "memberData",
            pipeline: [{ $project: { memberNick: 1, memberPhone: 1 } }],
          },
        },
        { $unwind: "$memberData" },
      ])
      .exec();
  }

  // Admin: PAUSE -> CONFIRM / CANCEL, CONFIRM -> FINISH / CANCEL
  public async updateReservationStatus(
    reservationId: string,
    status: ReservationStatus,
  ): Promise<Reservation> {
    const allowedFrom: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
      [ReservationStatus.CONFIRM]: [ReservationStatus.PAUSE],
      [ReservationStatus.CANCEL]: [ReservationStatus.PAUSE, ReservationStatus.CONFIRM],
      [ReservationStatus.FINISH]: [ReservationStatus.CONFIRM],
    };
    const from = allowedFrom[status];
    if (!from || !mongoose.isValidObjectId(reservationId))
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);

    const result = await this.reservationModel
      .findOneAndUpdate(
        { _id: shapeIntoMongooseObjectId(reservationId), reservationStatus: { $in: from } },
        { reservationStatus: status, reservationActive: status === ReservationStatus.CONFIRM },
        { new: true },
      )
      .lean<Reservation>()
      .exec();
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);
    return result;
  }

  /** HELPERS **/

  private validateDate(date: string): void {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);
    if (date < getKstDate() || date > getKstDate(RESERVATION_RULES.MAX_DAYS_AHEAD))
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_RESERVATION_TIME);
  }

  // Bugungi kunda o'tib ketgan vaqtni bron qilib bo'lmaydi
  private isPastSlot(date: string, slot: TimeSlot): boolean {
    if (date !== getKstDate()) return false;
    const nowKst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(11, 16);
    return slot <= nowKst;
  }
}

export default ReservationService;
