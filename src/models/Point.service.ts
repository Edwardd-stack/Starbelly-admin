import { ClientSession } from "mongoose";
import MemberModel from "../schema/Member.model";
import PointHistoryModel from "../schema/PointHistory.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { PointHistory, PointInput } from "../libs/types/point";
import { TokenMember } from "../libs/types/member";

class PointService {
  private readonly memberModel;
  private readonly pointHistoryModel;

  constructor() {
    this.memberModel = MemberModel;
    this.pointHistoryModel = PointHistoryModel;
  }

  /**
   * Ball qo'shish/ayirish. Chaqiruvchining tranzaksiyasi (session) ichida ishlaydi:
   * balans ($inc) va daftar yozuvi birga saqlanadi yoki birga bekor bo'ladi.
   */
  public async addPoints(input: PointInput, session: ClientSession): Promise<PointHistory> {
    const member = await this.memberModel
      .findOneAndUpdate(
        { _id: input.memberId },
        { $inc: { memberPoints: input.pointAmount } },
        { new: true, session },
      )
      .exec();
    if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    const [history] = await this.pointHistoryModel.create(
      [{ ...input, balanceAfter: member.memberPoints }],
      { session },
    );
    return history.toObject() as unknown as PointHistory;
  }

  // A'zoning ball tarixi
  public async getMyPointHistory(member: TokenMember, limit = 20): Promise<PointHistory[]> {
    return await this.pointHistoryModel
      .find({ memberId: shapeIntoMongooseObjectId(member._id) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<PointHistory[]>()
      .exec();
  }
}

export default PointService;
