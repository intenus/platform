/* eslint-disable jsx-a11y/alt-text */
import { Center, Heading, Image, Text, VStack } from "@chakra-ui/react";
import NextImage from "next/image";

export default function Home() {
  return (
    <Center px={"64"} as="main" flexDirection="column" gap="4" w={"full"} flex={1}>
      <VStack>
        <Heading as={"h1"} size={"6xl"}>
          Intent-Based Protocol
        </Heading>
        <Text>
          Optimized for African micro-finance and ultra-low-fee transactions on
          Hedera
        </Text>
      </VStack>
      <Center>
        <Image w={"full"} asChild>
          <NextImage
            src={"/assets/poster-demo-chatbot.png"}
            alt="poster demo chatbot"
            width={512}
            height={290}
          />
        </Image>
      </Center>
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
