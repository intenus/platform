import {  VStack } from "@chakra-ui/react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Assistant",
  description:
    "Agent Assistant for Intenus Protocol",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <VStack w={"full"} h={"full"} position={"relative"} p={"4"} overflow={"hidden"}>
      {children}
    </VStack>
  );
}
