import { CustomUIMessage } from "@/types/ai";
import { HStack, Span, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";

interface MessageUserProps {
  message: CustomUIMessage;
}

export function MessageUser({ message }: MessageUserProps) {
  return (
    <motion.div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 20,
        mass: 0.7,
      }}
    >
      <HStack
        w={["full", "full", "3/5"]}
        justify="right"
        p="3"
        rounded="xl"
        bg="bg.subtle/50"
        backdropFilter="blur(64px)"
      >
        <Text w="full" color="fg" textAlign="right">
          {message.parts.map((part, index) => (
            <Span key={index} w="full">
              {part.type === "text" && part.text}
            </Span>
          ))}
        </Text>
      </HStack>
    </motion.div>
  );
}
