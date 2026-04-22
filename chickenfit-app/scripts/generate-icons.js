/**
 * Generate PWA icon PNGs from public/icon-source.svg
 *
 * Run once:
 *   npm install sharp --save-dev
 *   node scripts/generate-icons.js
 */

const path = require('path');
const fs   = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\n❌  sharp not installed.\n   Run:  npm install sharp --save-dev\n   Then: node scripts/generate-icons.js\n');
  process.exit(1);
}

const SRC   = path.resolve(__dirname, '../public/icon-source.svg');
const ICONS = path.resolve(__dirname, '../public/icons');
const ROOT  = path.resolve(__dirname, '../public');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('❌  Source not found:', SRC);
    process.exit(1);
  }

  fs.mkdirSync(ICONS, { recursive: true });

  for (const size of SIZES) {
    await sharp(SRC)
      .resize(size, size)
      .png({ quality: 90, compressionLevel: 8 })
      .toFile(path.join(ICONS, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // apple-touch-icon (180×180) → public root
  await sharp(SRC).resize(180, 180).png({ quality: 90 })
    .toFile(path.join(ROOT, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // favicon (32×32) → public root
  await sharp(SRC).resize(32, 32).png({ quality: 90 })
    .toFile(path.join(ROOT, 'favicon.png'));
  console.log('  ✓ favicon.png (32×32)');

  console.log('\n✅  Done! All icons in public/icons/\n');
}

main().catch(err => { console.error(err); process.exit(1); });
