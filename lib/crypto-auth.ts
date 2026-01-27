import { verifyMessage } from 'viem';

/**
 * Generate a unique nonce for message signing
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Generate the message to sign
 */
export function generateSignMessage(address: string, nonce: string): string {
  return `Sign this message to authenticate with Polymarket Trading Bot.

Address: ${address}
Nonce: ${nonce}

This signature will not trigger any blockchain transaction or cost any gas fees.`;
}

/**
 * Verify the signature server-side
 */
export async function verifySignature(
  address: string,
  signature: string,
  nonce: string
): Promise<boolean> {
  try {
    const message = generateSignMessage(address, nonce);

    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
