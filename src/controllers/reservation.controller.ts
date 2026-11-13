import { Request, Response } from "express";
import { T } from "../libs/types/common";
import { ExtendedRequest } from "../libs/types/member";
import Errors, { HttpCode } from "../libs/Errors";
import ReservationService from "../models/Reservation.service";
import { ReservationInput } from "../libs/types/reservation";
import { ReservationStatus } from "../libs/enums/reservation.enum";
import { getKstDate } from "../libs/config";

const reservationService = new ReservationService();
const reservationController: T = {};

const sendError = (res: Response, err: unknown) => {
  if (err instanceof Errors) res.status(err.code).json(err);
  else res.status(Errors.standard.code).json(Errors.standard);
};

/** SPA **/

reservationController.getAvailability = async (req: Request, res: Response) => {
  try {
    const date = String(req.query.date ?? getKstDate());
    const guests = Math.max(Number(req.query.guests) || 2, 1);
    const result = await reservationService.getAvailability(date, guests);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getAvailability:", err);
    sendError(res, err);
  }
};

reservationController.createReservation = async (req: ExtendedRequest, res: Response) => {
  try {
    const input: ReservationInput = req.body;
    const result = await reservationService.createReservation(req.member, input);
    res.status(HttpCode.CREATED).json(result);
  } catch (err) {
    console.log("Error, createReservation:", err);
    sendError(res, err);
  }
};

reservationController.getMyReservations = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await reservationService.getMyReservations(req.member);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getMyReservations:", err);
    sendError(res, err);
  }
};

reservationController.cancelMyReservation = async (req: ExtendedRequest, res: Response) => {
  try {
    const result = await reservationService.cancelMyReservation(
      req.member,
      String(req.body?.reservationId),
    );
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, cancelMyReservation:", err);
    sendError(res, err);
  }
};

/** SSR (admin) **/

reservationController.getReservationsPage = async (req: Request, res: Response) => {
  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))
      ? String(req.query.date)
      : getKstDate();
    const reservations = await reservationService.getReservationsByDate(date);
    res.render("reservations", { reservations, date });
  } catch (err) {
    console.log("Error, getReservationsPage:", err);
    res.redirect("/admin/login");
  }
};

reservationController.updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const result = await reservationService.updateReservationStatus(
      String(req.params.id),
      req.body?.reservationStatus as ReservationStatus,
    );
    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, updateReservationStatus:", err);
    sendError(res, err);
  }
};

export default reservationController;
