/**
 * translate.ts — Dịch tài liệu Việt ↔ Anh
 *
 * Usage:
 *   npx ts-node utils/translate.ts "Xin chào thế giới"
 *   npx ts-node utils/translate.ts --to vi "Hello world"
 *   npx ts-node utils/translate.ts --to en "Tôi muốn dịch bài này"
 *   npx ts-node utils/translate.ts --file ai-product-dev-toolstack.txt
 *   npx ts-node utils/translate.ts --file doc.txt --to vi
 *
 * Mặc định: tự phát hiện ngôn ngữ nguồn và dịch sang ngôn ngữ còn lại.
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
dotenv.config();

// ─── Proxy ────────────────────────────────────────────────────────────────────
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
if (PROXY_URL) {
  try {
    setGlobalDispatcher(new ProxyAgent(PROXY_URL));
  } catch { /* ignore */ }
}

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type Lang = 'vi' | 'en' | 'auto';

function buildPrompt(text: string, targetLang: Lang): string {
  if (targetLang === 'en') {
    return `Translate the following Vietnamese text to English. Return ONLY the translated text, no explanations.\n\n${text}`;
  }
  if (targetLang === 'vi') {
    return `Translate the following English text to Vietnamese. Return ONLY the translated text, no explanations.\n\n${text}`;
  }
  // auto: detect and translate to the other language
  return `Detect the language of the following text (Vietnamese or English), then translate it to the other language. Return ONLY the translated text, no explanations or language labels.\n\n${text}`;
}

async function translate(text: string, targetLang: Lang = 'auto'): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',   // nhanh + rẻ cho tác vụ dịch
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(text, targetLang) }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text.trim();
}

// ─── Chunk helper (tránh vượt context nếu file lớn) ──────────────────────────
function chunkText(text: string, maxChars = 6000): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;
    if (end < text.length) {
      // cắt ở dấu xuống dòng gần nhất
      const nl = text.lastIndexOf('\n', end);
      if (nl > start) end = nl + 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
translate.ts — Dịch tài liệu Việt ↔ Anh (dùng Claude)

Usage:
  npx ts-node utils/translate.ts "text cần dịch"
  npx ts-node utils/translate.ts --to vi "Hello world"
  npx ts-node utils/translate.ts --to en "Xin chào"
  npx ts-node utils/translate.ts --file path/to/file.txt
  npx ts-node utils/translate.ts --file path/to/file.txt --to vi --out output.txt

Options:
  --to <vi|en>    Ngôn ngữ đích (mặc định: tự phát hiện & dịch sang ngôn ngữ còn lại)
  --file <path>   Đọc văn bản từ file thay vì tham số dòng lệnh
  --out <path>    Ghi kết quả ra file (mặc định: in ra terminal)
`);
    process.exit(0);
  }

  // Parse args
  let targetLang: Lang = 'auto';
  let inputFile: string | null = null;
  let outputFile: string | null = null;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--to' && args[i + 1]) {
      const lang = args[++i].toLowerCase();
      if (lang !== 'vi' && lang !== 'en') {
        console.error('Lỗi: --to chỉ nhận "vi" hoặc "en"');
        process.exit(1);
      }
      targetLang = lang as Lang;
    } else if (args[i] === '--file' && args[i + 1]) {
      inputFile = args[++i];
    } else if (args[i] === '--out' && args[i + 1]) {
      outputFile = args[++i];
    } else if (!args[i].startsWith('--')) {
      positional.push(args[i]);
    }
  }

  // Lấy văn bản đầu vào
  let inputText: string;
  if (inputFile) {
    const filePath = path.isAbsolute(inputFile) ? inputFile : path.join(process.cwd(), inputFile);
    if (!fs.existsSync(filePath)) {
      console.error(`Lỗi: Không tìm thấy file "${filePath}"`);
      process.exit(1);
    }
    inputText = fs.readFileSync(filePath, 'utf-8');
    console.log(`Đọc file: ${filePath} (${inputText.length} ký tự)`);
  } else if (positional.length > 0) {
    inputText = positional.join(' ');
  } else {
    console.error('Lỗi: Cần cung cấp text hoặc --file');
    process.exit(1);
  }

  // Dịch (chia chunk nếu cần)
  const chunks = chunkText(inputText);
  const label = targetLang === 'auto' ? '(tự phát hiện)' : `→ ${targetLang.toUpperCase()}`;
  console.log(`Đang dịch ${label}... (${chunks.length} phần)`);

  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (chunks.length > 1) process.stdout.write(`  Phần ${i + 1}/${chunks.length}... `);
    const result = await translate(chunks[i], targetLang);
    translated.push(result);
    if (chunks.length > 1) console.log('xong');
  }

  const output = translated.join('\n');

  // Xuất kết quả
  if (outputFile) {
    const outPath = path.isAbsolute(outputFile) ? outputFile : path.join(process.cwd(), outputFile);
    fs.writeFileSync(outPath, output, 'utf-8');
    console.log(`\nĐã lưu kết quả vào: ${outPath}`);
  } else {
    console.log('\n─── KẾT QUẢ DỊCH ───────────────────────────────\n');
    console.log(output);
    console.log('\n────────────────────────────────────────────────');
  }
}

main().catch(err => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
