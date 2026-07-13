"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/reviews", label: "Reviews" },
  { href: "/account/privacy", label: "Privacy" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
