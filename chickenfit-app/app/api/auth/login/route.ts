import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { supabaseAdmin } from '@/lib/db-server';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'Email and password are required', status: 400 } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', status: 401 } },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: { code: 'LOGIN_FAILED', message: error.message, status: 500 } },
        { status: 500 }
      );
    }

    // Fetch user profile
    let profile = null;
    if (data.user?.id) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      profile = profileData;
    }

    return NextResponse.json({
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: profile?.display_name || data.user?.user_metadata?.name || email.split('@')[0],
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}
