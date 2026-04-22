import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db-server';
import { getUserId } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subscription, label } = body as {
    subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
    label?: string;
  };

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const userId = await getUserId(req);

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh ?? null,
        auth_key: subscription.keys?.auth ?? null,
        label: label ?? 'all',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
