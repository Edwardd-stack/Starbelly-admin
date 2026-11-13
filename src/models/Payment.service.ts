import mongoose from "mongoose";
import PaymentModel from "../schema/Payment.model";
import OrderModel from "../schema/Order.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { TokenMember } from "../libs/types/member";
import { Order } from "../libs/types/order";
import {
  Payment,
  PaymentConfirmInput,
  PaymentConfirmResult,
  TossWebhookInput,
} from "../libs/types/payment";
import { OrderStatus } from "../libs/enums/order.enum";
import { PaymentStatus } from "../libs/enums/payment.enum";
import { tossRequest } from "../libs/utils/toss";
import { isDuplicateKeyError } from "../libs/utils/mongo";

class PaymentService {
  private readonly paymentModel;
  private readonly orderModel;

  constructor() {
    this.paymentModel = PaymentModel;
    this.orderModel = OrderModel;
  }

  /**
   * To'lovni tasdiqlash (successUrl'dan keyin).
   * 1) buyurtma shu a'zoniki va to'lanmagan  2) summa bazadagi bilan bir xil
   * 3) Toss'ga confirm (Idempotency-Key)  4) Payment + order PROCESS — bitta tranzaksiyada
   */
  public async confirmPayment(
    member: TokenMember,
    input: PaymentConfirmInput,
  ): Promise<PaymentConfirmResult> {
    const amount = Number(input?.amount);
    if (
      typeof input?.paymentKey !== "string" ||
      !mongoose.isValidObjectId(input?.orderId) ||
      !Number.isInteger(amount)
    )
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    const orderId = shapeIntoMongooseObjectId(input.orderId);
    const memberId = shapeIntoMongooseObjectId(member._id);

    const order = await this.orderModel.findOne({ _id: orderId, memberId }).lean<Order>().exec();
    if (!order) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    // Allaqachon to'langan bo'lsa — qayta yechmaymiz, oldingi natijani qaytaramiz
    const existing = await this.paymentModel.findOne({ orderId }).lean<Payment>().exec();
    if (existing?.paymentStatus === PaymentStatus.DONE) return { order, payment: existing };

    if (order.orderStatus !== OrderStatus.PAUSE)
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);
    // Brauzerdan kelgan summaga ishonmaymiz
    if (order.orderTotal !== amount)
      throw new Errors(HttpCode.BAD_REQUEST, Message.PAYMENT_AMOUNT_MISMATCH);

    const toss = await tossRequest("/payments/confirm", {
      method: "POST",
      body: { paymentKey: input.paymentKey, orderId: input.orderId, amount },
      idempotencyKey: `confirm-${input.orderId}`,
    });

    const session = await mongoose.startSession();
    try {
      let result: PaymentConfirmResult | undefined;
      await session.withTransaction(async () => {
        const [payment] = await this.paymentModel.create(
          [
            {
              orderId,
              memberId,
              paymentKey: toss.paymentKey,
              paymentAmount: toss.totalAmount,
              paymentMethod: toss.method,
              paymentStatus: toss.status,
              approvedAt: toss.approvedAt ? new Date(toss.approvedAt) : undefined,
            },
          ],
          { session },
        );
        const paidOrder = await this.orderModel
          .findOneAndUpdate(
            { _id: orderId, orderStatus: OrderStatus.PAUSE },
            { orderStatus: OrderStatus.PROCESS },
            { new: true, session },
          )
          .lean<Order>()
          .exec();
        if (!paidOrder) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);

        result = { order: paidOrder, payment: payment.toObject() as unknown as Payment };
      });
      return result as PaymentConfirmResult;
    } catch (err) {
      // Parallel ikkinchi so'rov: birinchisi allaqachon saqlagan
      if (isDuplicateKeyError(err)) {
        const payment = await this.paymentModel.findOne({ orderId }).lean<Payment>().exec();
        const paidOrder = await this.orderModel.findById(orderId).lean<Order>().exec();
        if (payment && paidOrder) return { order: paidOrder, payment };
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Toss webhook: body'ga ishonmasdan, to'lovni Toss API'dan qayta so'rab sinxronlaymiz.
   */
  public async handleWebhook(input: TossWebhookInput): Promise<void> {
    const paymentKey = input?.data?.paymentKey;
    if (input?.eventType !== "PAYMENT_STATUS_CHANGED" || !paymentKey) return;

    const payment = await this.paymentModel.findOne({ paymentKey }).exec();
    if (!payment) return; // bizda yo'q to'lov — e'tiborsiz

    const toss = await tossRequest(`/payments/${encodeURIComponent(paymentKey)}`);
    payment.paymentStatus = toss.status;
    await payment.save();

    if (toss.status === PaymentStatus.CANCELED || toss.status === PaymentStatus.ABORTED) {
      await this.orderModel
        .updateOne(
          { _id: payment.orderId, orderStatus: { $in: [OrderStatus.PAUSE, OrderStatus.PROCESS] } },
          { orderStatus: OrderStatus.DELETE },
        )
        .exec();
    }
  }
}

export default PaymentService;
