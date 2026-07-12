import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickTrails",
  description: "Book hotels, resorts, and homestays with QuickTrails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
