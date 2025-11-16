'use client';

/**
 * Intenus Protocol Chat Interface
 * Natural language DeFi intent builder
 */

import { useChat } from '@ai-sdk/react';
import { Box, Container, Flex, Heading, Text, VStack, Input, Button, Card } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { FiSend, FiLoader } from 'react-icons/fi';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome to Intenus Protocol! 👋

I'm your DeFi assistant. I can help you:

✨ **Swap tokens** with 20-40% better rates
🛡️ **MEV protection** via batch auctions
🔒 **Privacy options** for large trades
⚡ **Optimal routing** across all Sui DEXs

**Popular actions:**
- "Swap 100 SUI to USDC"
- "Check SUI price"
- "Show top DEXs on Sui"
- "What's my wallet balance?"

What would you like to do?`
      }
    ]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.lg" py={8}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="2xl" mb={2}>
              Intenus Protocol
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              Intent-based DeFi aggregation on Sui
            </Text>
          </Box>

          {/* Chat Messages */}
          <Card.Root
            h="60vh"
            overflowY="auto"
            p={4}
            bg="white"
            _dark={{ bg: 'gray.800' }}
            boxShadow="lg"
          >
            <Card.Body>
              <VStack gap={4} align="stretch">
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    maxW="80%"
                  >
                    <Box
                      bg={message.role === 'user' ? 'blue.500' : 'gray.100'}
                      color={message.role === 'user' ? 'white' : 'gray.900'}
                      _dark={{
                        bg: message.role === 'user' ? 'blue.600' : 'gray.700',
                        color: 'white'
                      }}
                      px={4}
                      py={3}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <Text fontSize="sm" fontWeight="semibold" mb={1} opacity={0.8}>
                        {message.role === 'user' ? 'You' : 'Intenus'}
                      </Text>
                      <Box
                        css={{
                          '& p': { marginBottom: '0.5rem' },
                          '& ul': { paddingLeft: '1.5rem', marginBottom: '0.5rem' },
                          '& li': { marginBottom: '0.25rem' },
                          '& strong': { fontWeight: 'bold' },
                          '& code': {
                            backgroundColor: message.role === 'user' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.9em'
                          }
                        }}
                      >
                        <Text whiteSpace="pre-wrap">
                          {message.content}
                        </Text>
                      </Box>

                      {/* Display tool invocations */}
                      {message.toolInvocations && message.toolInvocations.length > 0 && (
                        <Box mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.300">
                          {message.toolInvocations.map((tool: any) => (
                            <Box key={tool.toolCallId} fontSize="xs" opacity={0.8}>
                              <Text>
                                🔧 {tool.toolName}
                                {tool.state === 'result' && ' ✓'}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}

                {isLoading && (
                  <Box alignSelf="flex-start">
                    <Flex
                      align="center"
                      gap={2}
                      bg="gray.100"
                      _dark={{ bg: 'gray.700' }}
                      px={4}
                      py={3}
                      borderRadius="lg"
                    >
                      <FiLoader className="animate-spin" />
                      <Text fontSize="sm">Thinking...</Text>
                    </Flex>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Input Form */}
          <form onSubmit={handleFormSubmit}>
            <Flex gap={2}>
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about DeFi on Sui..."
                size="lg"
                bg="white"
                _dark={{ bg: 'gray.800' }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                colorPalette="blue"
                size="lg"
                disabled={isLoading || !input.trim()}
              >
                <FiSend />
              </Button>
            </Flex>
          </form>

          {/* Footer Info */}
          <Box
            p={4}
            bg="blue.50"
            _dark={{ bg: 'blue.900' }}
            borderRadius="md"
            fontSize="sm"
          >
            <Text fontWeight="semibold" mb={2}>
              💡 Powered by Intenus Protocol
            </Text>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              All intents use IGS (Intenus General Standard) v1.0 for measurable, verifiable DeFi operations.
              Your transactions are protected from MEV and optimized through solver competition.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
