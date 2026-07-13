"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  IdCard,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, disabled: true },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/customers", label: "Customers", icon: IdCard },
  { href: "/admin/agents", label: "Agents", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/contact-messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/gdpr", label: "GDPR", icon: ShieldCheck },
  { href: "/admin", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-150",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed && <span className="font-display text-base font-semibold text-foreground">Trikaya Admin</span>}
        <button
          type="button"
          onClick={toggle}
          className="ml-auto flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? `${item.label} (coming soon)` : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <span className="flex flex-1 items-center justify-between gap-2">
                    {item.label}
                    <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      Soon
                    </span>
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-primary" />}
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
