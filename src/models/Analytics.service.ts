import OrderModel from "../schema/Order.model";
import OrderItemModel from "../schema/OrderItem.model";
import MemberModel from "../schema/Member.model";
import ReservationModel from "../schema/Reservation.model";
import { OrderStatus } from "../libs/enums/order.enum";
import { MemberType } from "../libs/enums/member.enum";
import { getKstDate } from "../libs/config";
import {
  AnalyticsDashboard,
  AnalyticsSummary,
  DailyRevenue,
  HourlyLoad,
  TopProduct,
} from "../libs/types/analytics";

const TZ = "Asia/Seoul";
// Tushum sifatida faqat to'langan buyurtmalar hisoblanadi
const PAID = [OrderStatus.PROCESS, OrderStatus.FINISH];

class AnalyticsService {
  private readonly orderModel;
  private readonly orderItemModel;
  private readonly memberModel;
  private readonly reservationModel;

  constructor() {
    this.orderModel = OrderModel;
    this.orderItemModel = OrderItemModel;
    this.memberModel = MemberModel;
    this.reservationModel = ReservationModel;
  }

  public async getDashboard(days: number): Promise<AnalyticsDashboard> {
    const from = new Date(Date.now() - days * 86400 * 1000);
    const [summary, daily, topProducts, hourly] = await Promise.all([
      this.getSummary(from, days),
      this.getDailyRevenue(from, days),
      this.getTopProducts(from),
      this.getHourlyLoad(from),
    ]);
    return { days, summary, daily, topProducts, hourly };
  }

  private async getSummary(from: Date, days: number): Promise<AnalyticsSummary> {
    const [orders] = await this.orderModel
      .aggregate([
        { $match: { orderStatus: { $in: PAID }, createdAt: { $gte: from } } },
        { $group: { _id: null, revenue: { $sum: "$orderTotal" }, orderCount: { $sum: 1 } } },
      ])
      .exec();

    const [newMembers, reservationCount] = await Promise.all([
      this.memberModel
        .countDocuments({ memberType: MemberType.USER, createdAt: { $gte: from } })
        .exec(),
      this.reservationModel
        .countDocuments({ reservationDate: { $gte: getKstDate(-days) } })
        .exec(),
    ]);

    const revenue = orders?.revenue ?? 0;
    const orderCount = orders?.orderCount ?? 0;
    return {
      revenue,
      orderCount,
      avgOrderValue: orderCount ? Math.round(revenue / orderCount) : 0,
      newMembers,
      reservationCount,
    };
  }

  // Kunlik tushum (Koreya vaqti bo'yicha), bo'sh kunlar 0 bilan to'ldiriladi
  private async getDailyRevenue(from: Date, days: number): Promise<DailyRevenue[]> {
    const rows: DailyRevenue[] = await this.orderModel
      .aggregate([
        { $match: { orderStatus: { $in: PAID }, createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } },
            revenue: { $sum: "$orderTotal" },
            orderCount: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: "$_id", revenue: 1, orderCount: 1 } },
      ])
      .exec();

    const byDate = new Map(rows.map((r) => [r.date, r]));
    return Array.from({ length: days }, (_, i) => {
      const date = getKstDate(i - days + 1);
      return byDate.get(date) ?? { date, revenue: 0, orderCount: 0 };
    });
  }

  // Eng ko'p sotilgan taomlar: orderItems -> orders (to'langan) -> products
  private async getTopProducts(from: Date): Promise<TopProduct[]> {
    return await this.orderItemModel
      .aggregate([
        { $match: { createdAt: { $gte: from } } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
            pipeline: [{ $project: { orderStatus: 1 } }],
          },
        },
        { $unwind: "$order" },
        { $match: { "order.orderStatus": { $in: PAID } } },
        {
          $group: {
            _id: "$productId",
            quantity: { $sum: "$itemQuantity" },
            revenue: { $sum: { $multiply: ["$itemPrice", "$itemQuantity"] } },
          },
        },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
            pipeline: [{ $project: { productName: 1 } }],
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 0,
            productId: { $toString: "$_id" },
            productName: "$product.productName",
            quantity: 1,
            revenue: 1,
          },
        },
      ])
      .exec();
  }

  // Soatlar bo'yicha yuklama (oshxona qachon band)
  private async getHourlyLoad(from: Date): Promise<HourlyLoad[]> {
    const rows: HourlyLoad[] = await this.orderModel
      .aggregate([
        { $match: { orderStatus: { $in: PAID }, createdAt: { $gte: from } } },
        { $group: { _id: { $hour: { date: "$createdAt", timezone: TZ } }, orderCount: { $sum: 1 } } },
        { $project: { _id: 0, hour: "$_id", orderCount: 1 } },
      ])
      .exec();
    const byHour = new Map(rows.map((r) => [r.hour, r.orderCount]));
    return Array.from({ length: 24 }, (_, hour) => ({ hour, orderCount: byHour.get(hour) ?? 0 }));
  }
}

export default AnalyticsService;
