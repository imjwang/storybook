import { http, createWalletClient, createPublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount, Address, Account } from 'viem/accounts';
import { NextRequest, NextResponse } from 'next/server';


const mintContractAbi = {
  inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
  name: 'mint',
  outputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
  stateMutability: 'nonpayable',
  type: 'function',
}

const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
const account: Account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http('https://rpc.ankr.com/eth_sepolia')
})
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://rpc.ankr.com/eth_sepolia')
})

async function mintNFT(address: Address, accountAddress: string): Promise<string> {
  const { request } = await publicClient.simulateContract({
    address: address,
    functionName: 'mint',
    args: [accountAddress],
    abi: [mintContractAbi]
  })
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const tokenId = Number(receipt.logs[0].topics[3]).toString();
  return tokenId;
}

// async function registerIPAsset(address: Address, accountAddress: any) {
//   const tokenId = await mintNFT(address, accountAddress);
//   const registeredIpAssetResponse = await client.ipAsset.register({
//     tokenContract: address as Address,
//     tokenId,
//     txOptions: { waitForTransaction: true },
//   })
//   return registeredIpAssetResponse;
// }





export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const tokenId = await mintNFT(address, account.address);
    // const registeredIpAssetResponse =  await registerIPAsset(address, account.address);
    
    // console.log(registeredIpAssetResponse);


    return NextResponse.json({
      success: true,
      tokenId
    });

  } catch (error) {
    console.error('Error in POST /api/mint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
