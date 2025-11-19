"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { IntenusProtocolClient } from "@intenus/client-sdk";
import { NETWORK } from "@/utils/constants";

type Props = object;

export const useIntenusClient = (props?: Props) => {
  const suiClient = useSuiClient();

  return new IntenusProtocolClient({
    suiClient: suiClient,
    network: NETWORK as "mainnet" | "testnet",
  });
};
