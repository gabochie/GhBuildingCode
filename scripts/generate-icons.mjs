import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "src/app/icon.svg"));
const outDir = join(root, "public/icons");
mkdirSync(outDir, { recursive: true });

const TEAL = { r: 15, g: 118, b: 110, alpha: 1 };

async function render(size, file) {
  await sharp(svg, { density: 400, scale: 2 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(file);
  console.log(`[icons] ${size}x${size} -> ${file}`);
}

async function maskable(size, file) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: TEAL }
  })
    .png()
    .toBuffer();

  const fg = await sharp(svg, { density: 400 })
    .resize(Math.round(size * 0.76), Math.round(size * 0.76), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(bg)
    .composite([{ input: fg, gravity: "center" }])
    .png()
    .toFile(file);
  console.log(`[icons] maskable ${size}x${size} -> ${file}`);
}

await render(192, join(outDir, "icon-192.png"));
await render(512, join(outDir, "icon-512.png"));
await maskable(512, join(outDir, "icon-maskable-512.png"));

const appleDir = join(root, "public");
const apple = await sharp(svg, { density: 400 })
  .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
writeFileSync(join(appleDir, "apple-touch-icon.png"), apple);
console.log(`[icons] 180x180 -> ${join("public", "apple-touch-icon.png")}`);

console.log("[icons] done");