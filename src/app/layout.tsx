import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creative & Production Dashboard",
  description: "Team dashboard for tasks, leave, and capacity",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const theme = settings.themeColors;

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`:root { --navy: ${theme.navy}; --offwhite: ${theme.offwhite}; --orange: ${theme.orange}; --lime: ${theme.lime}; }`}</style>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
