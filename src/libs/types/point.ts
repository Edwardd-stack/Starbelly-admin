import { ObjectId } from "mongoose";
import { PointReason } from "../enums/point.enum";

export interface PointHistory {
  _id: ObjectId;
  memberId: ObjectId;
  pointAmount: number;
  pointReason: PointReason;
  refId?: ObjectId;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PointInput {
  memberId: ObjectId;
  pointAmount: number;
  pointReason: PointReason;
  refId?: ObjectId;
}
