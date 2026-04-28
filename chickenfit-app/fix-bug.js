const fs = require('fs');

let content = fs.readFileSync('app/me/page.tsx', 'utf8');

// Fix 1: Add fullName to profile object
content = content.replace(
  /(const profile: UserProfile = \{)/,
  '$1\n    fullName: fullName || "",'
);

// Fix 2: Change TextInput value to use draft
content = content.replace(
  /value=\{fullName \|\| ""\}/g,
  'value={editDraft.fullName || ""}'
);

// Fix 3: Change TextInput onChange to use draft
content = content.replace(
  /onChange=\{v => setStoreProfile\(\{ fullName: v \}\)\}/g,
  'onChange={v => setDraft(d => ({ ...(d ?? profile), fullName: v }))}'
);

// Fix 4: Update save function to use draft.fullName
content = content.replace(
  /display_name: fullName,/g,
  'display_name: updated.fullName,'
);

fs.writeFileSync('app/me/page.tsx', content);
console.log('Bug fixed successfully!');