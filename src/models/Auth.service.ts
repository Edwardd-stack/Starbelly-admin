import jwt from "jsonwebtoken";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { AUTH_TIMER } from "../libs/config";
import { Member, TokenMember } from "../libs/types/member";

class AuthService {
  private readonly secretToken: string;

  constructor() {
    this.secretToken = process.env.SECRET_TOKEN as string;
  }

  // Member => Token (faqat _id, type, nick — parol yoki telefon emas)
  public createToken(member: Member): Promise<string> {
    const payload: TokenMember = {
      _id: String(member._id),
      memberType: member.memberType,
      memberNick: member.memberNick,
    };

    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secretToken,
        { expiresIn: `${AUTH_TIMER}h` },
        (err, token) => {
          if (err || !token)
            reject(new Errors(HttpCode.UNAUTHORIZED, Message.TOKEN_CREATION_FAILED));
          else resolve(token);
        },
      );
    });
  }

  // Token => Member (imzo yoki muddat noto'g'ri bo'lsa xato)
  public checkAuth(token: string): TokenMember {
    const result = jwt.verify(token, this.secretToken) as TokenMember;
    return { _id: result._id, memberType: result.memberType, memberNick: result.memberNick };
  }
}

export default AuthService;
