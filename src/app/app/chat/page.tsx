"use client";

import { useChat } from "@ai-sdk/react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Card,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useState, FormEvent, useEffect } from "react";
import type { UIMessage } from "ai";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useIntenusWalrusClient } from "@/hooks/useIntenusWalrusClient";
import { useIntenusClient } from "@/hooks/useIntenusClient";
import { SolverRegistryService } from "@intenus/client-sdk";
import { IGSIntent, IntentBuilder } from "@intenus/common";
import { MessageBot } from "./_components/MessageBot";
import { MessageUser } from "./_components/MessageUser";
import { MessageInput } from "./_components/MessageInput";
import { CustomUIMessage } from "@/types/ai";
export default function ChatPage() {
  const suiClient = useSuiClient();
  const intenusClient = useIntenusClient();
  const { walrusClient } = useIntenusWalrusClient();
  const {
    mutateAsync: signAndExecuteTransaction,
    isPending: isSigningAndExecuting,
  } = useSignAndExecuteTransaction();

  const currentAccount = useCurrentAccount();
  const [input, setInput] = useState("");
  // useChat defaults to /api/chat endpoint
  const { messages, status, sendMessage } = useChat<CustomUIMessage>({
    onToolCall: async ({ toolCall }) => {
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === "submitIntentTool") {
        if (!currentAccount) {
          throw new Error("No connected wallet");
        }

        // const intent = new IntentBuilder(toolCall.input as IGSIntent).build();

        // const flow = await walrusClient.intents.storeReturnFlow(intent);

        // const registerTx = flow.register({
        //   epochs: 3,
        //   owner: currentAccount.address,
        //   deletable: true,
        // });

        // const { blobId } = await flow.getBlob();

        // const { digest } = await signAndExecuteTransaction({
        //   transaction: registerTx,
        // });
        // await flow.upload({ digest });
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    <VStack w="full" h={"full"} maxW={["full", "xl", "2xl", "4xl"]} p={4}>
      <VStack gap={"4"} align="stretch" flex={1} w="full" overflowY="auto">
        {messages.map((message) => (
          message.role === "user" ? (
            <MessageUser key={message.id} message={message} />
          ) : (
            <MessageBot key={message.id} message={message} status={status} />
          )
        ))}
      </VStack>

      <MessageInput
        onSubmit={handleSubmit}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
      />
    </VStack>
  );
}
