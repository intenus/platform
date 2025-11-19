"use client";

import { Favicon } from "@/components/global/brands";
import { CustomUIMessage } from "@/types/ai";
import { Box, BoxProps, HStack, Text, Badge, VStack } from "@chakra-ui/react";
import type { ChatStatus, TextUIPart } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface MessageBotProps extends BoxProps {
  message: CustomUIMessage;
  status: ChatStatus;
}

export function MessageBot({ message, status, ...props }: MessageBotProps) {
  const isStreaming = status === "streaming" && message.role === "assistant";
  const hasToolCalls = message.parts.some((part) =>
    typeof part.type === "string" && part.type.startsWith("tool-")
  );

  const botStatus = useMemo(() => {
    if (isStreaming) {
      if (hasToolCalls) return "thinking";
      return "cooking";
    }
    return "perfect";
  }, [isStreaming, hasToolCalls]);

  return (
    <Box w={{ base: "full", md: "3/5" }} {...props}>
      <VStack gap={"2"} align={"start"}>
        <HStack gap={"2"} align={"start"} justifyContent={"start"}>
          <Favicon colored={false} size="md" />
          <VStack gap={"1"} align={"start"} flex={1}>
            {message.parts.map((part, index) => (
              <div key={index}>
                {part.type === "text" && (
                  <TextPart
                    key={index}
                    part={part as TextUIPart}
                    isStreaming={isStreaming}
                  />
                )}
              </div>
            ))}
          </VStack>
        </HStack>
        <AnimatePresence>
          {botStatus && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <StatusTag status={botStatus} />
            </motion.div>
          )}
        </AnimatePresence>
      </VStack>
    </Box>
  );
}

function TextPart({
  part,
  isStreaming,
}: {
  part: TextUIPart;
  isStreaming: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: isStreaming ? [0.4, 1, 0.4] : 1,
      }}
      transition={{
        opacity: {
          duration: 1.5,
          repeat: isStreaming ? Infinity : 0,
          ease: "easeInOut",
        },
      }}
    >
      <Text
        w={"full"}
        color={isStreaming ? "fg.muted" : "fg"}
        transition="color 0.3s ease"
      >
        {part.text}
      </Text>
    </motion.div>
  );
}

function StatusTag({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; colorPalette: string }
  > = {
    cooking: { label: "Cooking", colorPalette: "orange" },
    handling: { label: "Handling", colorPalette: "blue" },
    perfect: { label: "Perfect", colorPalette: "green" },
    thinking: { label: "Thinking", colorPalette: "purple" },
  };

  const config = statusConfig[status] || statusConfig.perfect;

  return (
    <Badge
      size="xs"
      colorPalette={config.colorPalette}
      variant="subtle"
      px={2}
      py={0.5}
      borderRadius="md"
    >
      {config.label}
    </Badge>
  );
}
