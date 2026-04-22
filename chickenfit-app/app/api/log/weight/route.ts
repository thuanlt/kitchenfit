import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db-server';
import { getUserId } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '30'), 30);

    const { data: logs, error } = await supabaseAdmin
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: logs });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const weightKg = parseFloat(body.weight_kg);

    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      return NextResponse.json(
        { error: { code: 'INVALID_WEIGHT', message: 'Weight must be between 20-300 kg', status: 400 } },
        { status: 400 }
      );
    }

    const { data: log, error } = await supabaseAdmin
      .from('weight_logs')
      .upsert(
        {
          user_id: userId,
          weight_kg: weightKg,
          note: body.note ?? null,
          logged_at: body.logged_at ?? new Date().toISOString().split('T')[0],
        },
        { onConflict: 'user_id,logged_at' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'LOG_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: log }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}
