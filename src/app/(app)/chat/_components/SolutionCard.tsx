"use client";

import { NETWORK } from "@/utils/constants";
import {
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Link,
  Span,
  StackProps,
  Text,
} from "@chakra-ui/react";
import { IGSSolution } from "@intenus/common";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress } from "@mysten/sui/utils";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LuBlocks } from "react-icons/lu";

const MotionButton = motion.create(Button);
const MotionSpan = motion.create(Span);
const MotionText = motion.create(Text);

const variants = {
  rest: {
    color: "var(--chakra-colors-fg-inverted)",
    width: "60px",
  },
  hover: {
    color: "var(--chakra-colors-primary-500)",
    width: "120px",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.1,
    },
  },
};

interface Solution {
  solverAddress: string;
  solutionId: string;
  transactionBytes: IGSSolution["tx_bytes"];
  score: number;
}

interface SolutionCardProps extends StackProps {
  solution: Solution;
}
export function SolutionCard({ solution, ...props }: SolutionCardProps) {
  const signAndExecute = useSignAndExecuteTransaction();

  const {} = useMutation({
    mutationKey: ["execute-solution", solution.solutionId],
    mutationFn: async () => {
      const tx = Transaction.from(solution.transactionBytes);

      await signAndExecute.mutateAsync({
        transaction: tx,
      });
    },
  });

  return (
    <HStack
      w={"full"}
      rounded={"2xl"}
      bg={"secondary.solid"}
      p={"2"}
      {...props}
    >
      <Center
        p={"2"}
        rounded={"xl"}
        bg={"secondary.400"}
        h={"fit"}
        aspectRatio={"1/1"}
      >
        <Icon as={LuBlocks} size={"lg"} color={"secondary.contrast"} />
      </Center>
      <HStack>
        <Text fontWeight={"medium"}>Solution:</Text>
        <Link
          href={`https://explorer.sui.io/transaction/${solution.solutionId}?network=${NETWORK}`}
        >
          {formatAddress(solution.solutionId)}
        </Link>
      </HStack>
      <HStack flex={1} gap={"4"} justify={"end"}>
        <Text fontWeight={"medium"}>{solution.score || "32pt"}</Text>
        <MotionButton
          size="sm"
          px={4}
          overflow="hidden"
          justifyContent="center"
          whiteSpace="nowrap"
          variants={variants}
          initial="rest"
          animate="rest"
          whileHover="hover"
          rounded="full"
        >
          <MotionText
            variants={{
              rest: { opacity: 1 },
              hover: { opacity: 1 },
            }}
            transition={{ duration: 0 }}
          >
            <MotionSpan
              style={{ display: "inline-block" }}
              variants={{
                rest: { x: 0, width: "100%" },
                hover: { x: 0, width: "auto" },
              }}
            >
              Sign
            </MotionSpan>

            <MotionSpan
              style={{ display: "inline-block", marginLeft: "4px" }}
              variants={{
                rest: { opacity: 0, x: -10, width: "0px" },
                hover: {
                  width: "auto",
                  opacity: 1,
                  x: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.15,
                  },
                },
              }}
            >
              & Execute
            </MotionSpan>
          </MotionText>
        </MotionButton>
      </HStack>
    </HStack>
  );
}
