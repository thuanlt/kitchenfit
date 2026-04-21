The user wants me to apply a specific edit to an original TypeScript/Next.js file.

**Original Code Analysis:**
- Imports `NextRequest`, `NextResponse` from 'next/server'.
- Imports `supabaseAdmin` from '@/lib/db-server'.
- Exports an async function `GET`.

**Suggested Edit Analysis:**
- The edit changes the import statement for `supabaseAdmin`.
- Original: `import { supabaseAdmin } from '../../../../lib/db-server';`
- Suggested: `import { supabaseAdmin } from '../../../../lib/db-server';`
- The rest of the code block in the suggestion starts with `export async function GET(` but doesn't finish the function signature or body, implying I should just take the import change and keep the rest of the original code.

**Task:**
1. Replace the relative path alias `@/lib/db-server` with a relative path `../../../../lib/db-server` in the import statement.
2. Keep the rest of the code exactly as is.
3. Output ONLY the code.

**Step-by-step Execution:**
1. Copy the original code.
2. Locate line 2: `import { supabaseAdmin } from '../../../../lib/db-server';`.
3. Replace it with: `import { supabaseAdmin } from '../../../../lib/db-server';`.
4. Ensure the rest of the file remains identical.

**Verification:**
- Line 1: `import { NextRequest, NextResponse } from 'next/server';` (Unchanged)
- Line 2: `import { supabaseAdmin } from '../../../../lib/db-server';` (Changed)
- Line 4: `export async function GET(` (Unchanged)
- ... rest of file (Unchanged)

The prompt asks to output the complete modified file.

**Constructing the output:**
