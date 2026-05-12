import { type NextRequest, NextResponse } from 'next/server';
import { fetchWellKnown } from '@/lib/api/wellknown';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const wellKnown = await fetchWellKnown();
  if (!wellKnown) {
    return NextResponse.json(
      { data: null, error: { code: 'OFFLINE', message: 'Server unreachable.', status: 503 }, time: Date.now(), request: '/api/auth/logout' },
      { status: 503 },
    );
  }

  const backendUrl = `${wellKnown.gateway.api.replace(/\/$/, '')}/api/auth/logout`;

  // Forward the _uid cookie to the backend so it can invalidate the session
  const cookieStore = await cookies();
  const uidCookie = cookieStore.get('_uid');
  const cookieHeader = uidCookie ? `_uid=${uidCookie.value}` : '';

  const backendRes = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });

  const json = await backendRes.json().catch(() => ({ data: null, error: null }));
  const response = NextResponse.json(json, { status: backendRes.status });

  // Clear the _uid cookie in the browser
  response.cookies.set('_uid', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
