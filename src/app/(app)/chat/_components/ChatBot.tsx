/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client";

import { BoxProps, VStack } from "@chakra-ui/react";
import { MessageBot } from "./MessageBot";
import { MessageInput } from "./MessageInput";
import { MessageUser } from "./MessageUser";
import { CustomUIMessage } from "@/types/ai";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useState, FormEvent, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIntenusClient } from "@/hooks/useIntenusClient";
import { useIntenusWalrusClient } from "@/hooks/useIntenusWalrusClient";
import { Copyright } from "./Copyright";
import { ChatbotMode, DEFAULT_MODE } from "@/ai/config/chatbot-modes";
import { Placeholder } from "./Placeholder";
import { dispatchToolCall, ToolHandlerContext } from "./toolHandlers";
import { SolutionCard } from "./SolutionCard";

interface ChatBotProps extends BoxProps {}
export function ChatBot({}: ChatBotProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatbotMode>(DEFAULT_MODE);
  const [showDemoSolution, setShowDemoSolution] = useState(false);

  // Refs và animation controls
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const { registry, getPackageId } = useIntenusClient();
  const { walrusClient } = useIntenusWalrusClient();

  const currentAccountRef = useRef(currentAccount);

  useEffect(() => {
    currentAccountRef.current = currentAccount;
  }, [currentAccount]);

  const { messages, status, sendMessage, addToolOutput } =
    useChat<CustomUIMessage>({
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      onToolCall: async ({ toolCall }) => {
        // Build context for tool handlers
        // Follows Dependency Inversion Principle - inject all dependencies
        const toolHandlerContext: ToolHandlerContext = {
          addToolOutput,
          suiClient,
          currentAccount: currentAccountRef.current,
          walrusClient,
          registry,
          getPackageId,
          signAndExecuteTransaction,
          setShowDemoSolution,
        };

        // Delegate to dispatcher - Single Responsibility Principle
        await dispatchToolCall(toolCall, toolHandlerContext);
      },
    });

  // Function để scroll tới vị trí cụ thể với animation
  const scrollToPosition = (
    position: number,
    behavior: "smooth" | "auto" = "smooth"
  ) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: position,
      behavior,
    });
  };

  // Effect để handle scroll behavior khi có message mới
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentMessagesLength = messages.length;
    const prevMessagesLength = prevMessagesLengthRef.current;

    if (currentMessagesLength > prevMessagesLength) {
      const lastMessage = messages[messages.length - 1];

      setTimeout(() => {
        if (lastMessage?.role === "user") {
          // User message: scroll để hiện message mới gần top
          const lastMessageElement = container.lastElementChild as HTMLElement;
          if (lastMessageElement) {
            const offsetFromTop = 80; // Khoảng cách từ top
            const targetScrollTop = Math.max(
              0,
              lastMessageElement.offsetTop - offsetFromTop
            );
            scrollToPosition(targetScrollTop, "smooth");
          }
        } else if (lastMessage?.role === "assistant") {
          // Bot message: scroll xuống bottom
          scrollToPosition(container.scrollHeight, "smooth");
        }
      }, 100);
    }

    prevMessagesLengthRef.current = currentMessagesLength;
  }, [messages]);

  // Auto scroll khi bot đang streaming
  useEffect(() => {
    if (status === "streaming") {
      const container = messagesContainerRef.current;
      if (container) {
        const scrollToBottom = () => {
          scrollToPosition(container.scrollHeight, "smooth");
        };

        scrollToBottom();
        const interval = setInterval(scrollToBottom, 100);

        return () => clearInterval(interval);
      }
    }
  }, [status]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(
      {
        role: "user",
        parts: [
          {
            type: "text",
            text: input,
          },
        ],
      },
      {
        body: {
          mode,
        },
      }
    );
    setInput("");
  };

  return (
    <VStack w="full" h={"full"} p={"4"} position={"relative"}>
      {/* Messages Container với Motion */}
      <motion.div
        ref={messagesContainerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flex: 1,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          willChange: "transform",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && <Placeholder />}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{
                opacity: 0,
                y: message.role === "user" ? 20 : -20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: message.role === "user" ? -20 : 20,
              }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0.0, 0.2, 1], // easeOutCubic
                layout: {
                  duration: 0.3,
                  ease: [0.4, 0.0, 0.2, 1],
                },
              }}
              layout
              layoutId={message.id}
              style={{
                width: "100%",
                willChange: "transform, opacity",
                display: "flex",
                justifyContent: "center",
                alignContent: "center",
              }}
            >
              {message.role === "user" ? (
                <MessageUser message={message} />
              ) : (
                <MessageBot
                  message={message}
                  status={index === messages.length - 1 ? status : "submitted"}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator khi bot đang typing */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px",
            }}
          >
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--chakra-colors-blue-400)",
                marginRight: "4px",
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Message Input với subtle animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          width: "100%",
          flex: 0,
          padding: "16px",
          display: "flex",
          justifyContent: "center",
          alignContent: "center",
          bottom: "48px",
        }}
      >
        {showDemoSolution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SolutionCard
              solution={{
                solverAddress: "0x5f2e2d6f4c4b3a1e5f6d7c8b9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7g8h",
                solutionId: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
                transactionBytes: "0xabcdef1234567890",
                score: 87,
              }}
            />
          </motion.div>
        )}
        <MessageInput
          modeSelectorProps={{
            selectedMode: mode,
            onModeChange: setMode,
          }}
          onSubmit={handleSubmit}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </motion.div>
      <Copyright />
    </VStack>
  );
}
