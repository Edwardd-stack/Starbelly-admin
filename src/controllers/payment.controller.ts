import { Request, Response } from "express";
import { T } from "../libs/types/common";
import { ExtendedRequest } from "../libs/types/member";
import Errors, { HttpCode } from "../libs/Errors";
import PaymentService from "../models/Payment.service";
import { PaymentConfirmInput, TossWebhookInput } from "../libs/types/payment";

const paymentService = new PaymentService();
const paymentController: T = {};

const sendError = (res: Response, err: unknown) => {
  if (err instanceof Errors) res.status(err.code).json(err);
  else res.status(Errors.standard.code).json(Errors.standard);
};

// Confirm payment
paymentController.confirmPayment = async (req: ExtendedRequest, res: Response) => {
  try {
    const input: PaymentConfirmInput = req.body;
    const result = await paymentService.confirmPayment(req.member, input);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, confirmPayment:", err);
    sendError(res, err);
  }
};

// Toss webhook — har doim 200 qaytaramiz (aks holda Toss qayta-qayta yuboradi)
paymentController.webhook = async (req: Request, res: Response) => {
  try {
    const input: TossWebhookInput = req.body;
    await paymentService.handleWebhook(input);
  } catch (err) {
    console.log("Error, payment webhook:", err);
  }
  res.status(HttpCode.OK).json({ received: true });
};

export default paymentController;
