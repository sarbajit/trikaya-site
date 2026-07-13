"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { Toaster } from "@/components/ui/toaster";

const THEME_STORAGE_KEY = "admin-theme";

export function AdminShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null };
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark") setTheme("dark");
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <div data-theme={theme} className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopbar user={user} theme={theme} onToggleTheme={toggleTheme} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
