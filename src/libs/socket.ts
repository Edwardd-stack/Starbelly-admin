import http from "http";
import { Server, Socket } from "socket.io";
import { RequestHandler } from "express";
import AuthService from "../models/Auth.service";
import { MemberType } from "./enums/member.enum";
import { SessionMember, TokenMember } from "./types/member";

/** Socket xonalari */
export const ROOM = {
  ADMIN: "admin", // oshxona / admin panel
  member: (memberId: string) => `member:${memberId}`,
};

/** Server -> mijoz event nomlari */
export const SocketEvent = {
  ORDER_NEW: "order:new",
  ORDER_STATUS: "order:status",
  RESERVATION_NEW: "reservation:new",
} as const;

let io: Server | null = null;
const authService = new AuthService();

const readCookie = (header: string | undefined, name: string): string | undefined => {
  const pair = header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
};

/**
 * Ulanishda kimligini aniqlaymiz:
 * - admin panel: express-session (cookie) -> ADMIN xonasi
 * - React: JWT accessToken cookie -> shaxsiy xona
 * Kimligi aniqlanmagan ulanish hech qaysi xonaga qo'shilmaydi.
 */
const joinRooms = (socket: Socket) => {
  const request = socket.request as http.IncomingMessage & {
    session?: { member?: SessionMember };
  };

  const admin = request.session?.member;
  if (admin?.memberType === MemberType.ADMIN) socket.join(ROOM.ADMIN);

  const token = readCookie(request.headers.cookie, "accessToken");
  if (token) {
    try {
      const member: TokenMember = authService.checkAuth(token);
      socket.join(ROOM.member(member._id));
    } catch (err) {
      // eskirgan token — e'tiborsiz
    }
  }
};

export const initSocket = (server: http.Server, sessionMiddleware: RequestHandler) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.CLIENT_URL ?? "http://localhost:5000").split(","),
      credentials: true,
    },
  });
  // express-session'ni socket so'rovlariga ham ulaymiz
  io.engine.use(sessionMiddleware);
  io.on("connection", joinRooms);
  return io;
};

export const emitToAdmin = (event: string, payload: unknown) => {
  io?.to(ROOM.ADMIN).emit(event, payload);
};

export const emitToMember = (memberId: string, event: string, payload: unknown) => {
  io?.to(ROOM.member(memberId)).emit(event, payload);
};
