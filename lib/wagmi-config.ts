import { cookieStorage, createStorage, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { createConfig } from 'wagmi';

// Get Project ID from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Wallet Connect will not work.');
}

// Metadata for your app
const metadata = {
  name: 'Polymarket Trading Bot',
  description: 'Secure trading bot dashboard',
  url: 'https://bot-polymarket-kappa.vercel.app',
  icons: ['https://bot-polymarket-kappa.vercel.app/icon-192x192.png'],
};

// Wagmi config
export const config = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
