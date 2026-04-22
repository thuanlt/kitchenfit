const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/me/page.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

// Remove the old Toggle function definition
const oldTogglePattern = /function Toggle\(\{ storageKey, onEnable \}: \{ storageKey: string; onEnable\?: \(\) => Promise<boolean> \}\) \{[\s\S]*?\n\}/;
content = content.replace(oldTogglePattern, '');

// Add import for the new Toggle component
const importPattern = /(import \{ useProfileStore \} from "\.\.\/store\/profile\.store";)/;
const importReplacement = `$1\nimport { Toggle } from "../components/Toggle";`;
content = content.replace(importPattern, importReplacement);

fs.writeFileSync(filePath, content, 'utf-8');

console.log('✓ Updated me/page.tsx to use new Toggle component');