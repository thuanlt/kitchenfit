/**
 * Create placeholder PNG icons using canvas
 * Install: npm install sharp --save-dev
 * Run: node scripts/create-png-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp package not installed!');
  console.error('Run: npm install sharp --save-dev');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '../public/icons');

// SVG content
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="48" fill="#B85C38"/>
  <rect x="24" y="24" width="144" height="144" rx="32" fill="#C9703E"/>
  <text x="96" y="140" font-family="Arial,Helvetica,sans-serif" font-size="100" font-weight="900" text-anchor="middle" fill="#fff">C</text>
  <text x="148" y="80" font-size="40" text-anchor="middle">🍗</text>
</svg>
`;

async function createIcons() {
  console.log('🎨 Creating PNG icons...\n');
  
  for (const size of sizes) {
    const filename = `icon-${size}.png`;
    const filepath = path.join(publicDir, filename);
    
    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(filepath);
      
      console.log(`✓ Created ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to create ${filename}:`, error.message);
    }
  }
  
  console.log('\n✅ All icons created successfully!');
  console.log(`📁 Location: ${publicDir}`);
}

createIcons().catch(console.error);