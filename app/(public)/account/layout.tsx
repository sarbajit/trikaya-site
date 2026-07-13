import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "./_components/AccountNav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "agent") {
    redirect("/agent/dashboard");
  }
  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">My account</h1>
      <div className="mt-6">
        <AccountNav />
      </div>
      <div className="mt-6">{children}</div>
    </main>
  );
}
