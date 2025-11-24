"use client";

import {
  HStack,
  Button,
  Text,
  Box,
  MenuTrigger,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { PiBaseballHelmetBold } from "react-icons/pi";
import { FaRegSmile } from "react-icons/fa";
import { FaSuperpowers } from "react-icons/fa6";

import { ChatbotMode, CHATBOT_MODES } from "@/ai/config/chatbot-modes";
import { motion } from "framer-motion";
import { MenuContent, MenuItem, MenuRoot } from "@/components/ui/menu";
export interface ModeSelectorProps {
  selectedMode: ChatbotMode;
  onModeChange: (mode: ChatbotMode) => void;
}

const MotionButton = motion.create(Button);
const MotionItem = motion.create(MenuItem);
const MotionText = motion.create(Text);

export function ModeSelector({
  selectedMode,
  onModeChange,
}: ModeSelectorProps) {
  const modes: ChatbotMode[] = ["safe", "pro", "smart"];
  const mode = selectedMode;
  const config = CHATBOT_MODES[mode];
  const isSelected = selectedMode === mode;
  
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <MotionButton
          key={mode}
          size="sm"
          rounded={"full"}
          variant={"outline"}
          transition={{ duration: 0.2 }}
          borderColor={
            selectedMode === "smart"
              ? "green.solid"
              : selectedMode === "pro"
              ? "yellow.solid"
              : "blue.solid"
          }
          color={
            selectedMode === "smart"
              ? "green.solid"
              : selectedMode === "pro"
              ? "yellow.solid"
              : "blue.solid"
          }
          bg="transparent"
          _hover={{
            bg: "transparent",
            background: "transparent",
            boxShadow: "none",
            backdropFilter: "none",
          }}
          _active={{
            bg: "transparent",
            background: "transparent",
            boxShadow: "none",
          }}
          _focus={{
            bg: "transparent",
            boxShadow: "none",
          }}
          _focusVisible={{
            bg: "transparent",
            boxShadow: "none",
          }}
          _pressed={{
            bg: "transparent",
            boxShadow: "none",
          }}
        >
          <Icon
            as={
              mode === "smart"
                ? FaRegSmile
                : mode === "pro"
                ? FaSuperpowers
                : PiBaseballHelmetBold
            }
            color={
              mode === "smart"
                ? "green.solid"
                : mode === "pro"
                ? "yellow.solid"
                : "blue.solid"
            }
          />
          <Text fontSize="xs" fontWeight={isSelected ? "semibold" : "normal"}>
            {config.name}
          </Text>
        </MotionButton>
      </MenuTrigger>
      <MenuContent
        rounded={"2xl"}
        bg={"bg.subtle/25"}
        backdropFilter={"blur(64px)"}
      >
        {modes.map((mode) => {
          const config = CHATBOT_MODES[mode];
          const isSelected = selectedMode === mode;

          return (
            <MotionItem
              key={mode}
              value={mode}
              onSelect={() => onModeChange(mode)}
              fontWeight={isSelected ? "600" : "400"}
              rounded={"lg"}
              role="group"
              whileHover={"hover"}
              _hover={{
                bg: "transparent",
                color:
                  mode === "smart"
                    ? "green.solid"
                    : mode === "pro"
                    ? "yellow.solid"
                    : "blue.solid",
                border: "1px solid",
                borderColor:
                  mode === "smart"
                    ? "green.solid"
                    : mode === "pro"
                    ? "yellow.solid"
                    : "blue.solid",
                transition: "all 0.5s ease-in-out",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}
              _active={{
                bg: "transparent",
                background: "transparent",
                boxShadow: "none",
              }}
              _focus={{
                bg: "transparent",
                boxShadow: "none",
              }}
            >
              <VStack align="start" gap={0}>
                <Text fontSize="sm">{config.name}</Text>
                <MotionText
                  fontSize="xs"
                  _hover={{
                    color:
                      mode === "smart"
                        ? "green.fg"
                        : mode === "pro"
                        ? "yellow.fg"
                        : "blue.fg",
                  }}
                >
                  {config.description}
                </MotionText>
              </VStack>
            </MotionItem>
          );
        })}
      </MenuContent>
    </MenuRoot>
  );
}
