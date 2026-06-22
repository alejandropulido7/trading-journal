"use client"; // Es obligatorio porque usamos interactividad y hooks

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Eliminamos el token de seguridad
    Cookies.remove("token");
    
    // 2. Redirigimos al usuario a la pantalla de login
    router.push("/login");
    
    // 3. Forzamos la actualización para que el Middleware se entere
    router.refresh(); 
  };

  return (
    <button
      onClick={handleLogout}
      className="flex cursor-pointer items-center gap-3 w-full px-4 py-3 mt-auto text-sm font-medium text-slate-500 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors"
    >
      <LogOut size={20} />
      Cerrar Sesión
    </button>
  );
}