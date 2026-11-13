import MemberModel from "../schema/Member.model";
import {
  LoginInput,
  Member,
  MemberInput,
  MemberUpdateInput,
  MEMBER_SELF_UPDATE_FIELDS,
  MEMBER_SIGNUP_FIELDS,
  TokenMember,
} from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { MemberStatus, MemberType } from "../libs/enums/member.enum";
import * as bcrypt from "bcryptjs";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { pickFields } from "../libs/utils/sanitize";

class MemberService {
  private readonly memberModel;
  constructor() {
    this.memberModel = MemberModel;
  }

  /** SPA **/

  // Restoran (yagona ADMIN) haqida ommaviy ma'lumot
  public async getRestaurant(): Promise<Member> {
    const result = await this.memberModel
      .findOne({ memberType: MemberType.ADMIN })
      .lean<Member>()
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  // Signup
  public async signup(input: MemberInput): Promise<Member> {
    // Faqat ruxsat etilgan maydonlar; memberType har doim USER
    const newMember = await this.prepareNewMember(input, MemberType.USER);

    try {
      const result = await this.memberModel.create(newMember);
      result.memberPassword = "";
      return result.toJSON();
    } catch (err) {
      console.error("Error, model:signup", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
    }
  }

  // Login
  public async login(input: LoginInput): Promise<Member> {
    const member = await this.memberModel
      .findOne(
        {
          memberNick: input.memberNick,
          memberStatus: { $ne: MemberStatus.DELETE },
        },
        { memberNick: 1, memberPassword: 1, memberStatus: 1 },
      )
      .exec();
    if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);
    else if (member.memberStatus === MemberStatus.BLOCK) {
      throw new Errors(HttpCode.FORBIDDEN, Message.BLOCKED_USER);
    }

    const isMatch = await bcrypt.compare(
      input.memberPassword,
      member.memberPassword,
    );
    if (!isMatch) {
      throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
    }

    return await this.memberModel.findById(member._id).lean().exec();
  }

  // Kirgan a'zoning o'z ma'lumotlari
  public async getMemberDetail(member: TokenMember): Promise<Member> {
    const memberId = shapeIntoMongooseObjectId(member._id);
    const result = await this.memberModel
      .findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
      .lean<Member>()
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  // A'zo o'z profilini yangilaydi (whitelist)
  public async updateMember(
    member: TokenMember,
    input: Partial<MemberUpdateInput>,
  ): Promise<Member> {
    const data = pickFields(input, MEMBER_SELF_UPDATE_FIELDS);
    if (Object.keys(data).length === 0)
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    const memberId = shapeIntoMongooseObjectId(member._id);
    try {
      const result = await this.memberModel
        .findOneAndUpdate({ _id: memberId }, data, { new: true, runValidators: true })
        .lean<Member>()
        .exec();
      if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);
      return result;
    } catch (err) {
      if (err instanceof Errors) throw err;
      throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
    }
  }

  // Eng faol a'zolar (ball bo'yicha)
  public async getTopUsers(): Promise<Member[]> {
    return await this.memberModel
      .find({
        memberStatus: MemberStatus.ACTIVE,
        memberType: MemberType.USER,
        memberPoints: { $gte: 1 },
      })
      .sort({ memberPoints: -1 })
      .limit(4)
      .lean<Member[]>()
      .exec();
  }

  /** SSR **/

  // Process Signup
  public async processSignup(input: MemberInput): Promise<Member> {
    const exist = await this.memberModel
      .findOne({ memberType: MemberType.ADMIN })
      .exec();
    if (exist) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

    const newMember = await this.prepareNewMember(input, MemberType.ADMIN);

    try {
      const result = await this.memberModel.create(newMember);
      result.memberPassword = "";
      return result;
    } catch (err) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  // Process Login
  public async processLogin(input: LoginInput): Promise<Member> {
    const member = await this.memberModel
      .findOne(
        { memberNick: input.memberNick },
        { memberNick: 1, memberPassword: 1 },
      )
      .exec();
    if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

    const isMatch = await bcrypt.compare(
      input.memberPassword,
      member.memberPassword,
    );
    // const isMatch = input.memberPassword === member.memberPassword;

    if (!isMatch) {
      throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
    }

    return await this.memberModel.findById(member._id).exec();
    // const result = await this.memberModel.findById(member._id).exec();
    // return result;
  }

  // get Users
  public async getUsers(): Promise<Member[]> {
    const result = await this.memberModel
      .find({ memberType: MemberType.USER })
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  // update ChosenUser
  // Admin faqat USER'ning statusini o'zgartira oladi (ACTIVE / BLOCK / DELETE)
  public async updateChosenUser(input: MemberUpdateInput): Promise<Member> {
    const memberStatus = input?.memberStatus;
    if (!input?._id || !memberStatus || !Object.values(MemberStatus).includes(memberStatus))
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    const id = shapeIntoMongooseObjectId(input._id);
    const result = await this.memberModel
      .findOneAndUpdate(
        { _id: id, memberType: MemberType.USER },
        { memberStatus },
        { new: true, runValidators: true },
      )
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    return result;
  }

  /** HELPERS **/

  // Yangi a'zo uchun xavfsiz obyekt: whitelist + hash + server belgilagan memberType
  private async prepareNewMember(
    input: MemberInput,
    memberType: MemberType,
  ): Promise<MemberInput> {
    const data = pickFields(input, MEMBER_SIGNUP_FIELDS);
    if (!data.memberNick || !data.memberPhone || !data.memberPassword)
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    const salt = await bcrypt.genSalt();
    const memberPassword = await bcrypt.hash(String(data.memberPassword), salt);

    return { ...data, memberPassword, memberType };
  }
}

export default MemberService;
