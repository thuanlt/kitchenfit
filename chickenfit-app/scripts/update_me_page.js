const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/me/page.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

// Find the section with "Công thức" and add privacy/terms links after it
const pattern = /(<div style={{ padding: "13px 16px", borderBottom: "0\.5px solid var\(--sep\)", display: "flex", justifyContent: "space-between" }}>\s*<span style={{ fontSize: 14, color: "var\(--text2\)" }}>[^<]*<\/span>\s*<span style={{ fontSize: 14, fontWeight: 700, color: "var\(--text\)" }}>99[^<]*<\/span>\s*<\/div>)/;

const replacement = `$1<div style={{ borderBottom: "0.5px solid var(--sep)" }}><MenuItem icon="🔒" iconBg="#E8F0F8" title="Chính sách bảo mật" sub="Xem cách chúng tôi bảo vệ dữ liệu" href="/privacy" /></div><div style={{ borderBottom: "0.5px solid var(--sep)" }}><MenuItem icon="📜" iconBg="#F8F0E8" title="Điều khoản sử dụng" sub="Quy định và trách nhiệm" href="/terms" /></div>`;

const newContent = content.replace(pattern, replacement);

fs.writeFileSync(filePath, newContent, 'utf-8');

console.log('✓ Updated me/page.tsx with Privacy Policy and Terms links');