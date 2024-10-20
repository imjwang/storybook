"use client";

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { useWalletClient } from "wagmi";
import { Address, createPublicClient, createWalletClient, toHex, custom } from "viem";
import { iliad } from "@story-protocol/core-sdk";
import { defaultNftContractAbi } from "@/lib/defaultNftContractAbi";
import { useState, useEffect } from "react";

export default function useStory() {
  const { data: wallet } = useWalletClient();
  const [client, setClient] = useState<StoryClient | undefined>(undefined)


  useEffect(() => {
    if (wallet?.account) {
      const config: StoryConfig = {
        account: wallet!.account,
        transport: custom(wallet!.transport),
        chainId: "iliad",
      };
      const sclient = StoryClient.newClient(config);
      setClient(sclient);
    }
  }, [wallet])


  const mintAndRegisterNFT = async (to: Address, uri: string) => {
    if (!client) return;
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
    const response = await client.ipAsset.register({
      nftContract: "0xd2a4a4Cb40357773b658BECc66A6c165FD9Fc485", // your NFT contract address
      tokenId, // your NFT token ID
      ipMetadata: {
        ipMetadataURI: uri,
        ipMetadataHash: toHex('test-metadata-hash', { size: 32 }),
        nftMetadataHash: toHex('test-nft-metadata-hash', { size: 32 }),
        nftMetadataURI: uri,
      },
      txOptions: { waitForTransaction: true }
    });
    console.log(`Root IPA created at tx hash ${response.txHash}, IPA ID: ${response.ipId}`);
    return response.ipId
  };

  const registerLicense = async (ipId: `0x${string}`) => {
    if (!client) return;
    if (!ipId) return;
    const { licenseTermsId } = await client.license.registerCommercialUsePIL({
      currency: '0x91f6F05B08c16769d3c85867548615d270C42fC7', // see the above note on whitelisted revenue tokens
      defaultMintingFee: '1', // 10 of the currency (using the above currency, 10 MERC20)    
      txOptions: { waitForTransaction: true }
    })
    console.log("licenseTermsId", licenseTermsId)
    if (!licenseTermsId) return;

    const response2 = await client.license.attachLicenseTerms({
      licenseTermsId,
      ipId,
      txOptions: { waitForTransaction: true }
    });

    if (response2.success) {
      console.log(`Attached License Terms to IPA at transaction hash ${response2.txHash}.`)
      console.log(response2)
    } else {
      console.log(`License Terms already attached to this IPA.`)
    }
    return { licenseTermsId, ipId }
  }

  const mintLicense = async (ipId: `0x${string}`, termsId: bigint) => {
    if (!client) return;
    if (!termsId) return;

    const response = await client.license.mintLicenseTokens({
      licenseTermsId: termsId,
      licensorIpId: ipId,
      receiver: wallet?.account.address as Address,
      amount: 1,
      txOptions: { waitForTransaction: true }
    });
    console.log(response)
  }

  const collectRoyalty = async (parentIpId: `0x${string}`, royaltyVaultIpId: `0x${string}`) => {
    if (!client) return;
    const response = await client.royalty.collectRoyaltyTokens({
      parentIpId,
      royaltyVaultIpId,
      txOptions: { waitForTransaction: true }
    });

    console.log(`Collected royalty token ${response.royaltyTokensCollected} at transaction hash ${response.txHash}`)
  }

  return {
    mintAndRegisterNFT,
    registerLicense,
    mintLicense,
    collectRoyalty
  }

}