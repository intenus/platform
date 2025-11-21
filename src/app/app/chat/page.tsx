import { VStack } from "@chakra-ui/react";
import { ChatBot } from "./_components/ChatBot";
import { Copyright } from "./_components/Copyright";
export default function ChatPage() {
  return (
    <VStack w="full" h={"full"} gap={"4"} position={"relative"}>
      <ChatBot />
    </VStack>
  );
}
