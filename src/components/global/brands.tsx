import {
  Heading,
  HStack,
  Image,
  ImageProps,
  StackProps,
} from "@chakra-ui/react";
import { SVGProps } from "react";
import NextImage from "next/image";

interface FaviconProps extends ImageProps {
  colored?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}
export function Favicon({ colored = true,size, ...props }: FaviconProps) {
  const sizeMap: Record<string, number> = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };
  const dimension = size ? sizeMap[size] : 64;

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image asChild {...props}>
      <NextImage
        src={colored ? "/ColoredFavicon.svg" : "/Favicon.svg"}
        alt="Intenus Protocol"
        width={dimension}
        height={dimension}
      />
    </Image>
  );
}

export function SocialFavicon({ size, ...props }: FaviconProps) {
  const sizeMap: Record<string, number> = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };
  const dimension = size ? sizeMap[size] : 64;

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image asChild {...props}>
      <NextImage
        src={"/SocialLogo.svg"}
        alt="Intenus Protocol"
        width={dimension}
        height={dimension}
      />
    </Image>
  );
}

type BrandsProps = StackProps;
export function Brands(props: BrandsProps) {
  return (
    <HStack>
      <Favicon size="md"/>
      <Heading fontSize="2xl">
        Intenus
      </Heading>
    </HStack>
  );
}
