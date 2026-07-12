"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => signOut({ callbackUrl })}>
      Log out
    </Button>
  );
}
