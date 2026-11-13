import fs from "fs";
import path from "path";

/**
 * Demo menyu rasmlarini (seed/images) uploads'ga tiklaydi.
 * Render kabi platformalarda disk har deploy'da tozalanadi — rasmlar yo'qolmasligi uchun.
 */
export const restoreSeedImages = (): void => {
  const from = path.join(process.cwd(), "seed", "images");
  const to = path.join(process.cwd(), "uploads", "products");
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });

  for (const file of fs.readdirSync(from)) {
    const target = path.join(to, `seed-${file}`);
    if (!fs.existsSync(target)) fs.copyFileSync(path.join(from, file), target);
  }
};
