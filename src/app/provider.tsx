"use client";

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { Provider as ChakraProvider } from "@/components/ui/provider";

import { NETWORK } from "@/utils/constants";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

export function Provider({ children }: { children: React.ReactNode }) {
  const defaultNetwork = NETWORK as "testnet" | "mainnet";

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider
          networks={networkConfig}
          defaultNetwork={defaultNetwork}
        >
          <WalletProvider>{children}</WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
