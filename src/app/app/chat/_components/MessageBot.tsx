"use client";

import { useMemo } from "react";
import { Box, BoxProps, HStack, Text, VStack, chakra } from "@chakra-ui/react";
import type { ChatStatus, TextUIPart } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ReactTyped } from "react-typed";

import { motion, AnimatePresence } from "framer-motion";
import { CustomUIMessage } from "@/types/ai";
import { Favicon } from "@/components/global/brands";
import { ConnectButton } from "@/components/ConnectButton";

const ChakraReactTyped = chakra(ReactTyped);

interface MessageBotProps extends BoxProps {
  message: CustomUIMessage;
  status: ChatStatus;
}

export function MessageBot({ message, status, ...props }: MessageBotProps) {
  const isStreaming = status === "streaming" && message.role === "assistant";
  const hasToolCalls = message.parts.some(
    (part) => typeof part.type === "string" && part.type.startsWith("tool-")
  );

  const botStatus = useMemo(() => {
    if (isStreaming) {
      if (hasToolCalls) return "cooking";
      return "thinking";
    }
    return null;
  }, [isStreaming, hasToolCalls]);

  return (
    <Box w={["full", "full", "3/5"]} {...props}>
      <VStack gap={"2"} align={"start"}>
        <HStack gap={"2"} align={"start"} justifyContent={"start"}>
          <Favicon colored={false} size="md" />
          <VStack gap={"2"} align={"start"} flex={1}>
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "text":
                  return (
                    <TextPart
                      key={index}
                      part={part as TextUIPart}
                      isStreaming={
                        isStreaming && index === message.parts.length - 1
                      }
                    />
                  );
                case "tool-checkWalletConnectionTool":
                  if (!part.output?.connected) {
                    return <ConnectButton key={index} />;
                  }

                  return null;
                default:
                  return null;
              }
            })}
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {part.text}
      </Markdown>
    </motion.div>
  );
}

function StatusTag({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string }> = {
    cooking: { label: "Generating" },
    handling: { label: "Processing" },
    perfect: { label: "Complete" },
    thinking: { label: "Working" },
  };

  const config = statusConfig[status] || statusConfig.perfect;

  if (status === "perfect") {
    return null;
  }

  return (
    <ChakraReactTyped
      strings={[config.label + "..."]}
      typeSpeed={80}
      backSpeed={100}
      loop
      fontSize={"sm"}
      color={"primary.solid"}
    />
  );
}
