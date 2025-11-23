import { VStack } from "@chakra-ui/react";
import { ChatBot } from "./_components/ChatBot";

export default function ChatPage() {
  return (
    <VStack w="full" h={"full"} gap={"4"} position={"relative"}
      bgImage={"radial-gradient(137.62% 100% at 50% 0%, #000000 50%, #110E96 79.65%, #3B30F8 93.48%, #6158FE 100%)"}
     >
      <ChatBot />
    </VStack>
  );
}
