import { NextRequest } from 'next/server';

// Authorized wallet address (set in .env)
export const AUTHORIZED_WALLET = process.env.AUTHORIZED_WALLET_ADDRESS?.toLowerCase();

// Auth token for API protection
export const AUTH_TOKEN = process.env.AUTH_TOKEN;

/**
 * Verify if the request has valid authorization
 * Checks for either:
 * 1. Auth token in headers
 * 2. Valid session with authorized wallet
 */
export function verifyAuth(request: NextRequest): { authorized: boolean; reason?: string } {
  // Check for auth token in headers
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.replace('Bearer ', '');

  if (tokenFromHeader && AUTH_TOKEN && tokenFromHeader === AUTH_TOKEN) {
    return { authorized: true };
  }

  // Check for wallet address in session cookie
  const sessionCookie = request.cookies.get('wallet_session')?.value;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      const walletAddress = session.address?.toLowerCase();

      if (walletAddress && AUTHORIZED_WALLET && walletAddress === AUTHORIZED_WALLET) {
        // Check if session is not expired (24h)
        const sessionAge = Date.now() - session.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          return { authorized: true };
        }
        return { authorized: false, reason: 'Session expired' };
      }
      return { authorized: false, reason: 'Unauthorized wallet' };
    } catch (e) {
      return { authorized: false, reason: 'Invalid session' };
    }
  }

  return { authorized: false, reason: 'No authentication provided' };
}

/**
 * Create a wallet session
 */
export function createWalletSession(address: string) {
  return JSON.stringify({
    address: address.toLowerCase(),
    timestamp: Date.now(),
  });
}

/**
 * Verify message signature (for wallet auth)
 * Simple verification - in production you'd verify the actual signature
 */
export function verifyWalletOwnership(address: string): boolean {
  console.log('🔍 Verifying wallet ownership:');
  console.log('  - Address (input):', address);
  console.log('  - Address (normalized):', address.toLowerCase());
  console.log('  - Authorized wallet:', AUTHORIZED_WALLET);
  console.log('  - Authorized wallet from env:', process.env.AUTHORIZED_WALLET_ADDRESS);

  if (!AUTHORIZED_WALLET) {
    console.warn('⚠️ AUTHORIZED_WALLET_ADDRESS not set in environment variables');
    return false;
  }

  const isAuthorized = address.toLowerCase() === AUTHORIZED_WALLET;
  console.log('  - Is authorized:', isAuthorized);

  return isAuthorized;
}
