import {
  VStack,
} from "@chakra-ui/react";
import { ChatBot } from "./_components/ChatBot";
export default function ChatPage() {
  return (
    <VStack w="full" h={"full"} maxW={["full", "xl", "2xl", "4xl"]} p={4}>
      <ChatBot />
    </VStack>
  );
}
