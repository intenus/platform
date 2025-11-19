import { Favicon } from "@/components/global/brands";
import { CustomUIMessage } from "@/types/ai";
import { Box, BoxProps, HStack, Text } from "@chakra-ui/react";
import type { ChatStatus, TextUIPart } from "ai";

interface MessageBotProps extends BoxProps {
  message: CustomUIMessage;
  status: ChatStatus;
}
export function MessageBot({ message, ...props }: MessageBotProps) {
  return (
    <Box w={"3/5"} {...props}>
      <HStack gap={"2"} align={"start"} justifyContent={"start"}>
        <Favicon colored={false} size="md" />
        {message.parts.map((part, index) => (
          <div key={index}>
            {part.type === "text" && (
              <TextPart key={index} part={part as TextUIPart} />
            )}
          </div>
        ))}
      </HStack>
    </Box>
  );
}

function TextPart({ part }: { part: TextUIPart }) {
  return <Text w={"full"} color={"primary.fg"}>{part.text}</Text>;
}
