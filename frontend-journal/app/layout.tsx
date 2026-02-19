import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
// 1. IMPORTAR ICONOS
import { LayoutDashboard, CalendarDays, Settings, LineChart, HardDrive, Banknote } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Dashboard profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 flex h-screen overflow-hidden`} suppressHydrationWarning={true}>
        
        <aside className="w-64 bg-slate-950 text-white flex flex-col shadow-xl z-20">
          <Link href="/" className="p-6 border-b border-slate-800 flex items-center gap-2">
            <LineChart className="text-blue-500 w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wider">TRADER<span className="text-blue-500">PRO</span></h1>
          </Link>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium text-slate-300 hover:text-white">
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link href="/accounts" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium text-slate-300 hover:text-white">
              <Banknote size={20} />
              Accounts
            </Link>
            <Link href="/trades" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium text-slate-300 hover:text-white">
              <CalendarDays size={20} />
              Historial Diario
            </Link>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <span className="text-xs text-slate-500 uppercase px-4 mb-2 block">Sistema</span>
              
              {/* NUEVO ENLACE: SERVIDORES */}
              <Link href="/servers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium text-slate-300 hover:text-white">
                <HardDrive size={20} />
                Servidores
              </Link>

              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium text-slate-300 hover:text-white">
                <Settings size={20} />
                Ajustes
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
            v1.0.0 Stable
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>

      </body>
    </html>
  );
}