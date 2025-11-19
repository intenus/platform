"use client";

import { chakra, HStack, HtmlProps, Link } from "@chakra-ui/react";
import { Brands } from "./brands";
import { ConnectButton } from "../ConnectButton";

type HeaderProps = HtmlProps;
export function Header(props: HeaderProps) {
  const navLinks = [
    {
      name: "Docs",
      href: "/docs",
    },
    {
      name: "Pitch",
      href: "/pitch",
    },
    {
      name: "Demo",
      href: "/demo",
    },
  ];

  return (
    <chakra.header w={"full"} {...props}>
      <HStack w={"full"}>
        <Brands />
        <HStack as="nav" flex={1} gap="8" justifyContent="center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              transition={"all ease-in-out 0.25s"}
              _hover={{ color: "fg", textDecoration: "none" }}
            >
              {link.name}
            </Link>
          ))}
        </HStack>
        <ConnectButton />
      </HStack>
    </chakra.header>
  );
}
