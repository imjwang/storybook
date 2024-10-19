"use client";
// import { StoryProvider } from "@story-protocol/react-sdk";
import { useWallets } from "@privy-io/react-auth";
import { PropsWithChildren, createContext, useEffect } from "react";
import { useContext, useState } from "react";
import { Address, createPublicClient, createWalletClient, http } from "viem";
import { defaultNftContractAbi } from "@/lib/defaultNftContractAbi";
import { iliad, StoryClient, StoryConfig } from "@story-protocol/core-sdk";


// export const iliad = {
//   id: 1513, // Your custom chain ID
//   name: "Story Network Testnet",
//   nativeCurrency: {
//     name: "Testnet IP",
//     symbol: "IP",
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: { http: ["https://testnet.storyrpc.io"] },
//   },
//   blockExplorers: {
//     default: { name: "Blockscout", url: "https://testnet.storyscan.xyz" },
//   },
//   testnet: true,
// } as const satisfies Chain;

// // setup wagmi
// const config = createConfig({
//   chains: [iliad],
//   multiInjectedProviderDiscovery: false,
//   transports: {
//     [iliad.id]: http(),
//   },
// });
// const queryClient = new QueryClient();

// // add any extra networks here
// const evmNetworks = [
//   {
//     blockExplorerUrls: ["https://testnet.storyscan.xyz"],
//     chainId: 1513,
//     iconUrls: ["https://app.dynamic.xyz/assets/networks/sepolia.svg"],
//     name: "Story Network Testnet",
//     nativeCurrency: {
//       decimals: 18,
//       name: "Testnet IP",
//       symbol: "IP",
//     },
//     networkId: 1513,
//     rpcUrls: ["https://testnet.storyrpc.io"],
//     vanityName: "Iliad",
//   },
// ];

export default function Web3Providers({ children }: PropsWithChildren) {
  return (
    <StoryProvider>
      {children}
    </StoryProvider >
  );
}

// we use this component to pass in our 
// wallet from wagmi
// function StoryProviderWrapper({ children }: PropsWithChildren) {
//   // const { data: wallet } = useWalletClient();
//   const { wallets } = useWallets();

//   const dummyWallet = createWalletClient({
//     chain: iliad,
//     transport: http("https://testnet.storyrpc.io"),
//   }); ``

//   return (
//     <StoryProvider
//       config={{
//         chainId: "iliad",
//         transport: http(process.env.NEXT_PUBLIC_RPC_PROVIDER_URL),
//         // @ts-expect-error some type error
//         wallet: wallets[0] || dummyWallet,
//       }}
//     >
//       {children}
//     </StoryProvider>
//   )
// }



interface AppContextType {
  txLoading: boolean;
  txHash: string;
  txName: string;
  transactions: { txHash: string; action: string; data: any }[];
  client: StoryClient | null;
  setTxLoading: (loading: boolean) => void;
  setTxHash: (txHash: string) => void;
  setTxName: (txName: string) => void;
  mintNFT: (to: Address, uri: string) => Promise<string>;
  addTransaction: (txHash: string, action: string, data: any) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useStory = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useStory must be used within a AppProvider");
  }
  return context;
};

function StoryProvider({ children }: PropsWithChildren) {
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txName, setTxName] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [transactions, setTransactions] = useState<
    { txHash: string; action: string; data: any }[]
  >([]);
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const [client, setClient] = useState<StoryClient | null>(null);

  const setupStoryClient: () => StoryClient = () => {
    const config: StoryConfig = {
      account: wallet!.address as Address,
      transport: http("https://testnet.storyrpc.io"),
      chainId: "iliad",
    };
    const client = StoryClient.newClient(config);
    return client;
  };

  const mintNFT = async (to: Address, uri: string) => {
    if (!window.ethereum) return "";
    console.log("Minting a new NFT...");
    const walletClient = createWalletClient({
      account: wallet?.address as Address,
      chain: iliad,
      transport: http("https://testnet.storyrpc.io"),
    });
    const publicClient = createPublicClient({
      transport: http("https://testnet.storyrpc.io"),
      chain: iliad,
    });

    const { request } = await publicClient.simulateContract({
      address: "0xd2a4a4Cb40357773b658BECc66A6c165FD9Fc485",
      functionName: "mintNFT",
      args: [to, uri],
      abi: defaultNftContractAbi,
    });
    const hash = await walletClient.writeContract(request);
    console.log(`Minted NFT successful with hash: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const tokenId = Number(receipt.logs[0].topics[3]).toString();
    console.log(`Minted NFT tokenId: ${tokenId}`);
    addTransaction(hash, "Mint NFT", { tokenId });
    return tokenId;
  };

  const addTransaction = (txHash: string, action: string, data: any) => {
    setTransactions((oldTxs) => [...oldTxs, { txHash, action, data }]);
  };

  useEffect(() => {
    if (!client && wallet?.address) {
      const newClient = setupStoryClient();
      setClient(newClient);
    }
  }, [wallet, client, setupStoryClient]);

  return (
    <AppContext.Provider
      value={{
        txLoading,
        txHash,
        txName,
        transactions,
        setTxLoading,
        setTxName,
        setTxHash,
        mintNFT,
        addTransaction,
        client,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
