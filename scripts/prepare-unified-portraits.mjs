import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = resolve(import.meta.dirname, "..");
const people = ["romeo-ye", "flora-zhang", "belle-zhang", "dave-yang", "sam-cui", "quinten-li", "catherian-zhang", "barry-zhang"];
for (const person of people) {
  for (const width of [240, 480]) {
    await sharp(resolve(root, "public/team", person + "-unified.png"))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(resolve(root, "public/team", person + "-unified-" + width + ".webp"));
  }
}
console.log("Prepared 8 unified-background portraits at 240px and 480px.");
