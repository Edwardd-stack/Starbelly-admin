import { ObjectId } from "mongoose";
import { MemberStatus, MemberType } from "../enums/member.enum";
import { Request } from "express";
import { Session } from "express-session";

export interface Member {
  _id: ObjectId;
  memberType: MemberType;
  memberStatus: MemberStatus;
  memberNick: string;
  memberPhone: string;
  memberPassword?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMember {
  _id: string;
  memberType: MemberType;
  memberNick: string;
}

export interface MemberInput {
  memberType?: MemberType;
  memberStatus?: MemberStatus;
  memberNick: string;
  memberPhone: string;
  memberPassword: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints?: number;
}

export interface LoginInput {
  memberNick: string;
  memberPassword: string;
}

/** JWT ichidagi ma'lumot (parol va shaxsiy ma'lumotsiz) */
export interface TokenMember {
  _id: string;
  memberType: MemberType;
  memberNick: string;
}

/** SPA so'rovi: verifyAuth'dan keyin req.member to'ldiriladi */
export interface ExtendedRequest extends Request {
  member: TokenMember;
  file: Express.Multer.File;
  files: Express.Multer.File[];
}

export interface MemberUpdateInput {
  _id: string;
  memberStatus?: MemberStatus;
  memberNick?: string;
  memberPhone?: string;
  memberPassword?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
}

export interface AdminRequest extends Request {
  member?: SessionMember;
  session: Session & { member?: SessionMember };
  file: Express.Multer.File;
  files: Express.Multer.File[];
}

/** Signup paytida mijozdan qabul qilinadigan maydonlar (memberType, memberStatus, memberPoints — yo'q) */
export const MEMBER_SIGNUP_FIELDS = [
  "memberNick",
  "memberPhone",
  "memberPassword",
  "memberAddress",
  "memberDesc",
  "memberImage",
] as const;

/** A'zo o'zi o'zgartira oladigan maydonlar (status, type, points — yo'q) */
export const MEMBER_SELF_UPDATE_FIELDS = [
  "memberNick",
  "memberPhone",
  "memberAddress",
  "memberDesc",
  "memberImage",
] as const;
