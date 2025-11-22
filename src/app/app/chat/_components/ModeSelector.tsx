"use client";

import { HStack, Button, Text, Box } from "@chakra-ui/react";
import { ChatbotMode, CHATBOT_MODES } from "@/ai/config/chatbot-modes";
import { motion } from "framer-motion";

interface ModeSelectorProps {
  selectedMode: ChatbotMode;
  onModeChange: (mode: ChatbotMode) => void;
}

const MotionButton = motion(Button);

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  const modes: ChatbotMode[] = ['safe', 'pro', 'smart'];

  return (
    <Box w="full" pb={2}>
      <HStack spacing={2} justify="center" w="full">
        {modes.map((mode) => {
          const config = CHATBOT_MODES[mode];
          const isSelected = selectedMode === mode;

          return (
            <MotionButton
              key={mode}
              size="sm"
              variant={isSelected ? "solid" : "outline"}
              colorScheme={isSelected ? "blue" : "gray"}
              onClick={() => onModeChange(mode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 } as any}
              px={4}
              py={2}
              fontSize="sm"
              fontWeight={isSelected ? "600" : "400"}
              _hover={{
                bg: isSelected ? "blue.600" : "gray.100",
                borderColor: isSelected ? "blue.600" : "gray.300",
              }}
            >
              <Text fontSize="xs" fontWeight={isSelected ? "semibold" : "normal"}>
                {config.name}
              </Text>
            </MotionButton>
          );
        })}
      </HStack>
      <Text
        fontSize="xs"
        color="gray.500"
        textAlign="center"
        mt={2}
        px={4}
      >
        {CHATBOT_MODES[selectedMode].description}
      </Text>
    </Box>
  );
}
