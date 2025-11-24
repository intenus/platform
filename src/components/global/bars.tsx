"use client";

import { Center, chakra, HStack, HtmlProps, Link } from "@chakra-ui/react";
import { Brands } from "./brands";
import { ConnectButton } from "../ConnectButton";
import siteConfig from "@/configs/site";
import { LinkButton } from "../ui/link-button";

type HeaderProps = HtmlProps;
export function Header(props: HeaderProps) {
  const navLinks = [
    { name: "Docs", href: siteConfig.links.docs },
    { name: "Pitch", href: siteConfig.links.pitch },
    { name: "Demo", href: siteConfig.links.demo },
    { name: "GitHub", href: siteConfig.links.github },
  ];

  return (
    <chakra.header w={"full"} px={["4", "8", "16", "32"]} {...props}>
      <HStack w={"full"}>
        <Brands />
        <Center flex={1}>
          <HStack
            as="nav"
            gap="8"
            justifyContent="center"
            px={"4"}
            py={"2"}
            w={"fit"}
            rounded={"full"}
            border={"1px solid"}
            borderColor={"border"}
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                color={"fg.subtle"}
                transition={"all ease-in-out 0.25s"}
                _hover={{ color: "fg", textDecoration: "none" }}
                target="_blank"
                rel="noopener noreferrer"
                unstyled
              >
                {link.name}
              </Link>
            ))}
          </HStack>
        </Center>
        <LinkButton
          href={siteConfig.links.whitepaper}
          size={"sm"}
          borderRadius={"full"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read Whitepaper
        </LinkButton>
      </HStack>
    </chakra.header>
  );
}
