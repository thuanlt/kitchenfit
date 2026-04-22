import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, confirmPassword } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'Email and password are required', status: 400 } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { code: 'INVALID_EMAIL', message: 'Invalid email format', status: 400 } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters', status: 400 } },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match', status: 400 } },
        { status: 400 }
      );
    }

    // Mock successful signup
    const mockUserId = 'mock_' + Date.now();
    
    return NextResponse.json({
      data: {
        user: {
          id: mockUserId,
          email: email,
          name: name || email.split('@')[0],
        },
        session: {
          access_token: 'mock_access_token_' + Date.now(),
          refresh_token: 'mock_refresh_token_' + Date.now(),
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 } },
      { status: 500 }
    );
  }
}
