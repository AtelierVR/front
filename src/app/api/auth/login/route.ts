import { type NextRequest, NextResponse } from 'next/server';
import { fetchWellKnown } from '@/lib/api/wellknown';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const wellKnown = await fetchWellKnown();
  if (!wellKnown) {
    return NextResponse.json(
      { data: null, error: { code: 'OFFLINE', message: 'Server unreachable.', status: 503 }, time: Date.now(), request: '/api/auth/login' },
      { status: 503 },
    );
  }

  const backendUrl = `${wellKnown.gateway.api.replace(/\/$/, '')}/api/auth/login`;

  const body = await request.text();

  const backendRes = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const json = await backendRes.json();
  const response = NextResponse.json(json, { status: backendRes.status });

  // Relay Set-Cookie header (httpOnly _uid cookie) from backend to browser
  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }

  return response;
}
