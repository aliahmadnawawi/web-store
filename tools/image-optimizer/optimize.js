import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = process.argv[2] || "./input";
const outputDir = process.argv[3] || "./output";

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;

  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file.replace(ext, ".webp"));

  await sharp(inputPath)
    .resize(1200)
    .webp({ quality: 80 })
    .toFile(outputPath);
}

console.log("Optimization done");
