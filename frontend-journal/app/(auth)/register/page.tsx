"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Lock, Mail, TrendingUp, User } from "lucide-react";
import api from "@/app/lib/api"; // Importamos nuestra instancia configurada
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // IMPORTANTE: FastAPI (OAuth2) exige que los datos se envíen como Form Data, no como JSON
      const formData = new URLSearchParams();
      formData.append("username", email); // OAuth2 usa "username", le pasamos el email
      formData.append("password", password);

      const payload = {
        name, email, password
      };

      console.log(payload);

      const response = await api.post("/auth/register", payload);

      console.log(response);

      // Guardamos el token en las cookies (expira en 7 días)
      //Cookies.set("token", response.data.access_token, { expires: 7 });
      
      // Redirigimos al Dashboard
      //router.push("/");
      //router.refresh(); // Forzamos a Next.js a re-evaluar el Middleware
      
    } catch (err: any) {
      console.error(err);
      setError("Correo o contraseña incorrectos. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 m-auto">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-200">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Trading Journal</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresa a tu cuenta para continuar</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-rose-100">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Nombre
                </label>
                <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <Input 
                    type="text" 
                    placeholder="Trader" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11 bg-slate-50"
                    required
                />
                </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input 
                type="email" 
                placeholder="trader@ejemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-slate-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 bg-slate-50"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold text-md mt-2"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Registrarse"}
          </Button>
        </form>

        {/* Sección de Registro (opcional) */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Ya tienes una cuenta? <a href="/login" className="text-blue-600 font-bold hover:underline">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  );
}