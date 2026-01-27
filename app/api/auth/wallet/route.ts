import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletOwnership, createWalletSession } from '@/lib/auth';
import { generateNonce, verifySignature } from '@/lib/crypto-auth';

// Store nonces temporarily (in production, use Redis or similar)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Cleanup old nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of nonceStore.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) {
      nonceStore.delete(address);
    }
  }
}, 5 * 60 * 1000);

// Step 1: Get a nonce to sign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Generate a unique nonce
    const nonce = generateNonce();
    nonceStore.set(address.toLowerCase(), {
      nonce,
      timestamp: Date.now(),
    });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Step 2: Verify signature and create session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature, nonce } = body;

    console.log('🔍 POST /api/auth/wallet - Received:');
    console.log('Address:', address);
    console.log('Address (lowercase):', address?.toLowerCase());
    console.log('Signature:', signature);
    console.log('Nonce (from client):', nonce);
    console.log('Authorized wallet from env:', process.env.AUTHORIZED_WALLET_ADDRESS);

    if (!address || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Address, signature, and nonce are required' },
        { status: 400 }
      );
    }

    // Get the nonce for this address (for validation)
    const storedData = nonceStore.get(address.toLowerCase());
    console.log('Stored nonce data:', storedData);

    // Validate that the nonce matches what we issued
    if (storedData && storedData.nonce !== nonce) {
      return NextResponse.json(
        { error: 'Invalid nonce. Please request a new nonce.' },
        { status: 400 }
      );
    }

    // Check if nonce is expired (5 minutes)
    if (storedData && Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      nonceStore.delete(address.toLowerCase());
      return NextResponse.json(
        { error: 'Nonce expired. Please request a new nonce.' },
        { status: 400 }
      );
    }

    // Verify the signature using the nonce from the client
    const isValidSignature = await verifySignature(
      address,
      signature,
      nonce
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Verify this is the authorized wallet
    const isAuthorized = verifyWalletOwnership(address);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized wallet address. Only the bot owner can access this dashboard.' },
        { status: 403 }
      );
    }

    // Clean up used nonce
    nonceStore.delete(address.toLowerCase());

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
