const fs = require('fs');
const path = require('path');

const filesToFix = [
  'components/BottomTabBar.tsx',
  'components/MacroAnalysis.tsx',
  'components/BarcodeScanner.tsx', 
  'components/ShoppingList.tsx',
  'app/shopping/page.tsx',
  'app/progress/page.tsx'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the double quote issue at the start
    if (content.startsWith('""use client";')) {
      content = content.replace(/^""use client";/, '"use client";');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no issues found)`);
    }
  } else {
    console.log(`❌ Not found: ${filePath}`);
  }
});

console.log('\n🎉 Syntax fix complete!');