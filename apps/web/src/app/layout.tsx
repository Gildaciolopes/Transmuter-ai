import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syneFont = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Transmuter.ai — Java to TypeScript Migration Engine",
  description:
    "Migrate Spring Boot projects to TypeScript/NestJS in minutes. AST-powered conversion of entities, services, controllers, DTOs and enums.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${syneFont.variable} ${dmSans.className} bg-gray-950 text-gray-100 min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
