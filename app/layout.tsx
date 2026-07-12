import type { CSSProperties } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Trikaya",
  description: "Book hotels, resorts, and homestays with Trikaya.",
};

async function getThemeVars(): Promise<CSSProperties> {
  try {
    await connectDB();
    const settings = await getSiteSettings();
    const vars: Record<string, string> = {};
    if (settings.primaryColor) vars["--color-primary"] = settings.primaryColor;
    if (settings.secondaryColor) vars["--color-secondary"] = settings.secondaryColor;
    if (settings.accentColor) vars["--color-accent"] = settings.accentColor;
    return vars as CSSProperties;
  } catch (error) {
    console.error("Failed to load site settings for theme colors, using defaults", error);
    return {};
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeVars = await getThemeVars();

  return (
    <html lang="en" style={themeVars}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
