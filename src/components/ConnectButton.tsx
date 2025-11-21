"use client";

import { Button, ButtonProps } from "@chakra-ui/react";
import { ConnectModal, useCurrentWallet } from "@mysten/dapp-kit";
import { useState } from "react";

type Props = ButtonProps;
export function ConnectButton(props: Props) {
  const [open, setOpen] = useState(false);
  const { isConnected, isConnecting } = useCurrentWallet();

  if(isConnected) {
    return null;
  }

  return (
    <ConnectModal
      trigger={
        <Button
          colorPalette={"primary"}
          onClick={() => setOpen(true)}
          loading={isConnecting}
          {...props}
        >
          Connect Wallet
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
    />
  );
}
