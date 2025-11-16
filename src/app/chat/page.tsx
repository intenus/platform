'use client';

import { useChat } from '@ai-sdk/react';
import { Box, VStack, HStack, Input, Button, Card, Text, Spinner } from '@chakra-ui/react';
import { useState, FormEvent } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');

  // useChat defaults to /api/chat endpoint
  const { messages, status, sendMessage } = useChat({
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput('');
  };

  return (
    <Box p={8} maxW="4xl" mx="auto">
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Card.Root>
          <Card.Body>
            <Card.Title>Sui Swap Assistant</Card.Title>
            <Card.Description>
              Chat with AI to create swap intents on Sui. Supports spot swaps and limit orders.
            </Card.Description>
          </Card.Body>
        </Card.Root>

        {/* Messages */}
        <Box
          height="500px"
          overflowY="auto"
          p={4}
          borderWidth="1px"
          borderRadius="md"
          bg="bg.muted"
        >
          <VStack gap={4} align="stretch">
            {messages.length === 0 && (
              <Card.Root>
                <Card.Body>
                  <Text color="fg.muted">
                    👋 Hi! I'm your Sui swap assistant. Try saying:
                  </Text>
                  <VStack gap={2} mt={4} align="start">
                    <Text fontSize="sm" color="fg.muted">• "Swap 100 SUI to USDC"</Text>
                    <Text fontSize="sm" color="fg.muted">• "Create a limit order to sell 50 SUI at $3"</Text>
                    <Text fontSize="sm" color="fg.muted">• "What's the current SUI price?"</Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}

            {messages.map((message) => (
              <Box
                key={message.id}
                alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                maxW="80%"
              >
                <Card.Root
                  bg={message.role === 'user' ? 'blue.500' : 'bg.panel'}
                  color={message.role === 'user' ? 'white' : 'inherit'}
                >
                  <Card.Body>
                    {/* Message content - only show text parts */}
                    {message.parts.map((part, idx) => {
                      if (part.type === 'text') {
                        return (
                          <Text key={idx} fontSize="sm" whiteSpace="pre-wrap">
                            {part.text}
                          </Text>
                        );
                      }
                      return null;
                    })}
                  </Card.Body>
                </Card.Root>
              </Box>
            ))}

            {isLoading && (
              <Box alignSelf="flex-start">
                <Card.Root bg="bg.panel">
                  <Card.Body>
                    <HStack gap={2}>
                      <Spinner size="sm" />
                      <Text fontSize="sm" color="fg.muted">Thinking...</Text>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <HStack gap={2}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (e.g., 'Swap 100 SUI to USDC')"
              disabled={isLoading}
              size="lg"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              colorScheme="blue"
              size="lg"
            >
              Send
            </Button>
          </HStack>
        </form>

        {/* Info */}
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted">
              ℹ️ This chatbot helps you create swap intents. It will ask questions, show market data,
              and generate IGS Intents. Server submission is not yet implemented.
            </Text>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
}
