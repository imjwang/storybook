"use client";
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from "@privy-io/react-auth";
import { Button } from '@/components/ui/button';
// import { useIpAsset } from '@story-protocol/react-sdk';
// import { useStory } from '@/app/providers/web3';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { useWalletClient } from "wagmi";
import { Address, createPublicClient, createWalletClient, http, custom } from "viem";
import { iliad } from "@story-protocol/core-sdk";
import { defaultNftContractAbi } from "@/lib/defaultNftContractAbi";




export default function Home() {
  const { data: wallet } = useWalletClient();
  const mintNFT = async (to: Address, uri: string) => {
    console.log(wallet)
    if (!window.ethereum) return "";
    console.log("Minting a new NFT...");
    const walletClient = createWalletClient({
      account: wallet?.account.address as Address,
      chain: iliad,
      transport: custom(window.ethereum),
    });
    const publicClient = createPublicClient({
      transport: custom(window.ethereum),
      chain: iliad,
    });
    console.log("to", to)
    console.log("uri", uri)
    const { request } = await publicClient.simulateContract({
      address: "0xd2a4a4Cb40357773b658BECc66A6c165FD9Fc485" as Address,
      functionName: "mintNFT",
      args: [to, uri],
      abi: defaultNftContractAbi,
    });
    const hash = await walletClient.writeContract(request);
    console.log(`Minted NFT successful with hash: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const tokenId = Number(receipt.logs[0].topics[3]).toString();
    console.log(`Minted NFT tokenId: ${tokenId}`);
    // addTransaction(hash, "Mint NFT", { tokenId });
    return tokenId;
  };

  // const { txLoading, txHash, txName } = useStory();


  // const { wallets } = useWallets();
  // const { register } = useIpAsset();
  // const wallet = wallets[0];
  // console.log(wallets);
  // const { login, logout, user } = usePrivy();
  // const { mintNFT } = useStory();


  // async function registerIp() {
  //   // const res = await fetch('/api/mint')
  //   console.log(wallets[0].address);
  //   const tokenId = await mintNFT(wallets[0].address as Address, "https://ipfs.io/ipfs/QmPuVyYjT1ZEPf4ACka3og3XtYmSpnHJAWS8DsmHx2PUqG");

  // const ipfsUri = "https://ipfs.io/ipfs/QmPuVyYjT1ZEPf4ACka3og3XtYmSpnHJAWS8DsmHx2PUqG";
  // const response = await register({
  //   // @ts-expect-error some type error
  //   nftContract: wallets[0].address, // your NFT contract address
  //   tokenId, // your NFT token ID
  //   ipMetadata: {
  //     ipMetadataURI: ipfsUri,
  //     ipMetadataHash: `0xsomehash`,
  //     nftMetadataHash: `0xsomehash`,
  //     nftMetadataURI: ipfsUri,
  //   },
  //   txOptions: {
  //     waitForTransaction: true
  //   }
  // });
  //   console.log(tokenId);
  // }
  const ipIpfsHash = "QmRANDOMHASH123456789abcdefghijklmnopqrstuvwxyz"

  const uri = `https://ipfs.io/ipfs/${ipIpfsHash}`

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* <header className="w-full p-4 flex justify-end">
        {user ? (
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={logout}
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={login}
          >
            Login
          </button>
        )}
      </header> */}

      <main className="text-center">
        <ConnectButton />
        <Button onClick={() => mintNFT(wallet?.account.address as Address, uri)}>Test Mint Token</Button>
        {/* <Button onClick={registerIp}>Test Register IP</Button> */}
        <h1 className="text-6xl font-bold text-gray-800 mb-8">storybook.</h1>
        {/* {user && (
          <p className="mb-8 text-gray-600">
            Welcome, {user.email?.toString() || user.wallet?.address || 'User'}!
          </p>
        )} */}
        <div className="mt-12">
          <button className="group">
            <div className="w-40 h-40 bg-white hover:bg-gray-100 flex items-center justify-center rounded-2xl shadow-lg transition duration-300 ease-in-out group-hover:shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500 group-hover:text-blue-600 transition duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-4 text-lg text-gray-700 font-semibold group-hover:text-gray-900 transition duration-300 ease-in-out">create new book</p>
          </button>
        </div>
      </main>
    </div>
  );
}
