"use client";
import { IntenusSealClient } from "@intenus/seal";
import { NETWORK } from "@/utils/constants";
type Props = object;

export const useIntenusSealClient = (props?: Props) => {
  const sealClient = new IntenusSealClient({
    network: NETWORK as "mainnet" | "testnet",
  });

  return {
    sealClient,
  };
};
