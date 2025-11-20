"use client";

import { BoxProps, VStack } from "@chakra-ui/react";
import { MessageBot } from "./MessageBot";
import { MessageInput } from "./MessageInput";
import { MessageUser } from "./MessageUser";
import { CustomUIMessage } from "@/types/ai";
import {lastAssistantMessageIsCompleteWithToolCalls} from "ai"
import { useChat } from "@ai-sdk/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, FormEvent } from "react";

interface ChatBotProps extends BoxProps {

}
export function ChatBot({ ...props }: ChatBotProps) {
  const currentAccount = useCurrentAccount();
  const [input, setInput] = useState("");
  // useChat defaults to /api/chat endpoint
  const { messages, status, sendMessage } = useChat<CustomUIMessage>({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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
      <VStack gap={"4"} align="stretch" flex={1} w="full" overflowY="auto">
        {messages.map((message) =>
          message.role === "user" ? (
            <MessageUser key={message.id} message={message} />
          ) : (
            <MessageBot key={message.id} message={message} status={status} />
          )
        )}
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
