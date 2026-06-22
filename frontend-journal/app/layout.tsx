// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Registra y analiza tus trades",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nada de Sidebars aquí, solo la estructura HTML pura
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 flex h-screen overflow-hidden`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}