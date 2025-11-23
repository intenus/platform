import { SocialFavicon } from "@/components/global/brands";
import { Center, Heading, StackProps, Text, VStack } from "@chakra-ui/react";

type PlaceholderProps = StackProps;
export function Placeholder(props: PlaceholderProps) {
  return (
    <Center w={"full"} h={"full"} p={"4"} {...props}>
      <VStack w={"full"} h={"full"} align={"center"} justify={"center"} {...props} gap={"4"}>
        <SocialFavicon w={["16", "32"]} aspectRatio={"1/1"} rounded={"full"} />
        <Heading
          as={"h1"}
          textAlign={"center"}
          fontSize={["2xl", "3xl", "4xl"]}
          lineHeight={"100%"}
        >
          HODL?, Swap? or Borrow?
          <br />
          Let&apos;s roll
        </Heading>
        <Text
          fontSize={["sm", "md", "lg"]}
          color={"fg.muted"}
          textAlign={"center"}
          maxW={["32ch", "48ch"]}
        >
          Trading made easy - just your intents, smart AI, fully optimized and
          protected
        </Text>
      </VStack>
    </Center>
  );
}
