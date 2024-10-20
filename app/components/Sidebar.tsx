import React, { useEffect, useState, useCallback } from 'react';
import useStory from "../hooks/useStory";
import { useWalletClient } from "wagmi";
import { Address } from "viem";
import { Button } from "@/components/ui/button";

interface Block {
  id: string;
  x: number;
  y: number;
  responses: Response[];
}

interface Response {
  role: 'user' | 'assistant';
  content: string;
  isTable?: boolean;
}

interface SidebarProps {
  blocks: Block[];
  shouldUpdateInsight: boolean;
}

type UserData = {
  author: Address;
  text: string;
  wallet: bigint;
  licenseTermsId: bigint;
  price: number;
  ipId: `0x${string}`;
}
const mockData: UserData[] = [
  {
    author: '0x1234567890123456789012345678901234567890',
    text: 'A study on the history of the Pacific Northwest.',
    wallet: BigInt('1000000000000000000'),
    licenseTermsId: BigInt('5'),
    price: 1.01,
    ipId: "0x69A6D217764D4C2F1F10c347202521337c5619A4"
  },
  {
    author: '0x2345678901234567890123456789012345678901',
    text: 'Blog post explaining the health benefits of hiking.',
    wallet: BigInt('2000000000000000000'),
    price: 0.00003,
    licenseTermsId: BigInt('2'),
    ipId: '0x123456789abcdef0123456789abcdef012345678'
  },
  {
    author: '0x3456789012345678901234567890123456789012',
    text: 'Doodles of poodles.',
    wallet: BigInt('3000000000000000000'),
    price: 0.02,
    licenseTermsId: BigInt('3'),
    ipId: '0x23456789abcdef0123456789abcdef0123456789'
  },
  {
    author: '0x4567890123456789012345678901234567890123',
    text: 'Painting of a cat.',
    wallet: BigInt('4000000000000000000'),
    price: 0.01,
    licenseTermsId: BigInt('4'),
    ipId: '0x3456789abcdef0123456789abcdef01234567890'
  }
]

export default function Sidebar({ blocks, shouldUpdateInsight }: SidebarProps) {
  const { mintAndRegisterNFT, registerLicense, collectRoyalty, mintLicense } = useStory();
  const { data: wallet, isLoading } = useWalletClient();

  const [supportingEvidence, setSupportingEvidence] = useState<string>('');
  const [tangentRec, setTangentRec] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState<boolean>(false);

  const [insight, setInsight] = useState<string>('');
  const uri = "https://google.com"

  const handleInsights = async () => {
    setIsInsightLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks }),
      })
      const { evidenceExtraction, tangentRec } = await res.json()
      setSupportingEvidence(evidenceExtraction)
      setTangentRec(tangentRec)
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsInsightLoading(false);
    }
  }
  const handlePublish = async () => {
    const ipId = await mintAndRegisterNFT(wallet?.account.address as Address, uri) // uri should come from the browser index
    console.log("ipId", ipId)
    const res = await registerLicense(ipId as `0x${string}`)
    console.log(res)
    return res?.licenseTermsId // use to create a json
  }

  // Create a memoized function to get all responses
  const getAllResponses = useCallback(() => {
    return blocks.flatMap(block => block.responses.map(r => r.content)).join(' ');
  }, [blocks]);

  useEffect(() => {
    if (!shouldUpdateInsight) return;

    handleInsights()
  }, [getAllResponses, shouldUpdateInsight]);

  return (
    <div className="flex flex-col gap-2 fixed right-4 top-4 w-80 bg-[#fbfaee] rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[calc(100vh-2rem)] backdrop-filter backdrop-blur-lg border border-[#53118f] border-opacity-20">
      <h2 className="text-3xl font-extrabold text-[#53118f] tracking-tight">book buddy</h2>
      <Button
        onClick={handlePublish}
        className="bg-[#6e2daa] hover:bg-[#933dc9] text-[#fbfaee] font-medium py-4 px-8 rounded-full transition duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 active:shadow-md"
      >
        Publish
      </Button>
      <div className="bg-purple-100 bg-opacity-50 rounded-lg p-4 my-2">
        <h3 className="text-xl font-bold text-[#53118f] tracking-tight mb-2">supporting evidence</h3>
        {isInsightLoading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#53118f]"></div>
          </div>
        ) : (
          <p className="text-[#53118f]">
            {supportingEvidence}
          </p>
        )}
      </div>
      <div className="bg-purple-100 bg-opacity-50 rounded-lg p-4">
        <h3 className="text-xl font-bold text-[#53118f] tracking-tight mb-2">related</h3>
        {isInsightLoading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#53118f]"></div>
          </div>
        ) : (
          <p className="text-[#53118f]">
            {tangentRec}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 justify-center">
        {mockData.map((m) => {
          return (
            <div className="flex items-center justify-between" key={m.ipId}>
              <p className="text-[#53118f]">{m.text.substring(0, 20)}...</p>
              <div className="flex flex-col items-end gap-2">
                <p className='text-purple-300 text-sm bg-black rounded-full px-2 font-bold pointer-events-none select-none'>{`Ξ${m.price}`}</p>
                <Button
                  onClick={() => mintLicense(m.ipId, m.licenseTermsId)}
                  className="bg-[#6e2daa] hover:bg-[#933dc9] w-16 text-[#fbfaee] font-medium transition duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                >
                  Connect
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}