import { clearDb, connectDb, disconnectDb, signupAgent } from "./helpers";

beforeAll(connectDb);
afterEach(clearDb);
afterAll(disconnectDb);

describe("Image upload guard", () => {
  it("rejects a non-image file with 400", async () => {
    const { agent } = await signupAgent();
    const res = await agent
      .post("/member/update")
      .attach("memberImage", Buffer.from("hello"), { filename: "note.txt", contentType: "text/plain" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/images are allowed/);
  });

  it("rejects an image mimetype with a fake extension", async () => {
    const { agent } = await signupAgent();
    const res = await agent
      .post("/member/update")
      .attach("memberImage", Buffer.from("<script></script>"), { filename: "evil.html", contentType: "image/png" });

    expect(res.status).toBe(400);
  });

  it("rejects a file larger than 5MB", async () => {
    const { agent } = await signupAgent();
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await agent
      .post("/member/update")
      .attach("memberImage", big, { filename: "big.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/too large/);
  });
});
