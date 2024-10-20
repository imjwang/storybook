'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { StoryProvider } from "@story-protocol/react-sdk";
import { useWalletClient } from 'wagmi';
import { http } from 'viem';
import { createWalletClient, type Chain } from "viem";
import { PropsWithChildren } from 'react';

import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// function StoryProviderWrapper({ children }: PropsWithChildren) {
//   const { data: wallet } = useWalletClient();

//   const dummyWallet = createWalletClient({
//     chain: iliad,
//     transport: http("https://testnet.storyrpc.io"),
//   });

//   return (
//     <StoryProvider
//       config={{
//         chainId: "iliad",
//         transport: http(process.env.NEXT_PUBLIC_RPC_PROVIDER_URL),
//         wallet: wallet || dummyWallet,
//       }}
//     >
//       {children}
//     </StoryProvider>
//   )
// }