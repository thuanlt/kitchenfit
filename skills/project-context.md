# Project Context — FPT AI Marketplace Automation

## Environments
| ENV | BASE_URL | API_URL |
|-----|----------|---------|
| prod | https://marketplace.fptcloud.com/en | https://mkp-api.fptcloud.com |
| stg  | https://marketplace-stg.fptcloud.net/en | https://mkp-api-stg.fptcloud.net |
| jp   | https://marketplace.fptcloud.jp/en | https://mkp-api.fptcloud.jp |

## Project Structure
```
tests/
├── api/          ← API inference tests (Classic Playwright)
├── regression/   ← UI regression tests
├── smoke/        ← Quick smoke tests
└── exploration/  ← Sandbox / WIP tests

utils/
├── config.ts           ← centralized config loader
├── fpt-agent.ts        ← FPT AI client, fallback chain
├── glm-direct.ts       ← generate test via AI
├── openclaw-agent.ts   ← autonomous test agent
├── jira-reporter.ts    ← post results to Jira
└── playwright-ai.ts    ← AI-native locator helper

skills/
├── qa-checklist.md     ← 10-point QA checklist
├── playwright-rules.md ← locator rules, POM, Ant Design tips
├── project-context.md  ← this file
└── system-prompt.md    ← AI agent system prompt
```

## Config import
```typescript
import { config } from '../../utils/config';
// config.baseUrl, config.fptApiUrl, config.fptApiKey, config.fptFrom
```

## Auth files
```
playwright/.auth/prod-user.json   ← production session
playwright/.auth/stg-user.json    ← staging session
playwright/.auth/prod-ai-user.json ← ai.fptcloud.com session
```

## Test ID Format
- UI tests:  `TC_FEATURE_NNN`  — ví dụ `TC_APIKEY_011`
- API tests: `TC_API_NNN`      — ví dụ `TC_API_042`
- JP tests:  `TC_JP_NNN`       — ví dụ `TC_JP_024`

## AI Models (FPT)
| Model | Dùng cho |
|-------|---------|
| Kimi-K2.5 | Orchestrator, reasoning |
| GLM-4.7 | Code gen, analyze |
| Qwen3-32B | Jira comment, formatter |
| Qwen2.5-Coder-32B | Code specialist |
| DeepSeek-V3.2 | General + code fallback |
| Qwen2.5-VL-7B | Vision / screenshot analysis |
| gpt-oss-120b | Gen Playwright script |

## CI/CD
- Runner: Windows GitLab Runner (shell executor / PowerShell)
- Schedule: daily cron
- Report: Teams webhook (Market Place channel + AUTO_TEST_MODAS group)
- Browsers pre-installed: `C:\playwright-browsers`
