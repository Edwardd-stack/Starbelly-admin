import { NextFunction, Request, Response } from "express";
import { T } from "../libs/types/common";
import {
  ExtendedRequest,
  LoginInput,
  Member,
  MemberInput,
  MemberUpdateInput,
} from "../libs/types/member";
import MemberService from "../models/Member.service";
import AuthService from "../models/Auth.service";
import PointService from "../models/Point.service";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { AUTH_TIMER } from "../libs/config";

const memberService = new MemberService();
const authService = new AuthService();
const pointService = new PointService();

const memberController: T = {};

// httpOnly: JS tokenni o'qiy olmaydi (XSS), sameSite: boshqa saytdan so'rovda yuborilmaydi (CSRF)
const isProduction = process.env.NODE_ENV === "production";
const setAuthCookie = (res: Response, token: string) => {
  res.cookie("accessToken", token, {
    maxAge: AUTH_TIMER * 3600 * 1000,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });
};

const sendError = (res: Response, err: unknown) => {
  if (err instanceof Errors) res.status(err.code).json(err);
  else res.status(Errors.standard.code).json(Errors.standard);
};

// Restaurant
memberController.getRestaurant = async (req: Request, res: Response) => {
  try {
    const result = await memberService.getRestaurant();
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getRestaurant:", err);
    sendError(res, err);
  }
};

// Signup
memberController.signup = async (req: Request, res: Response) => {
  try {
    const input: MemberInput = req.body;
    const result: Member = await memberService.signup(input);
    const token = await authService.createToken(result);

    setAuthCookie(res, token);
    res.status(HttpCode.CREATED).json({ member: result });
  } catch (err) {
    console.log("Error, signup:", err);
    sendError(res, err);
  }
};

// Login
memberController.login = async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;
    const result: Member = await memberService.login(input);
    const token = await authService.createToken(result);

    setAuthCookie(res, token);
    res.status(HttpCode.OK).json({ member: result });
  } catch (err) {
    console.log("Error, login:", err);
    sendError(res, err);
  }
};

// Logout
memberController.logout = (req: ExtendedRequest, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });
  res.status(HttpCode.OK).json({ logout: true });
};

// Member detail
memberController.getMemberDetail = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await memberService.getMemberDetail(req.member);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getMemberDetail:", err);
    sendError(res, err);
  }
};

// Update member
memberController.updateMember = async (req: ExtendedRequest, res: Response) => {
  try {
    const input: Partial<MemberUpdateInput> = req.body;
    if (req.file) input.memberImage = req.file.path.replace(/\\/g, "/");
    const result = await memberService.updateMember(req.member, input);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, updateMember:", err);
    sendError(res, err);
  }
};

// Top users
memberController.getTopUsers = async (req: Request, res: Response) => {
  try {
    const result = await memberService.getTopUsers();
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getTopUsers:", err);
    sendError(res, err);
  }
};

// Ball tarixi
memberController.getPointHistory = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await pointService.getMyPointHistory(req.member);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getPointHistory:", err);
    sendError(res, err);
  }
};

/** MIDDLEWARES **/

// Majburiy: token bo'lmasa 401
memberController.verifyAuth = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.["accessToken"];
    if (!token) throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);
    req.member = authService.checkAuth(token);
    next();
  } catch (err) {
    sendError(res, err instanceof Errors ? err : new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED));
  }
};

// Ixtiyoriy: token bo'lsa req.member to'ldiriladi, bo'lmasa davom etadi
memberController.retrieveAuth = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.["accessToken"];
    if (token) req.member = authService.checkAuth(token);
  } catch (err) {
    // muddati o'tgan token — mehmon sifatida davom etadi
  }
  next();
};

export default memberController;
