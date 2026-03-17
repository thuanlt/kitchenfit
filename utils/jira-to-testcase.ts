/**
 * jira-to-testcase.ts
 * Pipeline: Jira Task (text + images + Figma) → gemma-3-27b-it (vision) → gpt-oss-120b → Test Cases
 *
 * Usage:
 *   npx ts-node utils/jira-to-testcase.ts NCPP-6178
 *   npx ts-node utils/jira-to-testcase.ts NCPP-6178 --post   # post test cases back to Jira
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Config ───────────────────────────────────────────────────────────────────
const JIRA_BASE    = process.env.JIRA_BASE_URL!;
const JIRA_SESSION = process.env.JIRA_SESSION!;
const FPT_BASE     = process.env.FPT_API_URL!;
const FPT_KEY      = process.env.FPT_API_KEY!;
const FPT_FROM     = process.env.FPT_FROM!;

const VISION_MODEL  = 'gemma-3-27b-it';    // Step 1: describe images/UI
const REASON_MODEL  = 'gpt-oss-120b';      // Step 2: generate test cases

const ISSUE_KEY = process.argv[2];
const POST_BACK = process.argv.includes('--post');

const PROXY = process.env.https_proxy || process.env.HTTPS_PROXY
           || process.env.http_proxy  || process.env.HTTP_PROXY
           || 'http://10.36.252.45:8080';
const proxy = new ProxyAgent(PROXY);

const jiraHeaders: Record<string, string> = {
  'Cookie':  `JSESSIONID=${JIRA_SESSION}`,
  'Accept':  'application/json',
};

// ─── Jira helpers ─────────────────────────────────────────────────────────────
async function jiraGet<T>(path: string): Promise<T> {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    headers: jiraHeaders, dispatcher: proxy,
  } as any);
  if (!res.ok) throw new Error(`Jira GET ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function jiraPost(path: string, body: object): Promise<void> {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    method: 'POST',
    headers: { ...jiraHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    dispatcher: proxy,
  } as any);
  if (!res.ok) throw new Error(`Jira POST ${path} → HTTP ${res.status}: ${await res.text()}`);
}

// Download image attachment from Jira → base64
async function downloadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'Cookie': `JSESSIONID=${JIRA_SESSION}` }, dispatcher: proxy } as any);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? 'image/png';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${ct};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

// ─── FPT API helpers ──────────────────────────────────────────────────────────
async function callFPT(model: string, messages: any[], maxTokens = 2048): Promise<string> {
  const res = await fetch(
    `${FPT_BASE}/v1/chat/completions?from=${FPT_FROM}&model=${model}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FPT_KEY}` },
      body:    JSON.stringify({ model, messages, streaming: false, temperature: 0.2, max_tokens: maxTokens }),
      dispatcher: proxy,
    } as any
  );
  if (!res.ok) throw new Error(`FPT API ${model} → HTTP ${res.status}: ${await res.text()}`);
  const body: any = await res.json();
  const msg = body.choices[0].message;
  const raw = msg.content ?? msg.reasoning_content ?? '';
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// ─── Step 1: Describe image with gemma-3-27b-it ───────────────────────────────
async function describeImage(base64: string, context: string): Promise<string> {
  const messages = [{
    role: 'user',
    content: [
      {
        type: 'text',
        text: `You are a QA analyst. This image is from a Jira task about: "${context}".
Describe in detail:
1. UI components visible (buttons, forms, tables, modals, etc.)
2. User flows/interactions shown
3. Data fields and their requirements
4. Edge cases visible in the design
5. Any error states or validation rules shown
Be specific and technical. Output in English.`,
      },
      { type: 'image_url', image_url: { url: base64 } },
    ],
  }];
  return callFPT(VISION_MODEL, messages, 1024);
}

// ─── Step 2: Generate test cases with gpt-oss-120b ───────────────────────────
async function generateTestCases(context: {
  summary:        string;
  description:    string;
  imageAnalyses:  string[];
  figmaLinks:     string[];
  comments:       string[];
  issueType:      string;
  acceptanceCriteria: string;
}): Promise<string> {
  const imageSection = context.imageAnalyses.length > 0
    ? `\n## Image/UI Analysis (${context.imageAnalyses.length} images):\n` +
      context.imageAnalyses.map((d, i) => `### Image ${i + 1}:\n${d}`).join('\n\n')
    : '';

  const figmaSection = context.figmaLinks.length > 0
    ? `\n## Figma Links:\n${context.figmaLinks.map(l => `- ${l}`).join('\n')}`
    : '';

  const prompt = `You are a senior QA engineer. Generate comprehensive test cases from this Jira task.

## Jira Task: ${context.summary}
**Type:** ${context.issueType}

## Description:
${context.description || '(no description)'}

## Acceptance Criteria:
${context.acceptanceCriteria || '(not specified)'}
${imageSection}
${figmaSection}
${context.comments.length > 0 ? `\n## Key Comments:\n${context.comments.slice(0, 3).join('\n---\n')}` : ''}

## Output Format:
Write test cases in this exact structure (in Vietnamese):

### TC-001: [Tên test case]
**Loại:** Positive / Negative / Edge Case
**Điều kiện tiên quyết:** ...
**Các bước thực hiện:**
1. ...
2. ...
**Kết quả mong đợi:** ...
**Độ ưu tiên:** High / Medium / Low

---

Requirements:
- Cover: happy path, negative cases, boundary values, UI validation
- Include at least 5 test cases
- Focus on what's visible in images/specs
- Add automation hint: [API] or [UI] or [Manual] for each TC`;

  return callFPT(REASON_MODEL, [{ role: 'user', content: prompt }], 3000);
}

// ─── Extract text content from Jira description (ADF or wiki) ─────────────────
function extractText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (content.type === 'text') return content.text ?? '';
  if (content.type === 'mention') return `@${content.attrs?.text ?? ''}`;
  if (content.type === 'inlineCard') return content.attrs?.url ?? '';
  if (content.content) return content.content.map(extractText).join(' ');
  return '';
}

function extractFigmaLinks(text: string): string[] {
  const matches = text.match(/https:\/\/(?:www\.)?figma\.com\/[^\s"')]+/g) ?? [];
  return [...new Set(matches)];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!ISSUE_KEY) {
    console.error('❌ Usage: npx ts-node utils/jira-to-testcase.ts NCPP-XXXX [--post]');
    process.exit(1);
  }

  console.log(`\n📋 Fetching Jira issue: ${ISSUE_KEY}...`);
  const issue: any = await jiraGet(
    `/rest/api/2/issue/${ISSUE_KEY}?expand=renderedFields,names,schema,transitions,editmeta`
  );

  const fields       = issue.fields;
  const summary      = fields.summary ?? '';
  const issueType    = fields.issuetype?.name ?? 'Task';
  const descRaw      = fields.description;
  const description  = typeof descRaw === 'string' ? descRaw : extractText(descRaw);
  const attachments  = (fields.attachment ?? []) as any[];
  const comments     = ((fields.comment?.comments) ?? []) as any[];
  const allText      = `${summary} ${description} ${comments.map((c: any) => extractText(c.body)).join(' ')}`;
  const figmaLinks   = extractFigmaLinks(allText);

  // Extract acceptance criteria from description
  const acMatch = description.match(/acceptance criteria[:\s]*([\s\S]*?)(?:\n\n|\n#|$)/i);
  const acceptanceCriteria = acMatch?.[1]?.trim() ?? '';

  console.log(`   Summary  : ${summary}`);
  console.log(`   Type     : ${issueType}`);
  console.log(`   Images   : ${attachments.filter((a: any) => a.mimeType?.startsWith('image/')).length}`);
  console.log(`   Figma    : ${figmaLinks.length} link(s)`);
  console.log(`   Comments : ${comments.length}`);

  // ── Step 1: Process images ──
  const imageAnalyses: string[] = [];
  const imageAttachments = attachments.filter((a: any) => a.mimeType?.startsWith('image/'));

  if (imageAttachments.length > 0) {
    console.log(`\n🖼️  Processing ${imageAttachments.length} image(s) with ${VISION_MODEL}...`);
    for (const att of imageAttachments.slice(0, 5)) { // max 5 images
      console.log(`   → ${att.filename} (${att.mimeType})`);
      const base64 = await downloadImage(att.content);
      if (!base64) { console.log(`     ⚠️  Could not download`); continue; }
      const desc = await describeImage(base64, summary);
      imageAnalyses.push(`**${att.filename}:**\n${desc}`);
      console.log(`     ✅ Described (${desc.length} chars)`);
    }
  } else {
    console.log(`\n🖼️  No image attachments found`);
  }

  if (figmaLinks.length > 0) {
    console.log(`\n🎨 Found ${figmaLinks.length} Figma link(s):`);
    figmaLinks.forEach(l => console.log(`   - ${l}`));
  }

  // ── Step 2: Generate test cases ──
  console.log(`\n🤖 Generating test cases with ${REASON_MODEL}...`);
  const testCases = await generateTestCases({
    summary,
    description,
    imageAnalyses,
    figmaLinks,
    issueType,
    acceptanceCriteria,
    comments: comments.slice(0, 5).map((c: any) =>
      `[${c.author?.displayName}]: ${extractText(c.body)}`
    ),
  });

  console.log('\n' + '─'.repeat(60));
  console.log('📝 Generated Test Cases:');
  console.log('─'.repeat(60));
  console.log(testCases);

  // ── Save to file ──
  const outDir  = path.resolve(__dirname, '../reports/testcases');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${ISSUE_KEY}-testcases.md`);
  const content = `# Test Cases — ${ISSUE_KEY}: ${summary}
**Generated:** ${new Date().toISOString()}
**Vision Model:** ${VISION_MODEL}
**Reasoning Model:** ${REASON_MODEL}
**Images processed:** ${imageAnalyses.length}
**Figma links:** ${figmaLinks.length}

---

${testCases}
`;
  fs.writeFileSync(outFile, content, 'utf-8');
  console.log(`\n✅ Saved to: ${outFile}`);

  // ── Post back to Jira ──
  if (POST_BACK) {
    console.log(`\n📤 Posting test cases to ${ISSUE_KEY}...`);
    const jiraComment = `h3. 🤖 Test Cases - Auto Generated
_Generated by: ${VISION_MODEL} (vision) + ${REASON_MODEL} (reasoning)_
_Date: ${new Date().toLocaleDateString('vi-VN')}_

${testCases.substring(0, 20000)}`; // Jira comment limit
    await jiraPost(`/rest/api/2/issue/${ISSUE_KEY}/comment`, { body: jiraComment });
    console.log(`✅ Posted to ${JIRA_BASE}/browse/${ISSUE_KEY}`);
  }

  console.log('\n🎉 Done!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
