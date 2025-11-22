import { Header } from "@/components/global/bars";
import { Center, VStack } from "@chakra-ui/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <VStack w={"full"} h={"full"} position={"relative"} p={"4"} overflow={"hidden"}>
      <Header />
      {children}
    </VStack>
  );
}
