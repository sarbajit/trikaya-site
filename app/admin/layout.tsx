import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Settings" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/properties", label: "Properties" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="border-b border-border px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-foreground hover:underline">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
