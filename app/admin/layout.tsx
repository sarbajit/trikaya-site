import { auth } from "@/lib/auth";
import { AdminShell } from "./_components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <AdminShell
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        role: session?.user?.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
