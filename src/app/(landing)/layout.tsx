import { Header } from "@/components/global/bars";
import { Center } from "@chakra-ui/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Center
      flexDirection="column"
      minHeight="100vh"
      padding="4"
      bgImage={
        "radial-gradient(179.58% 100% at 50% 0%, #000000 32.69%, #090943 45.19%, #110E96 64.9%, #3B30F8 77.88%, #6158FE 88.44%, #B1ACFF 97.6%)"
      }
    >
      <Header />
      {children}
    </Center>
  );
}
