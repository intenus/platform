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
import { ChangeEvent } from "react";

interface MessageInputProps extends Omit<HTMLChakraProps<"form">, "onChange"> {
  sendButtonProps?: ButtonProps;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export function MessageInput({
  sendButtonProps,
  value,
  onChange,
  disabled,
  ...props
}: MessageInputProps) {
  return (
    <chakra.form w={"full"} {...props}>
      <VStack
        w={"full"}
        p={"2"}
        rounded={["3xl", "4xl"]}
        bg={"bg.subtle/25"}
        shadow={"xs"}
      >
        <Box p={"2"} w={"full"} rounded={["3xl", "4xl"]} bg={"bg.subtle/50"}>
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
