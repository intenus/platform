import { TextProps, Text, Span } from "@chakra-ui/react";

type CopyrightProps = TextProps;
export function Copyright(props: CopyrightProps) {
  return (
    <Text fontSize={"sm"} color={"primary.muted"} textAlign={"center"} {...props}>
        Powered by <Span fontWeight={"medium"} color={"primary.contrast"}>Wynn Chill Lab</Span>
    </Text>
  );
}