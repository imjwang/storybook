"use client";

import { PinataSDK } from 'pinata'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletClient } from "wagmi";
import { Address } from "viem";
import useStory from "./hooks/useStory";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "beige-fashionable-kangaroo-471.mypinata.cloud"
})

interface Book {
  id: string;
  name: string;
  cid: string;
}

export default function Home() {
  const { mintAndRegisterNFT, registerLicense, mintLicense } = useStory();
  const { data: wallet, isLoading } = useWalletClient();
  const router = useRouter();

  const handlePublish = async () => {
    const ipId = await mintAndRegisterNFT(wallet?.account.address as Address, uri) // uri should come from the browser index
    const res = await registerLicense(ipId as `0x${string}`)
    return res?.licenseTermsId // use to create a json
  }

  const uri = "1" // this needs to be id of note
  // const ipIpfsHash = "QmRANDOMHASH123456789abcdefghijklmnopqrstuvwxyz"
  // const uri = `https://ipfs.io/ipfs/${ipIpfsHash}`

  return (
    <div className="min-h-screen bg-[#fbfaee]">
      <main className="container mx-auto px-4 py-16">
        <div className="flex justify-end mb-12">
          <ConnectButton />
        </div>
        <h1 className="text-6xl font-bold text-[#53118f] mb-16 text-center tracking-tight">
          storybook.
        </h1>
        {wallet && (
          <div className="max-w-3xl mx-auto bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-8 shadow-2xl">
            <p className="text-lg text-[#53118f] mb-12 text-center">
              Welcome, {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
            </p>
            <div className="grid grid-cols-2 gap-6 mb-12">
            </div>
            {isLoading ? (
              <p className="text-center text-[#53118f]">Loading books...</p>
            ) : (
              <div className="flex justify-center">
                <button className="group focus:outline-none" onClick={() => router.push('/create')}>
                  <div className="w-56 h-56 bg-[#53118f] bg-opacity-10 flex items-center justify-center rounded-lg transition duration-300 ease-in-out group-hover:bg-opacity-20 shadow-lg hover:shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[#53118f] group-hover:text-[#933dc9] transition duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="mt-6 text-xl text-[#53118f] font-light group-hover:text-[#933dc9] transition duration-300 ease-in-out">Create New Book</p>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
