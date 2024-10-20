import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { http } from 'viem'
import { privateKeyToAccount, Address, Account } from 'viem/accounts'
import { IpMetadata } from '@story-protocol/core-sdk'
import { NextResponse } from 'next/server';
import { PIL_TYPE, CreateIpAssetWithPilTermsResponse } from '@story-protocol/core-sdk'


const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`
const account: Account = privateKeyToAccount(privateKey)

const config: StoryConfig = {  
  account: account,  
  transport: http(process.env.RPC_PROVIDER_URL),  
  chainId: 'iliad',  
}  
const client = StoryClient.newClient(config)

const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
  title: 'My IP Asset',
  description: 'This is a test IP asset',
  watermarkImg: 'https://picsum.photos/200',
  attributes: [
    {
      key: 'Rarity',
      value: 'Legendary',
    },
  ],
})


const nftMetadata = {
  name: 'Test NFT',
  description: 'This is a test NFT',
  image: 'https://picsum.photos/200',
}

const ipIpfsHash = "QmRANDOMHASH123456789abcdefghijklmnopqrstuvwxyz"
const ipHash = "0".repeat(64)
const nftIpfsHash = "QmRANDOMHASH987654321zyxwvutsrqponmlkjihgfedcba"
const nftHash = "1".repeat(64)


export async function GET() {
  try {
    const newCollection = await client.nftClient.createNFTCollection({
      name: 'Test NFT',
      symbol: 'TEST',
      txOptions: { waitForTransaction: true },
    })
    const response: CreateIpAssetWithPilTermsResponse = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      nftContract: process.env.NFT_CONTRACT_ADDRESS as Address,
      pilType: PIL_TYPE.NON_COMMERCIAL_REMIX,
      ipMetadata: {
        ipMetadataURI: `google.com`,
        ipMetadataHash: `0x${ipHash}`,
        nftMetadataURI: `google.com`,
        nftMetadataHash: `0x${nftHash}`,
      },
      txOptions: { waitForTransaction: true },
    })
    
    console.log(`Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`)
    console.log(`View on the explorer: https://explorer.story.foundation/ipa/${response.ipId}`)
    
    return NextResponse.json({ success: true, nftContract: newCollection.nftContract });
    
  } catch (error) {
    console.error('Error registering IP asset:', error);
    return NextResponse.json({ success: false, error: 'Failed to register IP asset' }, { status: 500 });
  }
}

