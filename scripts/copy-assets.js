/**
 * tsc faqat .ts fayllarni dist'ga ko'chiradi.
 * EJS shablonlari va statik fayllar (css/js/img) ham kerak — shu skript ko'chiradi.
 */
const fs = require("fs");
const path = require("path");

for (const dir of ["views", "public"]) {
  const from = path.join(__dirname, "..", "src", dir);
  const to = path.join(__dirname, "..", "dist", dir);
  fs.cpSync(from, to, { recursive: true });
  console.log(`copied src/${dir} -> dist/${dir}`);
}
