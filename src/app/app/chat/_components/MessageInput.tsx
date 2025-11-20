"use client";

import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  HStack,
  HTMLChakraProps,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { ChangeEvent, FormEvent, KeyboardEvent } from "react";

interface MessageInputProps extends Omit<HTMLChakraProps<"form">, "onChange"> {
  sendButtonProps?: ButtonProps;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function MessageInput({
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
    <chakra.form w={"full"} onSubmit={handleSubmit} {...props}>
      <VStack
        w={"full"}
        p={"2"}
        rounded={["3xl", "4xl"]}
        bg={"bg.subtle/25"}
        shadow={"xs"}
      >
        <Box p={"2"} w={"full"} rounded={["2xl", "3xl"]} bg={"bg.subtle/50"}>
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
          <HStack w={"full"} p={"2"} justify={"end"}>
            <Button
              type="submit"
              colorPalette="primary"
              transition={"all ease-in-out 0.25s"}
              disabled={disabled || !value?.trim()}
              loading={disabled}
              {...sendButtonProps}
            >
              Send
            </Button>
          </HStack>
        </Box>
      </VStack>
    </chakra.form>
  );
}

interface StatusBarProps extends BoxProps {}
export function StatusBar({ ...props }: StatusBarProps) {
  return <Box p={"2"} w={"full"} {...props}></Box>;
}
