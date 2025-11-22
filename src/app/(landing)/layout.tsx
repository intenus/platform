/* eslint-disable jsx-a11y/alt-text */
import { Header } from "@/components/global/bars";
import { Center } from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";
import NextImage from "next/image";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Center flexDirection="column" minHeight="100vh" padding="4">
      <Header />
      {children}
      <Image
        asChild
        pointerEvents={"none"}
        zIndex={"-1"}
        position={"absolute"}
        translate={"0 128px"}
      >
        <NextImage src={"/assets/primary-glow.png"} alt="primary glow" fill />
      </Image>
    </Center>
  );
}
