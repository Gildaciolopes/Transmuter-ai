import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Transmuter.ai — Java to TypeScript Migration Engine",
  description:
    "Convert Spring Boot JPA entities to Zod schemas and Prisma models using deterministic AST analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
