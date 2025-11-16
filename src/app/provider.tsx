import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { Provider as ChakraProvider } from "@/components/ui/provider";

import { NETWORK } from "@/utils/constants";
import { getFullnodeUrl } from "@mysten/sui/client";

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

export function Provider({ children }: { children: React.ReactNode }) {
  const defaultNetwork = NETWORK as "localnet" | "mainnet";

  return (
    <ChakraProvider>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={defaultNetwork}
      >
        <WalletProvider>{children}</WalletProvider>
      </SuiClientProvider>
    </ChakraProvider>
  );
}
