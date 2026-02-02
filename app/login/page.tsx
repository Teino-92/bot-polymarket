'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateSignMessage } from '@/lib/crypto-auth';
import { useAccount, useSignMessage, useConnect, useDisconnect } from 'wagmi';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [walletName, setWalletName] = useState<string>('Wallet');
  const [loginMethod, setLoginMethod] = useState<'metamask' | 'walletconnect' | null>(null);
  const router = useRouter();

  // Wagmi hooks for WalletConnect
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    // Detect if user is on mobile
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    // Check if any wallet extension is installed (MetaMask, Rabby, etc.)
    setHasMetaMask(typeof window.ethereum !== 'undefined');

    // Detect which wallet is installed for better UX
    if (window.ethereum) {
      const isRabby = window.ethereum.isRabby;
      const isMetaMask = window.ethereum.isMetaMask;
      console.log('Wallet detected:', { isRabby, isMetaMask });

      if (isRabby) {
        setWalletName('Rabby Wallet');
      } else if (isMetaMask) {
        setWalletName('MetaMask');
      } else {
        setWalletName('Browser Wallet');
      }
    }
  }, []);

  // Auto-authenticate when WalletConnect connects
  useEffect(() => {
    if (isConnected && address && loginMethod === 'walletconnect') {
      handleWalletConnectAuth(address);
    }
  }, [isConnected, address, loginMethod]);

  const handleWalletConnectAuth = async (walletAddress: string) => {
    setError('');
    setLoading(true);
    setStatus('Getting nonce...');

    try {
      console.log('[AUTH] Starting authentication for address:', walletAddress);

      // Get nonce from server
      const nonceResponse = await fetch(`/api/auth/wallet?address=${walletAddress}`);
      const { nonce, error: nonceError } = await nonceResponse.json();

      if (nonceError) {
        console.error('[AUTH] Nonce error:', nonceError);
        setError(nonceError);
        setLoading(false);
        disconnect();
        return;
      }

      console.log('[AUTH] Nonce received:', nonce);
      setStatus('Please sign the message in your wallet...');

      // Generate message to sign
      const message = generateSignMessage(walletAddress, nonce);
      console.log('[AUTH] Message to sign:', message);

      // Request signature using wagmi
      const signature = await signMessageAsync({ message });
      console.log('[AUTH] Signature received:', signature);

      setStatus('Verifying signature...');

      // Send signature to server for verification
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, signature, nonce }),
      });

      const authData = await authResponse.json();
      console.log('[AUTH] Server response:', authData);

      if (!authResponse.ok) {
        console.error('[AUTH] Verification failed:', authData);
        setError(authData.error || 'Authentication failed');
        setLoading(false);
        disconnect();
        return;
      }

      // Success! Redirect to dashboard
      console.log('[AUTH] Success!');
      setStatus('Success! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error('[AUTH] Error:', err);
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        setError('You rejected the signature request');
      } else {
        setError(err.message || 'Authentication failed');
      }
      setLoading(false);
      setLoginMethod(null);
      disconnect();
      setStatus('');
    }
  };

  const handleWalletConnectButton = async () => {
    setLoginMethod('walletconnect');
    setError('');
    setStatus('Opening WalletConnect...');

    try {
      // Find WalletConnect connector
      const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');
      if (walletConnectConnector) {
        connect({ connector: walletConnectConnector });
      } else {
        setError('WalletConnect not available');
        setLoginMethod(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setLoginMethod(null);
      setStatus('');
    }
  };

  const handleMetaMaskConnect = async () => {
    setLoginMethod('metamask');
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    setError('');
    setLoading(true);
    setStatus('Connecting to wallet...');

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      setStatus('Getting nonce...');

      // Get nonce from server
      const nonceResponse = await fetch(`/api/auth/wallet?address=${address}`);
      const { nonce, error: nonceError } = await nonceResponse.json();

      if (nonceError) {
        setError(nonceError);
        setLoading(false);
        return;
      }

      setStatus('Please sign the message in your wallet...');

      // Generate message to sign
      const message = generateSignMessage(address, nonce);

      // Request signature - MetaMask expects hex-encoded message or raw string
      // We'll send the raw string as MetaMask will handle the encoding
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      setStatus('Verifying signature...');

      // Send signature to server for verification
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        setError(authData.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      // Success! Redirect to dashboard
      setStatus('Success! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 500);
    } catch (err: any) {
      if (err.code === 4001) {
        setError('You rejected the signature request');
      } else {
        setError(err.message || 'Authentication failed');
      }
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Polymarket Trading Bot
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to authenticate
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {!hasMetaMask && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-semibold mb-1">Wallet not detected</p>
                  <p>
                    Please install{' '}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      MetaMask
                    </a>{' '}
                    or another Web3 wallet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {status && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-sm text-blue-600 dark:text-blue-400">{status}</p>
              </div>
            </div>
          )}

          {/* Desktop: Show Browser Wallet First */}
          {!isMobile && hasMetaMask && (
            <>
              <button
                onClick={handleMetaMaskConnect}
                disabled={loading}
                className={`w-full py-4 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center mb-3 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:scale-95 shadow-lg'
                }`}
              >
                {loading && loginMethod === 'metamask' ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    {walletName} (Recommended)
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>
            </>
          )}

          {/* WalletConnect Button */}
          <button
            onClick={handleWalletConnectButton}
            disabled={loading}
            className={`w-full py-4 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : isMobile
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 shadow-lg'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading && loginMethod === 'walletconnect' ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.03 4.95c3.49-3.49 9.15-3.49 12.64 0l.42.42a.43.43 0 0 1 0 .61l-1.44 1.44a.22.22 0 0 1-.31 0l-.58-.58a6.39 6.39 0 0 0-9.03 0l-.62.62a.22.22 0 0 1-.31 0L6.36 6.02a.43.43 0 0 1 0-.61l.67-.46zm15.61 2.99l1.28 1.28c.17.17.17.44 0 .61l-5.77 5.77a.44.44 0 0 1-.62 0l-4.1-4.1a.11.11 0 0 0-.15 0l-4.1 4.1a.44.44 0 0 1-.62 0L2.79 9.83a.43.43 0 0 1 0-.61l1.28-1.28a.44.44 0 0 1 .62 0l4.1 4.1a.11.11 0 0 0 .15 0l4.1-4.1a.44.44 0 0 1 .62 0l4.1 4.1a.11.11 0 0 0 .15 0l4.1-4.1a.44.44 0 0 1 .63 0z" />
                </svg>
                {isMobile ? 'WalletConnect (Recommended)' : 'WalletConnect'}
              </>
            )}
          </button>

          {/* Desktop: Show browser wallet option if available but not shown */}
          {!isMobile && !hasMetaMask && (
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or install a wallet</span>
                </div>
              </div>

              <a
                href="https://rabby.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg font-medium text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Install Rabby Wallet
              </a>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>{isMobile ? 'Use WalletConnect to connect your mobile wallet' : 'Use your browser wallet extension (faster)'}</li>
                  <li>Sign a message to prove ownership</li>
                  <li>Access granted if you're the authorized wallet</li>
                </ol>
                {isMobile ? (
                  <p className="mt-2 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    📱 Compatible with MetaMask, Rainbow, Trust Wallet & more
                  </p>
                ) : (
                  <p className="mt-2 text-orange-600 dark:text-orange-400 font-semibold text-xs">
                    💻 Browser wallet opens automatically - no QR codes needed
                  </p>
                )}
                <p className="mt-1 text-green-600 dark:text-green-400 font-semibold">
                  No gas fees • No blockchain transactions • Fully secure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Protected by cryptographic signature verification
          </p>
        </div>
      </div>
    </div>
  );
}
