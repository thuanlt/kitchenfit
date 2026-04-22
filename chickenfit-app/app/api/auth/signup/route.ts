import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'Email and password are required', status: 400 } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters', status: 400 } },
        { status: 400 }
      );
    }

    // Create user with email confirmation
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0],
      },
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        return NextResponse.json(
          { error: { code: 'EMAIL_EXISTS', message: 'Email already registered', status: 409 } },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: { code: 'SIGNUP_FAILED', message: userError.message, status: 500 } },
        { status: 500 }
      );
    }

    if (userData.user) {
      // Create profile
      await supabaseAdmin.from('profiles').insert({
        user_id: userData.user.id,
        display_name: name || email.split('@')[0],
        onboarding_done: false,
      });

      // Auto-login after signup to get session
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (sessionError) {
        // Return user data even if login fails
        return NextResponse.json(
          { 
            data: { 
              user: { 
                id: userData.user.id, 
                email: userData.user.email,
                name: name || email.split('@')[0],
              } 
            } 
          },
          { status: 201 }
        );
      }

      return NextResponse.json({
        data: {
          user: {
            id: sessionData.user?.id,
            email: sessionData.user?.email,
            name: name || email.split('@')[0],
          },
          session: {
            access_token: sessionData.session?.access_token,
            refresh_token: sessionData.session?.refresh_token,
            expires_at: sessionData.session?.expires_at,
          },
        },
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: { code: 'SIGNUP_FAILED', message: 'Failed to create user', status: 500 } },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}