const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive syntax fix...\n');

const filesToFix = [
  'components/WaterTracker.tsx',
  'components/MacroAnalysis.tsx',
  'components/BarcodeScanner.tsx', 
  'components/ShoppingList.tsx',
  'app/shopping/page.tsx',
  'app/progress/page.tsx'
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLength = content.length;
    
    // Fix 1: Double quote at start
    if (content.startsWith('""use client";')) {
      content = content.replace(/^""use client";/, '"use client";');
      console.log(`✅ Fixed double quote at start: ${filePath}`);
    }
    
    // Fix 2: Trailing quote at end
    while (content.endsWith('"') && !content.endsWith('";')) {
      content = content.slice(0, -1);
      console.log(`✅ Removed trailing quote: ${filePath}`);
    }
    
    // Fix 3: Unterminated string like }" at end
    if (content.trim().endsWith('}"')) {
      content = content.trim().slice(0, -1) + '}';
      console.log(`✅ Fixed unterminated string: ${filePath}`);
    }
    
    // Fix 4: Remove empty lines at start
    content = content.replace(/^(\n)+/, '');
    
    // Only write if changed
    if (content.length !== originalLength) {
      fs.writeFileSync(fullPath, content, 'utf8');
      totalFixed++;
      console.log(`💾 Saved: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } else {
    console.log(`❌ Not found: ${filePath}`);
  }
});

console.log(`\n🎉 Comprehensive fix complete! Total files fixed: ${totalFixed}/${filesToFix.length}`);
console.log('\n📋 Testing all pages...');