import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db-server';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      return NextResponse.json({
        error: 'NEXT_PUBLIC_SUPABASE_URL not configured',
        config: {
          hasUrl: false,
          hasServiceKey,
        }
      }, { status: 500 });
    }

    if (!hasServiceKey) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
        config: {
          hasUrl: true,
          url: supabaseUrl.substring(0, 20) + '...',
          hasServiceKey: false,
        }
      }, { status: 500 });
    }

    // Test connection
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({
        error: 'Supabase connection failed',
        details: error.message,
        config: {
          hasUrl: true,
          url: supabaseUrl.substring(0, 20) + '...',
          hasServiceKey: true,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      config: {
        hasUrl: true,
        url: supabaseUrl.substring(0, 20) + '...',
        hasServiceKey: true,
      },
      usersCount: data.users?.length || 0,
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}