"use client";

import { Button, ButtonProps } from "@chakra-ui/react";
import { ConnectModal } from "@mysten/dapp-kit";
import { useState } from "react";

type Props = ButtonProps
export function ConnectButton(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <ConnectModal
      trigger={
        <Button colorPalette={"primary"} {...props} onClick={() => setOpen(true)}>
          Connect Wallet
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
    />
  );
}
