"use client";

import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  HStack,
  HTMLChakraProps,
  Icon,
  IconButton,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { HiArrowUp } from "react-icons/hi";
import { ModeSelector, ModeSelectorProps } from "./ModeSelector";

interface MessageInputProps extends Omit<HTMLChakraProps<"form">, "onChange"> {
  modeSelectorProps: ModeSelectorProps;
  sendButtonProps?: ButtonProps;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  modeSelectorProps,
  sendButtonProps,
  value,
  onChange,
  onSubmit,
  disabled,
  ...props
}: MessageInputProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!disabled && value?.trim() && onSubmit) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value?.trim() && onSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <VStack
      w={["full", "full", "3/5"]}
      p={"2"}
      rounded={["3xl", "4xl"]}
      bg={"bg.subtle/25"}
      shadow={"xs"}
      backdropFilter={"blur(64px)"}
    >
      <chakra.form w={"full"} onSubmit={handleSubmit} {...props}>
        <Box p={"2"} w={"full"} rounded={["2xl", "3xl"]} bg={"bg/50"}>
          <Textarea
            w={"full"}
            maxHeight={"2xs"}
            autoresize
            focusRing={"none"}
            resize={"none"}
            border={"none"}
            placeholder="Type your intent..."
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
          <HStack w={"full"} p={"2"} justify={"space-between"}>
            <ModeSelector {...modeSelectorProps}/>
            <IconButton
              type="submit"
              colorPalette="primary"
              transition={"all ease-in-out 0.25s"}
              disabled={disabled || !value?.trim()}
              loading={disabled}
              {...sendButtonProps}
            >
              <Icon as={HiArrowUp} />
            </IconButton>
          </HStack>
        </Box>
      </chakra.form>
    </VStack>
  );
}

interface StatusBarProps extends BoxProps {}
export function StatusBar({ ...props }: StatusBarProps) {
  return <Box p={"2"} w={"full"} {...props}></Box>;
}
