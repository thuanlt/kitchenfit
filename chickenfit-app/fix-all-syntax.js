const fs = require('fs');
const path = require('path');

const filesToFix = [
  'components/BottomTabBar.tsx',
  'components/WaterTracker.tsx',
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
    
    // Fix multiple issues
    let fixed = false;
    
    // Fix double quote at start
    if (content.startsWith('""use client";')) {
      content = content.replace(/^""use client";/, '"use client";');
      fixed = true;
    }
    
    // Fix trailing quote at end
    if (content.endsWith('"')) {
      content = content.slice(0, -1);
      fixed = true;
    }
    
    // Fix unterminated string at end
    if (content.trim().endsWith('}"')) {
      content = content.trim().slice(0, -1) + '}';
      fixed = true;
    }
    
    if (fixed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no issues found)`);
    }
  } else {
    console.log(`❌ Not found: ${filePath}`);
  }
});

console.log('\n🎉 All syntax fixes complete!');