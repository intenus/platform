import { CustomUIMessage } from "@/types/ai";
import { Box, BoxProps, Span, Text } from "@chakra-ui/react";

interface MessageUserProps extends BoxProps {
  message: CustomUIMessage;
}
export function MessageUser({ message, ...props }: MessageUserProps) {
  return (
    <Box {...props} textAlign={"right"}>
      <Text color={"fg"}>
        {message.parts.map((part, index) => (
          <Span key={index}>{part.type === "text" && part.text}</Span>
        ))}
      </Text>
    </Box>
  );
}
