"const fs = require('fs');
const content = fs.readFileSync('store/profile.store.new.ts', 'utf8');
const fixed = content.replace(/^"/, '').replace(/"$/, '');
fs.writeFileSync('store/profile.store.ts', fixed);
console.log('Fixed profile.store.ts');"