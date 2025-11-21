/* eslint-disable jsx-a11y/alt-text */
import { Center, ClientOnly, Container, Image } from "@chakra-ui/react";
import NextImage from "next/image";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Center
      w={"full"}
      h={"full"}
      position={"relative"}
      overflow={"hidden"}
    >
      {children}
      <Image
        asChild
        pointerEvents={"none"}
        zIndex={"-1"}
        position={"fixed"}
        translate={"0 15vh"}
      >
        <NextImage src={"/assets/secondary-glow.png"} alt="secondary glow" fill />
      </Image>
    </Center>
  );
}
