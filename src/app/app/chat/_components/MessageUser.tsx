import { CustomUIMessage } from "@/types/ai";
import { HStack, Span, StackProps, Text } from "@chakra-ui/react";

interface MessageUserProps extends StackProps {
  message: CustomUIMessage;
}
export function MessageUser({ message, ...props }: MessageUserProps) {
  return (
    <HStack w={["full", "full", "3/5"]} justify={"right"} {...props}>
      <HStack p={"3"} rounded={"xl"} bg={"bg.subtle/50"} backdropFilter={"blur(64px)"}>
        <Text w={"full"} color={"fg"} textAlign={"right"}>
          {message.parts.map((part, index) => (
            <Span key={index} w={"full"}>
              {part.type === "text" && part.text}
            </Span>
          ))}
        </Text>
      </HStack>
    </HStack>
  );
}
