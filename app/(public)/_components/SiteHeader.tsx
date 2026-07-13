"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SessionRole = "customer" | "agent" | "admin" | null | undefined;

interface SiteHeaderProps {
  companyName: string;
  showCompanyName: boolean;
  logoUrl?: string;
  isLoggedIn: boolean;
  role?: SessionRole;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
];

function getAccountLinks(role: SessionRole) {
  if (role === "agent") {
    return [{ href: "/agent/dashboard", label: "Agent dashboard" }];
  }
  if (role === "admin") {
    return [{ href: "/admin", label: "Admin panel" }];
  }
  return [
    { href: "/account/bookings", label: "Bookings" },
    { href: "/account/reviews", label: "Reviews" },
  ];
}

export function SiteHeader({ companyName, showCompanyName, logoUrl, isLoggedIn, role }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const accountLinks = getAccountLinks(role);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          {logoUrl && (
            <Image src={logoUrl} alt={companyName} width={32} height={32} className="rounded-sm" />
          )}
          {showCompanyName && (
            <span className="font-display text-xl tracking-tight text-foreground">{companyName}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="gap-1.5">
                  <User className="size-4" />
                  Account
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {accountLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })} variant="destructive">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-border transition-[grid-template-rows] duration-200 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="rounded-md px-2 py-2 text-left text-sm font-medium text-destructive hover:bg-muted"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
