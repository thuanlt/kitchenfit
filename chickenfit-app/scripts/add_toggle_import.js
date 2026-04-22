const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/me/page.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

// Add import for the new Toggle component after useProfileStore import
const importPattern = /(import \{ useProfileStore \} from "\.\.\/store\/profile\.store";)/;
const importReplacement = `$1\nimport { Toggle } from "../components/Toggle";`;

if (!content.includes('import { Toggle }')) {
  content = content.replace(importPattern, importReplacement);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✓ Added Toggle import to me/page.tsx');
} else {
  console.log('✓ Toggle import already exists in me/page.tsx');
}