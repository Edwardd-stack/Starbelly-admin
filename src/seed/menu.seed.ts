/**
 * Demo menyuni bazaga yozadi:  npm run seed            (rasmlari bor taomlar)
 *                              npm run seed -- --pause-others  (menyuda yo'q eski taomlarni PAUSE qiladi)
 * Rasm: seed/images/<image>.webp -> uploads/products/seed-<image>.webp
 * Bir xil nomdagi taom bo'lsa — yangilanadi (upsert), views/likes saqlanadi.
 */
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import ProductModel from "../schema/Product.model";
import { ProductStatus, ProductVolume } from "../libs/enums/product.enum";
import { MENU } from "./menu.data";

const IMAGES_DIR = path.join(process.cwd(), "seed", "images");
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URL as string);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const seededNames: string[] = [];
  for (const item of MENU) {
    const source = path.join(IMAGES_DIR, `${item.image}.webp`);
    if (!fs.existsSync(source)) {
      console.log(`- skip ${item.productName} (no image)`);
      continue;
    }
    const fileName = `seed-${item.image}.webp`;
    fs.copyFileSync(source, path.join(UPLOAD_DIR, fileName));

    const { image, ...fields } = item;
    await ProductModel.updateOne(
      { productName: item.productName },
      {
        $set: {
          ...fields,
          productVolume: item.productVolume ?? ProductVolume.ONE,
          productStatus: ProductStatus.PROCESS,
          productImages: [`uploads/products/${fileName}`],
        },
      },
      { upsert: true, runValidators: true },
    );
    seededNames.push(item.productName);
    console.log(`+ ${item.productName} (${image})`);
  }

  if (process.argv.includes("--pause-others")) {
    const result = await ProductModel.updateMany(
      { productName: { $nin: seededNames }, productStatus: ProductStatus.PROCESS },
      { productStatus: ProductStatus.PAUSE },
    );
    console.log(`paused ${result.modifiedCount} old products`);
  }

  console.log(`done: ${seededNames.length} products`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
