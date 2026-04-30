"with open('store/profile.store.new.ts', 'r', encoding='utf-8') as f:
    content = f.read()
fixed = content.strip('"')
with open('store/profile.store.ts', 'w', encoding='utf-8') as f:
    f.write(fixed)
print('Fixed profile.store.ts')"