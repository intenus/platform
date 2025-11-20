"use client";

import { Favicon } from "@/components/global/brands";
import { CustomUIMessage } from "@/types/ai";
import { Box, BoxProps, HStack, Text, Badge, VStack, Card, Separator } from "@chakra-ui/react";
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
          <VStack gap={"2"} align={"start"} flex={1}>
            {message.parts.map((part, index) => {
              const partType = typeof part.type === "string" ? part.type : "";

              if (part.type === "text") {
                return (
                  <TextPart
                    key={index}
                    part={part as TextUIPart}
                    isStreaming={isStreaming}
                  />
                );
              }

              if (partType.startsWith("tool-") && !partType.includes("result")) {
                return <ToolCallPart key={index} part={part} />;
              }

              if (partType.includes("result")) {
                return <ToolResultPart key={index} part={part} />;
              }

              return null;
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

function ToolCallPart({ part }: { part: any }) {
  const getToolIcon = (toolName: string) => {
    if (toolName.includes("Price")) return "💰";
    if (toolName.includes("Balance")) return "👤";
    if (toolName.includes("Swap") || toolName.includes("Intent")) return "🔄";
    if (toolName.includes("submit")) return "🚀";
    if (toolName.includes("Token")) return "🪙";
    return "🔧";
  };

  const toolName = part.toolName || "Tool";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        colorPalette="blue"
        size="sm"
        px={2}
        py={1}
        borderRadius="md"
      >
        {getToolIcon(toolName)} {toolName}
      </Badge>
    </motion.div>
  );
}

function ToolResultPart({ part }: { part: any }) {
  const result = part.result || {};
  const toolName = part.toolName || "";

  // Error handling
  if (result.success === false) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <Card.Root size="sm" bg="red.subtle" borderColor="red.muted" borderWidth="1px">
          <Card.Body p={3}>
            <HStack gap={2}>
              <Text fontSize="lg">⚠️</Text>
              <Text fontSize="sm" color="red.fg">{result.error || "An error occurred"}</Text>
            </HStack>
          </Card.Body>
        </Card.Root>
      </motion.div>
    );
  }

  // Market Price Display
  if (toolName.includes("getMarketPrice") && result.prices) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <Card.Root size="sm" bg="bg.subtle" borderRadius="lg">
          <Card.Body p={3}>
            <VStack align="start" gap={2}>
              <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                💰 Market Prices
              </Text>
              <Separator size="sm" />
              {Object.entries(result.prices).map(([symbol, data]: [string, any]) => (
                <HStack key={symbol} justify="space-between" w="full">
                  <Text fontSize="sm" fontWeight="medium">{symbol}</Text>
                  <Text fontSize="sm" color="accent.fg" fontWeight="semibold">
                    ${typeof data.price === 'number' ? data.price.toFixed(4) : data.price}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      </motion.div>
    );
  }

  // Balance Display
  if (toolName.includes("getUserBalance") && result.balances) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <Card.Root size="sm" bg="bg.subtle" borderRadius="lg">
          <Card.Body p={3}>
            <VStack align="start" gap={2}>
              <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                👤 Wallet Balance
              </Text>
              <Separator size="sm" />
              {result.balances.length > 0 ? (
                result.balances.map((balance: any, idx: number) => (
                  <HStack key={idx} justify="space-between" w="full">
                    <Text fontSize="sm" fontWeight="medium">{balance.symbol}</Text>
                    <Text fontSize="sm">{balance.balance}</Text>
                  </HStack>
                ))
              ) : (
                <Text fontSize="sm" color="fg.muted">No balances found</Text>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </motion.div>
    );
  }

  // Supported Tokens Display
  if (toolName.includes("getSupportedTokens") && result.tokens) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <Card.Root size="sm" bg="bg.subtle" borderRadius="lg">
          <Card.Body p={3}>
            <VStack align="start" gap={2}>
              <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                🪙 Supported Tokens
              </Text>
              <Separator size="sm" />
              <HStack wrap="wrap" gap={1}>
                {result.tokens.map((token: any, idx: number) => (
                  <Badge key={idx} size="sm" variant="subtle" colorPalette="gray">
                    {token.symbol}
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </motion.div>
    );
  }

  // Intent Creation Display
  if ((toolName.includes("createSwapIntent") || toolName.includes("buildIGSIntent")) && result.intent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <Card.Root size="sm" bg="green.subtle" borderRadius="lg" borderColor="green.muted" borderWidth="1px">
          <Card.Body p={3}>
            <VStack align="start" gap={2}>
              <HStack>
                <Text fontSize="sm" fontWeight="bold" color="green.fg">
                  🔄 Intent Created
                </Text>
                {result.summary?.type && (
                  <Badge size="xs" colorPalette="green">
                    {result.summary.type}
                  </Badge>
                )}
              </HStack>
              {result.summary && (
                <VStack align="start" gap={1} w="full">
                  {result.summary.from && (
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="fg.muted">From:</Text>
                      <Text fontSize="xs" fontWeight="medium">{result.summary.from}</Text>
                    </HStack>
                  )}
                  {result.summary.to && (
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="fg.muted">To:</Text>
                      <Text fontSize="xs" fontWeight="medium">{result.summary.to}</Text>
                    </HStack>
                  )}
                  {result.summary.slippage && (
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="fg.muted">Slippage:</Text>
                      <Text fontSize="xs">{result.summary.slippage}</Text>
                    </HStack>
                  )}
                  {result.summary.deadline && (
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="fg.muted">Deadline:</Text>
                      <Text fontSize="xs">{result.summary.deadline}</Text>
                    </HStack>
                  )}
                </VStack>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </motion.div>
    );
  }

  // Submit Intent (Stub)
  if (toolName.includes("submitIntent")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <Card.Root size="sm" bg="blue.subtle" borderColor="blue.muted" borderWidth="1px">
          <Card.Body p={3}>
            <VStack align="start" gap={1}>
              <HStack>
                <Text fontSize="lg">ℹ️</Text>
                <Text fontSize="sm" fontWeight="medium" color="blue.fg">Intent Ready</Text>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                Backend integration pending. Intent will be submitted to Intenus Protocol.
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      </motion.div>
    );
  }

  // Generic success
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge colorPalette="green" size="sm" px={2} py={1} borderRadius="md">
        ✅ {toolName} completed
      </Badge>
    </motion.div>
  );
}

function StatusTag({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; colorPalette: string; icon: string }
  > = {
    cooking: { label: "Generating", colorPalette: "orange", icon: "🔥" },
    handling: { label: "Processing", colorPalette: "blue", icon: "⚡" },
    perfect: { label: "Complete", colorPalette: "green", icon: "✅" },
    thinking: { label: "Working", colorPalette: "purple", icon: "🧠" },
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
      {config.icon} {config.label}
    </Badge>
  );
}
