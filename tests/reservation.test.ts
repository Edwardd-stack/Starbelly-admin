import TableModel from "../src/schema/Table.model";
import ReservationService from "../src/models/Reservation.service";
import { getKstDate } from "../src/libs/config";
import { clearDb, connectDb, disconnectDb, signupAgent } from "./helpers";

beforeAll(connectDb);
beforeEach(() => new ReservationService().ensureDefaultTables());
afterEach(clearDb);
afterAll(disconnectDb);

const tomorrow = getKstDate(1);

describe("Reservations — double booking", () => {
  it("allows only one of 10 parallel bookings for the same table and time", async () => {
    const table = await TableModel.findOne({ tableNumber: 3 });
    const agents = await Promise.all(Array.from({ length: 10 }, () => signupAgent()));

    const results = await Promise.all(
      agents.map(({ agent }) =>
        agent.post("/reservation/create").send({
          tableId: String(table?._id),
          reservationDate: tomorrow,
          timeSlot: "19:00",
          guestCount: 2,
        }),
      ),
    );
    const statuses = results.map((r) => r.status).sort();

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);
  });

  it("frees the slot after cancellation", async () => {
    const table = await TableModel.findOne({ tableNumber: 1 });
    const body = { tableId: String(table?._id), reservationDate: tomorrow, timeSlot: "12:00", guestCount: 2 };
    const { agent } = await signupAgent();

    const first = await agent.post("/reservation/create").send(body);
    await agent.post("/reservation/cancel").send({ reservationId: first.body._id });
    const second = await agent.post("/reservation/create").send(body);

    expect(second.status).toBe(201);
  });

  it("rejects a table that is too small", async () => {
    const table = await TableModel.findOne({ tableNumber: 1 }); // 2 o'rinli
    const { agent } = await signupAgent();

    const res = await agent.post("/reservation/create").send({
      tableId: String(table?._id),
      reservationDate: tomorrow,
      timeSlot: "13:00",
      guestCount: 5,
    });

    expect(res.status).toBe(400);
  });
});
