import Errors, { HttpCode, Message } from "../Errors";
import { TossPayment } from "../types/payment";

const TOSS_API = "https://api.tosspayments.com/v1";

/** Toss Payments API so'rovi (secret key faqat serverda) */
export const tossRequest = async (
  path: string,
  options: { method?: "GET" | "POST"; body?: object; idempotencyKey?: string } = {},
): Promise<TossPayment> => {
  const secretKey = process.env.TOSS_SECRET_KEY as string;
  const headers: Record<string, string> = {
    Authorization: "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
    "Content-Type": "application/json",
  };
  // Bir xil kalit bilan qayta yuborilgan so'rov — bir xil natija, pul bir marta yechiladi
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const response = await fetch(`${TOSS_API}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    console.log("Toss error:", data?.code, data?.message);
    throw new Errors(HttpCode.BAD_REQUEST, Message.PAYMENT_FAILED);
  }
  return data as TossPayment;
};
