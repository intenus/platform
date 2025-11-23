import { CustomUIMessage } from "@/types/ai";
import { HStack, Span, StackProps, Text } from "@chakra-ui/react";
import { motion, HTMLMotionProps } from "framer-motion";

const MotionHStack = motion.create(HStack);

interface MessageUserProps {
  message: CustomUIMessage;
}

export function MessageUser({ message }: MessageUserProps) {
  return (
    <MotionHStack
      w={["full", "full", "3/5"]}
      justify="right"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 20,
        mass: 0.7,
      }}
    >
      <HStack
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
    </MotionHStack>
  );
}
