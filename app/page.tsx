"use client";

import { Button } from '@/components/ui/button';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletClient } from "wagmi";
import { Address } from "viem";
import useStory from "./hooks/useStory";


export default function Home() {
  const { mintAndRegisterNFT, registerLicense, mintLicense, ipId, termsId } = useStory();
  const { data: wallet } = useWalletClient();

  const ipIpfsHash = "QmRANDOMHASH123456789abcdefghijklmnopqrstuvwxyz"
  const uri = `https://ipfs.io/ipfs/${ipIpfsHash}`

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="text-center">
        <ConnectButton />
        <Button onClick={() => mintAndRegisterNFT(wallet?.account.address as Address, uri)}>Test Mint Token</Button>
        <Button onClick={() => registerLicense(ipId as `0x${string}`)}>Register PIL</Button>
        <Button onClick={() => mintLicense(ipId as `0x${string}`, termsId as bigint)}>Mint License</Button>
        <h1 className="text-6xl font-bold text-gray-800 mb-8">storybook.</h1>
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
