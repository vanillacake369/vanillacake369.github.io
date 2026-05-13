import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import path from 'path';

const MAX_WIDTH = 1200;
const SRC_DIR = './src/content';
const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

async function findImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const images = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findImages(fullPath);
      images.push(...nested);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        images.push(fullPath);
      }
    }
  }

  return images;
}

async function processImage(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  const { width, format } = metadata;
  const ext = path.extname(imagePath).toLowerCase();
  const baseName = path.basename(imagePath, ext);
  const dir = path.dirname(imagePath);

  const needsResize = width && width > MAX_WIDTH;
  const needsConvert = format !== 'webp';

  if (!needsResize && !needsConvert) {
    console.log(`[skip]    ${imagePath} (${width}px, already webp)`);
    return;
  }

  const outputPath = path.join(dir, `${baseName}.webp`);

  let pipeline = image;
  if (needsResize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  pipeline = pipeline.webp({ quality: 85 });

  await pipeline.toFile(outputPath);

  const reason = [
    needsResize ? `resized from ${width}px to max ${MAX_WIDTH}px` : null,
    needsConvert ? `converted from ${format} to webp` : null,
  ]
    .filter(Boolean)
    .join(', ');

  // Remove the original if it was a different file (non-webp source)
  if (ext !== '.webp') {
    const { unlink } = await import('fs/promises');
    await unlink(imagePath);
    console.log(`[process] ${imagePath} -> ${outputPath} (${reason})`);
  } else {
    console.log(`[process] ${imagePath} (${reason})`);
  }
}

async function main() {
  console.log(`Scanning ${SRC_DIR} for images...`);

  let images;
  try {
    images = await findImages(SRC_DIR);
  } catch (err) {
    console.error(`Failed to scan directory: ${err.message}`);
    process.exit(1);
  }

  if (images.length === 0) {
    console.log('No images found.');
    return;
  }

  console.log(`Found ${images.length} image(s). Processing...\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const imagePath of images) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { width, format } = metadata;
      const needsResize = width && width > MAX_WIDTH;
      const needsConvert = format !== 'webp';

      if (!needsResize && !needsConvert) {
        skipped++;
        console.log(`[skip]    ${imagePath} (${width}px, already webp)`);
      } else {
        await processImage(imagePath);
        processed++;
      }
    } catch (err) {
      console.error(`[error]   ${imagePath}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Processed: ${processed}, Skipped: ${skipped}, Failed: ${failed}`);
}

main();
