import re

file_path = '../app/me/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the section with "Công thức" and add privacy/terms links after it
pattern = r'(<div style={{ padding: "13px 16px", borderBottom: "0\.5px solid var\(--sep\)", display: "flex", justifyContent: "space-between" }}>\s*<span style={{ fontSize: 14, color: "var\(--text2\)" }}>[^<]*</span>\s*<span style={{ fontSize: 14, fontWeight: 700, color: "var\(--text\)" }}>99[^<]*</span>\s*</div>)'

replacement = r'''\1<div style={{ borderBottom: "0.5px solid var(--sep)" }}><MenuItem icon="🔒" iconBg="#E8F0F8" title="Chính sách bảo mật" sub="Xem cách chúng tôi bảo vệ dữ liệu" href="/privacy" /></div><div style={{ borderBottom: "0.5px solid var(--sep)" }}><MenuItem icon="📜" iconBg="#F8F0E8" title="Điều khoản sử dụng" sub="Quy định và trách nhiệm" href="/terms" /></div>'''

new_content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('✓ Updated me/page.tsx with Privacy Policy and Terms links')