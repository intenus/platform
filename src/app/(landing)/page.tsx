import { Center, Heading, Image, Text, VStack } from "@chakra-ui/react";
import { ChatbotDemo } from "./_components/ChatbotDemo";

export default function Home() {
  return (
    <Center
      px={["4", "8", "16", "64"]}
      as="main"
      flexDirection="column"
      gap="4"
      w={"full"}
      flex={1}
    >
      <VStack>
        <Heading as={"h1"} size={["4xl", "5xl", "6xl"]} textAlign={"center"}>
          Intent-Based Protocol
        </Heading>
        <Text textAlign={"center"} maxW={"68ch"} color={"fg.subtle"}>
          Universal intent-based infrastructure where AI Agents transform your
          natural language into optimal on-chain execution
        </Text>
      </VStack>
      <ChatbotDemo />
    </Center>
  );
}
