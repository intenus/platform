"use client";

import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Center,
  HStack,
  HTMLChakraProps,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";

interface MessageInputProps extends HTMLChakraProps<"form"> {
  sendButtonProps?: ButtonProps;
}
export function MessageInput({ sendButtonProps, ...props }: MessageInputProps) {
  return (
    <chakra.form w={"full"} {...props}>
      <VStack
        w={"full"}
        p={"2"}
        rounded={["3xl", "4xl"]}
        bg={"bg.subtle/25"}
        shadow={"xs"}
      >
        <StatusBar />
        <Box p={"2"} w={"full"} rounded={["3xl", "4xl"]} bg={"bg.subtle/50"} h={"full"}>
          <Textarea
            w={"full"}
            h={"full"}
            maxHeight={"2xs"}
            autoresize
            focusRing={"none"}
            resize={"none"}
            border={"none"}
            placeholder="Type your intent"
          />
          <HStack w={"full"} p={"2"} justify={"end"}>
            <Button
              type="submit"
              colorPalette="primary"
              transition={"all ease-in-out 0.25s"}
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
