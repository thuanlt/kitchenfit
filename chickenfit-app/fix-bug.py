import re

with open('app/me/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add fullName to profile object
content = re.sub(
    r'(const profile: UserProfile = \{)',
    r'\1\n    fullName: fullName || "",',
    content
)

# Fix 2: Change TextInput to use draft
content = re.sub(
    r'value=\{fullName \|\| ""\}',
    'value={editDraft.fullName || ""}',
    content
)

content = re.sub(
    r'onChange=\{v => setStoreProfile\(\{ fullName: v \}\)\}',
    'onChange={v => setDraft(d => ({ ...(d ?? profile), fullName: v }))}',
    content
)

# Fix 3: Update save function
content = re.sub(
    r'display_name: fullName,',
    'display_name: updated.fullName,',
    content
)

with open('app/me/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Bug fixed successfully!')