import { NextResponse } from 'next/server';

/**
 * Proxy for WebSocket health check
 * Fixes Mixed Content issues (HTTPS -> HTTP)
 */
export async function GET() {
  try {
    const EC2_WEBSOCKET_URL = 'http://13.55.157.43:8000';

    const response = await fetch(`${EC2_WEBSOCKET_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'WebSocket service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[WEBSOCKET PROXY] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        service: 'Polymarket WebSocket Monitor (Proxy)',
      },
      {
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
