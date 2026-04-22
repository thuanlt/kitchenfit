const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/me/page.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

// Find and remove the old Toggle function definition
// It starts with "function Toggle(" and ends before "function MenuItem"
const oldToggleStart = content.indexOf('function Toggle(');

if (oldToggleStart !== -1) {
  const menuItemStart = content.indexOf('function MenuItem(');
  
  if (menuItemStart !== -1) {
    // Remove everything from Toggle function to MenuItem function
    content = content.substring(0, oldToggleStart) + content.substring(menuItemStart);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✓ Removed old Toggle function from me/page.tsx');
  } else {
    console.log('✗ Could not find MenuItem function to determine removal range');
  }
} else {
  console.log('✓ Old Toggle function not found (already removed?)');
}