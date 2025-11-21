/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client";

import { BoxProps, VStack } from "@chakra-ui/react";
import { MessageBot } from "./MessageBot";
import { MessageInput } from "./MessageInput";
import { MessageUser } from "./MessageUser";
import { CustomUIMessage } from "@/types/ai";
import { lastAssistantMessageIsCompleteWithToolCalls, tool } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { useState, FormEvent, useEffect, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useIntenusClient } from "@/hooks/useIntenusClient";
import { useIntenusWalrusClient } from "@/hooks/useIntenusWalrusClient";

interface ChatBotProps extends BoxProps {}
export function ChatBot({ ...props }: ChatBotProps) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction, isPending: isSigning } =
    useSignAndExecuteTransaction();

  const [input, setInput] = useState("");

  // Refs và animation controls
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const prevMessagesLengthRef = useRef(0);
  const { registry } = useIntenusClient();
  const { walrusClient } = useIntenusWalrusClient();

  const { messages, status, sendMessage, addToolOutput } =
    useChat<CustomUIMessage>({
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      onToolCall: async ({ toolCall }) => {
        if (toolCall.dynamic) {
          return;
        }

        if (toolCall.toolName === "checkWalletConnection") {
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: "checkWalletConnection",
            output: {
              connected: !!currentAccount,
              address: currentAccount?.address || null,
            },
          });
          return;
        }

        if (toolCall.toolName === "getUserBalancesTool") {
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: "getUserBalancesTool",
            output: await suiClient.getAllBalances({
              owner: toolCall.input.owner,
            }),
          });
        }

        if (toolCall.toolName === "getBalanceTool") {
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: "getBalanceTool",
            output: await suiClient.getBalance({
              owner: toolCall.input.owner,
              coinType: toolCall.input.coinType,
            }),
          });
        }

        if (toolCall.toolName === "submitIntentTool") {
          if (!currentAccount) {
            throw new Error("No connected wallet");
          }
          const intent = toolCall.input;

          const flow = await walrusClient.intents.storeReturnFlow(intent);
          await flow.encode();

          const registerTx = flow.register({
            epochs: 1,
            owner: currentAccount.address,
            deletable: true,
          });

          const { digest } = await signAndExecuteTransaction({
            transaction: registerTx,
          });

          await flow.upload({
            digest,
          });

          const { blobId } = await flow.getBlob();

          const intentObject = intent.object;
          const intentPolicy = intentObject.policy;

          const intentSubmitTx = registry.submitIntentTransaction(blobId, {
            auto_revoke_ms: intentPolicy.auto_revoke_time,
            solver_access_start_ms: 0,
            solver_access_end_ms: 0,
            requires_solver_registration: false,
            min_solver_stake: "",
            requires_attestation: false,
            expected_measurement: intentPolicy,
            purpose: "",
          });

          const { digest: intentDigest } = await signAndExecuteTransaction({
            transaction: intentSubmitTx,
          });

          const result = await suiClient.waitForTransaction({
            digest: intentDigest,
            options: {
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
            },
          });

          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: "submitIntentTool",
            output: {
              intentSubmitResult: result,
            },
          });
        }
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

        // Scroll ngay lập tức và sau mỗi khoảng thời gian ngắn
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

    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: input,
        },
      ],
    });
    setInput("");
  };

  return (
    <VStack w="full" h={"full"} p={4}>
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
          willChange: "transform", // Performance optimization
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{
                opacity: 0,
                y: message.role === "user" ? 20 : -20,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: message.role === "user" ? -20 : 20,
                scale: 0.95,
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
                willChange: "transform, opacity",
              }}
            >
              {message.role === "user" ? (
                <MessageUser message={message} />
              ) : (
                <MessageBot message={message} status={status} />
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
                scale: [1, 1.2, 1],
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
        style={{ width: "100%" }}
      >
        <MessageInput
          onSubmit={handleSubmit}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </motion.div>
    </VStack>
  );
}
