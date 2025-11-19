"use client";
import { IntenusWalrusClient } from "@intenus/walrus";
import { NETWORK } from "@/utils/constants";
type Props = object;

export const useIntenusWalrusClient = (props?: Props) => {
  const walrusClient = new IntenusWalrusClient({
    network: NETWORK as "mainnet" | "testnet",
  });

  return {
    walrusClient,
  };
};
