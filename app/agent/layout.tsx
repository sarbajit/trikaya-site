import { LogoutButton } from "@/components/LogoutButton";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Agent portal</span>
        <LogoutButton />
      </nav>
      {children}
    </div>
  );
}
