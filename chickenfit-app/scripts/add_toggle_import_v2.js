const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/me/page.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

// Add import for the new Toggle component after the last import
const importsEnd = content.indexOf('const ACTIVITY_OPTIONS');

if (importsEnd !== -1 && !content.includes('import { Toggle }')) {
  const newContent = content.substring(0, importsEnd) + 'import { Toggle } from "../components/Toggle";\n\n' + content.substring(importsEnd);
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log('✓ Added Toggle import to me/page.tsx');
} else {
  console.log('✓ Toggle import already exists or could not find insertion point');
}