import OrderService from "../src/models/Order.service";
import MemberModel from "../src/schema/Member.model";
import OrderModel from "../src/schema/Order.model";
import PointHistoryModel from "../src/schema/PointHistory.model";
import { OrderStatus } from "../src/libs/enums/order.enum";
import { clearDb, connectDb, createProduct, disconnectDb, signupAgent } from "./helpers";

beforeAll(connectDb);
afterEach(clearDb);
afterAll(disconnectDb);

describe("Orders", () => {
  it("calculates the total on the server and ignores client prices", async () => {
    const { agent } = await signupAgent();
    const burger = await createProduct(14000);
    const salad = await createProduct(11000);

    const res = await agent.post("/order/create").send([
      { productId: String(burger._id), itemQuantity: 2, itemPrice: 1 }, // soxta narx
      { productId: String(salad._id), itemQuantity: 1 },
    ]);

    expect(res.status).toBe(201);
    expect(res.body.orderTotal).toBe(14000 * 2 + 11000); // 39,000 >= 30,000 -> yetkazish bepul
    expect(res.body.orderDelivery).toBe(0);
  });

  it("adds a delivery fee under ₩30,000", async () => {
    const { agent } = await signupAgent();
    const latte = await createProduct(5000);

    const res = await agent.post("/order/create").send([{ productId: String(latte._id), itemQuantity: 1 }]);

    expect(res.body.orderTotal).toBe(5000 + 3000);
  });

  it("rejects invalid quantities", async () => {
    const { agent } = await signupAgent();
    const dish = await createProduct(10000);

    const res = await agent.post("/order/create").send([{ productId: String(dish._id), itemQuantity: -3 }]);

    expect(res.status).toBe(400);
  });

  it("lets the customer cancel only an unpaid order", async () => {
    const { agent } = await signupAgent();
    const dish = await createProduct(10000);
    const order = await agent.post("/order/create").send([{ productId: String(dish._id), itemQuantity: 1 }]);

    const cancel = await agent.post("/order/cancel").send({ orderId: order.body._id, orderStatus: "DELETE" });
    expect(cancel.status).toBe(200);

    const again = await agent.post("/order/cancel").send({ orderId: order.body._id, orderStatus: "DELETE" });
    expect(again.status).toBe(400);
  });

  it("gives points exactly once when the kitchen finishes an order (transaction + ledger)", async () => {
    const { agent, res: signup } = await signupAgent();
    const dish = await createProduct(25000);
    const order = await agent.post("/order/create").send([{ productId: String(dish._id), itemQuantity: 1 }]);
    await OrderModel.updateOne({ _id: order.body._id }, { orderStatus: OrderStatus.PROCESS }); // to'langan deb

    const service = new OrderService();
    await service.finishOrder(order.body._id);
    await expect(service.finishOrder(order.body._id)).rejects.toBeTruthy(); // ikkinchi marta — yo'q

    const member = await MemberModel.findById(signup.body.member._id);
    const history = await PointHistoryModel.find({ memberId: signup.body.member._id });

    expect(member?.memberPoints).toBe(Math.floor(28000 / 1000)); // 25,000 + 3,000 yetkazish
    expect(history).toHaveLength(1);
    expect(history[0].balanceAfter).toBe(member?.memberPoints);
  });
});
