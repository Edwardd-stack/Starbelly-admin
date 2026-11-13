import { ObjectId } from "mongoose";
import { PaymentStatus } from "../enums/payment.enum";
import { Order } from "./order";

export interface Payment {
  _id: ObjectId;
  orderId: ObjectId;
  memberId: ObjectId;
  paymentKey: string;
  paymentAmount: number;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** successUrl'dan kelgan qiymatlar */
export interface PaymentConfirmInput {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface PaymentConfirmResult {
  order: Order;
  payment: Payment;
}

/** Toss API javobining bizga kerakli qismi */
export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: PaymentStatus;
  totalAmount: number;
  method?: string;
  approvedAt?: string;
}

export interface TossWebhookInput {
  eventType: string;
  data?: { paymentKey?: string; orderId?: string; status?: PaymentStatus };
}
