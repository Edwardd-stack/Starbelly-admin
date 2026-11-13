import mongoose from "mongoose";
import OrderModel from "../schema/Order.model";
import OrderItemModel from "../schema/OrderItem.model";
import ProductModel from "../schema/Product.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { ORDER_RULES, POINT_PER_KRW, shapeIntoMongooseObjectId } from "../libs/config";
import { PointReason } from "../libs/enums/point.enum";
import PointService from "./Point.service";
import { emitToMember, SocketEvent } from "../libs/socket";
import { Order, OrderInquiry, OrderItemInput, OrderUpdateInput } from "../libs/types/order";
import { TokenMember } from "../libs/types/member";
import { Product } from "../libs/types/product";
import { OrderStatus } from "../libs/enums/order.enum";
import { ProductStatus } from "../libs/enums/product.enum";

class OrderService {
  private readonly orderModel;
  private readonly orderItemModel;
  private readonly productModel;
  private readonly pointService;

  constructor() {
    this.orderModel = OrderModel;
    this.orderItemModel = OrderItemModel;
    this.productModel = ProductModel;
    this.pointService = new PointService();
  }

  /** SPA **/

  // Buyurtma yaratish: narx va summa faqat bazadagi menyu narxidan hisoblanadi
  public async createOrder(member: TokenMember, input: OrderItemInput[]): Promise<Order> {
    const items = this.validateItems(input);

    const productIds = items.map((item) => shapeIntoMongooseObjectId(item.productId));
    const products = await this.productModel
      .find({ _id: { $in: productIds }, productStatus: ProductStatus.PROCESS })
      .lean<Product[]>()
      .exec();
    const priceMap = new Map(products.map((p) => [String(p._id), p.productPrice]));
    if (priceMap.size !== items.length)
      throw new Errors(HttpCode.BAD_REQUEST, Message.PRODUCT_UNAVAILABLE);

    const amount = items.reduce(
      (sum, item) => sum + (priceMap.get(item.productId) as number) * item.itemQuantity,
      0,
    );
    const delivery = amount < ORDER_RULES.FREE_DELIVERY_FROM ? ORDER_RULES.DELIVERY_FEE : 0;

    // Order va OrderItem'lar birga saqlanadi yoki umuman saqlanmaydi
    const session = await mongoose.startSession();
    try {
      let created: Order | undefined;
      await session.withTransaction(async () => {
        const [order] = await this.orderModel.create(
          [
            {
              orderTotal: amount + delivery,
              orderDelivery: delivery,
              memberId: shapeIntoMongooseObjectId(member._id),
            },
          ],
          { session },
        );
        await this.orderItemModel.insertMany(
          items.map((item) => ({
            orderId: order._id,
            productId: shapeIntoMongooseObjectId(item.productId),
            itemQuantity: item.itemQuantity,
            itemPrice: priceMap.get(item.productId),
          })),
          { session },
        );
        created = order.toObject() as unknown as Order;
      });
      return created as Order;
    } catch (err) {
      console.log("Error, model:createOrder:", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    } finally {
      await session.endSession();
    }
  }

  // Mening buyurtmalarim (status bo'yicha)
  public async getMyOrders(member: TokenMember, inquiry: OrderInquiry): Promise<Order[]> {
    return await this.orderModel
      .aggregate([
        {
          $match: {
            memberId: shapeIntoMongooseObjectId(member._id),
            orderStatus: inquiry.orderStatus,
          },
        },
        { $sort: { updatedAt: -1 } },
        { $skip: (inquiry.page - 1) * inquiry.limit },
        { $limit: inquiry.limit },
        {
          $lookup: {
            from: "orderItems",
            localField: "_id",
            foreignField: "orderId",
            as: "orderItems",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "orderItems.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ])
      .exec();
  }

  // Mijoz faqat to'lanmagan buyurtmani bekor qila oladi (PAUSE -> DELETE)
  public async cancelOrder(member: TokenMember, input: OrderUpdateInput): Promise<Order> {
    if (input?.orderStatus !== OrderStatus.DELETE)
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);

    const result = await this.orderModel
      .findOneAndUpdate(
        {
          _id: shapeIntoMongooseObjectId(input.orderId),
          memberId: shapeIntoMongooseObjectId(member._id),
          orderStatus: OrderStatus.PAUSE,
        },
        { orderStatus: OrderStatus.DELETE },
        { new: true },
      )
      .lean<Order>()
      .exec();
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);

    return result;
  }

  /** SSR (admin / oshxona) **/

  // Oshxona: to'langan (PROCESS) buyurtmalar, eskisi birinchi
  public async getKitchenOrders(orderId?: string): Promise<Order[]> {
    const match: Record<string, unknown> = { orderStatus: OrderStatus.PROCESS };
    if (orderId) match._id = shapeIntoMongooseObjectId(orderId);

    return await this.orderModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: 1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: "orderItems",
            localField: "_id",
            foreignField: "orderId",
            as: "orderItems",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "orderItems.productId",
            foreignField: "_id",
            as: "productData",
            pipeline: [{ $project: { productName: 1, productImages: { $slice: ["$productImages", 1] } } }],
          },
        },
        {
          $lookup: {
            from: "members",
            localField: "memberId",
            foreignField: "_id",
            as: "memberData",
            pipeline: [{ $project: { memberNick: 1, memberPhone: 1 } }],
          },
        },
        { $unwind: "$memberData" },
      ])
      .exec();
  }

  /**
   * Oshxona buyurtmani yakunlaydi (PROCESS -> FINISH) va mijozga ball beriladi.
   * Status, ledger yozuvi va balans bitta tranzaksiyada.
   */
  public async finishOrder(orderId: string): Promise<Order> {
    const session = await mongoose.startSession();
    try {
      let finished: Order | undefined;
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOneAndUpdate(
            { _id: shapeIntoMongooseObjectId(orderId), orderStatus: OrderStatus.PROCESS },
            { orderStatus: OrderStatus.FINISH },
            { new: true, session },
          )
          .lean<Order>()
          .exec();
        if (!order) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_STATUS_CHANGE);

        const points = Math.floor(order.orderTotal / POINT_PER_KRW);
        if (points > 0)
          await this.pointService.addPoints(
            {
              memberId: order.memberId,
              pointAmount: points,
              pointReason: PointReason.ORDER_FINISH,
              refId: order._id,
            },
            session,
          );
        finished = order;
      });
      const order = finished as Order;
      // Mijozning Orders sahifasi darhol yangilanadi
      emitToMember(String(order.memberId), SocketEvent.ORDER_STATUS, {
        orderId: String(order._id),
        orderStatus: order.orderStatus,
      });
      return order;
    } finally {
      await session.endSession();
    }
  }

  /** HELPERS **/

  private validateItems(input: OrderItemInput[]): OrderItemInput[] {
    if (!Array.isArray(input) || input.length === 0 || input.length > ORDER_RULES.MAX_ITEMS)
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);

    const merged = new Map<string, number>(); // bir xil mahsulot ikki qatorda kelsa — birlashtiramiz
    for (const item of input) {
      const quantity = Number(item?.itemQuantity);
      const productId = String(item?.productId ?? "");
      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > ORDER_RULES.MAX_QUANTITY
      )
        throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_INPUT);
      merged.set(productId, (merged.get(productId) ?? 0) + quantity);
    }

    return [...merged].map(([productId, itemQuantity]) => ({ productId, itemQuantity }));
  }
}

export default OrderService;
