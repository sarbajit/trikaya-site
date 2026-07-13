"use client";

import { signOut } from "next-auth/react";
import { LogOut, Moon, Sun, UserCircle } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminTopbarProps {
  user: { name?: string | null; email?: string | null; role?: string | null };
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function AdminTopbar({ user, theme, onToggleTheme }: AdminTopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" className="gap-2 px-2">
              <UserCircle className="size-5" />
              <span className="hidden text-sm font-medium sm:inline">{user.name ?? user.email ?? "Admin"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{user.name ?? "Admin"}</span>
                {user.email && <span className="text-xs font-normal text-muted-foreground">{user.email}</span>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })} variant="destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
