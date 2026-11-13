import request from "supertest";
import app from "../src/app";
import { clearDb, connectDb, disconnectDb, signupAgent } from "./helpers";

beforeAll(connectDb);
afterEach(clearDb);
afterAll(disconnectDb);

describe("Member auth", () => {
  it("signup ignores memberType/memberPoints from the client (no privilege escalation)", async () => {
    const { res } = await signupAgent({ memberType: "ADMIN", memberPoints: 99999 });

    expect(res.status).toBe(201);
    expect(res.body.member.memberType).toBe("USER");
    expect(res.body.member.memberPoints).toBe(0);
    expect(res.body.member.memberPassword).toBeFalsy();
  });

  it("sets the token as an httpOnly cookie", async () => {
    const { res } = await signupAgent();
    const cookie = String(res.headers["set-cookie"]);

    expect(cookie).toContain("accessToken=");
    expect(cookie).toContain("HttpOnly");
  });

  it("protects /member/detail without a token", async () => {
    const res = await request(app).get("/member/detail");
    expect(res.status).toBe(401);
  });

  it("returns the member with a valid cookie", async () => {
    const { agent } = await signupAgent();
    const res = await agent.get("/member/detail");

    expect(res.status).toBe(200);
    expect(res.body.memberNick).toMatch(/^user/);
  });

  it("rejects a wrong password", async () => {
    const { res: signup } = await signupAgent();
    const res = await request(app)
      .post("/member/login")
      .send({ memberNick: signup.body.member.memberNick, memberPassword: "wrong" });

    expect(res.status).toBe(401);
  });
});
