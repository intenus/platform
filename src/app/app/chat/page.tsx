"use client";

import { useChat } from "@ai-sdk/react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Container,
} from "@chakra-ui/react";
import { useState, FormEvent, useEffect, useRef } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useIntenusWalrusClient } from "@/hooks/useIntenusWalrusClient";
import { MessageBot } from "./_components/MessageBot";
import { MessageUser } from "./_components/MessageUser";
import { MessageInput } from "./_components/MessageInput";
import { CustomUIMessage } from "@/types/ai";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const { walrusClient } = useIntenusWalrusClient();
  const {
    mutateAsync: signAndExecuteTransaction,
  } = useSignAndExecuteTransaction();

  const currentAccount = useCurrentAccount();
  const [input, setInput] = useState("");

  // Scroll refs and state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // useChat with enhanced tool handling
  const { messages, status, sendMessage } = useChat<CustomUIMessage>({
    onToolCall: async ({ toolCall }) => {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "submitIntentTool") {
        if (!currentAccount) {
          throw new Error("No connected wallet");
        }
        // Implementation when ready
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Smooth auto-scroll with user scroll detection
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!autoScrollEnabled) return;

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      // Smooth scroll for streaming, instant for initial load
      const behavior = status === 'streaming' ? 'smooth' : 'auto';
      scrollToBottom(behavior);
    }
  }, [messages, status, isUserScrolling]);

  // Detect user scrolling
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsUserScrolling(true);

      // Check if user scrolled to bottom
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;

      setAutoScrollEnabled(isAtBottom);

      // Reset scrolling flag after delay
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");

    // Enable auto-scroll when user sends message
    setAutoScrollEnabled(true);
    setIsUserScrolling(false);
  };

  return (
    <Container
      maxW={["full", "xl", "2xl", "4xl"]}
      h="100vh"
      p={0}
      position="relative"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header with connection */}
      <Box p={4} borderBottomWidth="1px" borderColor="border.muted">
        <HStack justify="space-between">
          <Box>
            <Text fontSize="lg" fontWeight="bold">Intenus Protocol</Text>
            <Text fontSize="sm" color="fg.muted">Intent-based DeFi Assistant</Text>
          </Box>
          <ConnectButton />
        </HStack>
      </Box>

      {/* Messages Container with Custom Scroll */}
      <Box flex={1} position="relative" overflow="hidden">
        <Box
          ref={scrollAreaRef}
          h="full"
          overflowY="auto"
          overflowX="hidden"
          css={{
            // Custom scrollbar styles
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'var(--chakra-colors-border-muted)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'var(--chakra-colors-border)',
            },
          }}
        >
          <VStack
            gap={4}
            align="stretch"
            p={4}
            pb={6}
            minH="full"
            justify={messages.length === 0 ? "center" : "flex-end"}
          >
            {messages.length === 0 && (
              <Box
                flex={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
                opacity={0.6}
              >
                <VStack gap={2} textAlign="center">
                  <Text fontSize="lg" fontWeight="medium">
                    👋 Welcome to Intenus Protocol
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Type your DeFi intent and I'll help you create it
                  </Text>
                </VStack>
              </Box>
            )}

            {messages.map((message) => (
              message.role === "user" ? (
                <MessageUser key={message.id} message={message} />
              ) : (
                <MessageBot key={message.id} message={message} status={status} />
              )
            ))}

            {/* Invisible scroll target */}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!autoScrollEnabled && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                zIndex: 10,
              }}
            >
              <Button
                size="sm"
                colorPalette="accent"
                borderRadius="full"
                onClick={() => {
                  setAutoScrollEnabled(true);
                  scrollToBottom('smooth');
                }}
                shadow="md"
              >
                ↓ New messages
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Input Area - Fixed at bottom */}
      <Box p={4} borderTopWidth="1px" borderColor="border.muted" bg="bg">
        <MessageInput
          onSubmit={handleSubmit}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </Box>
    </Container>
  );
}
