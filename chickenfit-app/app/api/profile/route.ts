1.  **Analyze the Request:**
    *   **Input:** `ORIGINAL CODE` (a Next.js API route for user profiles) and `SUGGESTED EDIT` (a change to an import path).
    *   **Task:** Apply the `SUGGESTED EDIT` to the `ORIGINAL CODE`.
    *   **Constraints:**
        *   Output ONLY code.
        *   No explanations, summaries, or descriptions.
        *   Keep existing comments unless necessary to modify them.
        *   Preserve unchanged code exactly.

2.  **Compare Original vs. Suggested:**
    *   *Original Import:* `import { supabaseAdmin } from '@/lib/db-server';`
    *   *Suggested Import:* `import { supabaseAdmin } from '../../../lib/db-server';`
    *   *Rest of the code:* The suggested edit snippet cuts off after the function signature comment, implying the rest of the file remains identical.

3.  **Determine the Change:**
    *   I need to replace line 2 of the original code with line 2 of the suggested edit.
    *   Original: `import { supabaseAdmin } from '@/lib/db-server';`
    *   New: `import { supabaseAdmin } from '../../../lib/db-server';`

4.  **Construct the Final Code:**
    *   Start with the new imports.
    *   Append the rest of the original code starting from the helper function `getUserId` down to the end of the `PUT` handler.

5.  **Review against Constraints:**
    *   *Output ONLY code?* Yes.
    *   *No explanation?* Yes.
    *   *Preserve comments?* Yes.
    *   *Preserve unchanged code?* Yes.

6.  **Final Output Generation:**
    (See the code block below```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db-server';

// Helper: extract user ID from Authorization header
function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  // In production, verify JWT with Supabase
  // For now, extract from token or return null
  return null;
}

// GET /api/profile — Get user profile
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found', status: 404 } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}

// PUT /api/profile — Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const allowedFields = ['display_name', 'gender', 'age', 'weight_kg', 'height_cm', 'activity', 'goal', 'tdee', 'onboarding_done'];
    const updates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'NO_FIELDS', message: 'No valid fields to update', status: 400 } },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}