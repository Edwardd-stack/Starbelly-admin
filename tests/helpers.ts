import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app";
import ProductModel from "../src/schema/Product.model";
import { ProductCollection, ProductStatus } from "../src/libs/enums/product.enum";

export const connectDb = async () => {
  await mongoose.connect(process.env.MONGO_URL as string);
  // unique index'lar test boshlanishidan oldin tayyor bo'lsin
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
};

export const clearDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

export const disconnectDb = () => mongoose.disconnect();

let counter = 0;

/** Yangi a'zo: cookie saqlaydigan agent qaytaradi */
export const signupAgent = async (extra: Record<string, unknown> = {}) => {
  counter += 1;
  const agent = request.agent(app);
  const res = await agent.post("/member/signup").send({
    memberNick: `user${counter}`,
    memberPhone: `0100000${String(counter).padStart(4, "0")}`,
    memberPassword: "1234",
    ...extra,
  });
  return { agent, res };
};

export const createProduct = (price: number, name = `Dish ${Math.random()}`) =>
  ProductModel.create({
    productName: name,
    productPrice: price,
    productLeftCount: 10,
    productCollection: ProductCollection.MAIN_DISH,
    productStatus: ProductStatus.PROCESS,
    productDesc: "test dish",
  });
