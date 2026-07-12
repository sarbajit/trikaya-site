import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trikaya",
  description: "Book hotels, resorts, and homestays with Trikaya.",
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
