import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletOwnership, createWalletSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Verify this is the authorized wallet
    const isAuthorized = verifyWalletOwnership(address);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized wallet address' },
        { status: 403 }
      );
    }

    // Create session
    const session = createWalletSession(address);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      address: address.toLowerCase(),
      message: 'Authentication successful',
    });

    response.cookies.set('wallet_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });

  response.cookies.delete('wallet_session');

  return response;
}

// Check auth status
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('wallet_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const session = JSON.parse(sessionCookie);
    const sessionAge = Date.now() - session.timestamp;

    if (sessionAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ authenticated: false, reason: 'Session expired' });
    }

    return NextResponse.json({
      authenticated: true,
      address: session.address,
    });
  } catch (e) {
    return NextResponse.json({ authenticated: false, reason: 'Invalid session' });
  }
}
