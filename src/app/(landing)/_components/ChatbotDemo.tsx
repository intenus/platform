"use client";

import {
  VStack,
  Box,
  HStack,
  StackProps,
  Button,
  chakra,
  Center,
  Text,
} from "@chakra-ui/react";
import { ReactTyped } from "react-typed";
import { motion } from "framer-motion";
import { useRouter} from "next/navigation";

type ChatDemoProps = StackProps;
const ChakraReactTyped = chakra(ReactTyped);

interface Message {
  role: "user" | "assistant";
  text: string;
  id: number;
}

export function ChatbotDemo({}: ChatDemoProps) {
  const textFlows: Message[] = [
    { role: "user", text: "Hi there, how's Sui market doing today?", id: 1 },
    {
      role: "assistant",
      text: "The Sui market is performing well today with positive momentum!",
      id: 2,
    },
    { role: "user", text: "I want to swap 100 SUI to WAL", id: 3 },
    {
      role: "assistant",
      text: "Waiting..., network is thinking the strategy",
      id: 4,
    },
    {
      role: "assistant",
      text: "The best protocol to swap 100 SUI to WAL is Cetus with fee 0.3%",
      id: 5,
    },
    {
      role: "assistant",
      text: "Surplus First strategy is used to rank all solutions",
      id: 6,
    },
    {
      role: "user",
      text: "Some advice me some protocols to swap with the lowest fee",
      id: 7,
    },
  ];

  // Tạo strings array cho ReactTyped
  const typedStrings = textFlows.map(
    (msg) =>
      `<span class="message-${msg.role}">${
        msg.role === "user" ? "You" : "Intenus AI"
      }: ${msg.text}</span>`
  );

  const router = useRouter();

  return (
    <VStack
      w={["full", "full", "3/4"]}
      p={"2"}
      rounded={["3xl", "4xl"]}
      bg={"bg.subtle/25"}
      shadow={"xs"}
      backdropFilter={"blur(64px)"}
      align={"center"}
      justify={"center"}
      gap={4}
    >
      {/* Input Area */}
      <Box p={"2"} w={"full"} rounded={["2xl", "3xl"]} bg={"bg/50"}>
        <Box p={"2"} w={"full"} h={"16"}>
          <ChakraReactTyped
            fontSize={["xs", "sm", "md"]}
            strings={typedStrings}
            typeSpeed={20}
            backSpeed={10}
            backDelay={500}
            startDelay={200}
            loop={true}
            loopCount={Infinity}
            showCursor={true}
            cursorChar="|"
            smartBackspace={true}
          />
        </Box>
        <HStack w={"full"} p={"2"} justify={"space-between"}>
          <Center
            w={"fit"}
            border={"1px solid"}
            rounded={"full"}
            borderColor={"yellow.solid"}
            color={"yellow.solid"}
            py={"1"}
            px={"2"}
          >
            <Text fontSize={"sm"}>Pro Mode</Text>
          </Center>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              colorPalette="primary"
              transition={"all ease-in-out 0.25s"}
              onClick={() => {
                router.push("/chat");
              }}
            >
              Explore now
            </Button>
          </motion.div>
        </HStack>
      </Box>
    </VStack>
  );
}
