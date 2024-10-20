import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  sepolia,
} from 'wagmi/chains';
import { iliad } from '@story-protocol/core-sdk';

export const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: "c85f7be6c368a695a0029019c4acb697" as string,
  chains: [
    iliad,
  ],
  ssr: true,
});
