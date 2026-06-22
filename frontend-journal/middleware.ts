import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtenemos el token de las cookies
  const token = request.cookies.get('token')?.value;

  // Verificamos en qué ruta está el usuario
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isRegisterPage = request.nextUrl.pathname.startsWith('/register');

  // Si NO hay token y NO está en el login -> Lo mandamos al login
  if (!token && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si YA hay token y quiere entrar al login -> Lo mandamos al dashboard (raíz)
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si todo está bien, dejamos que la petición continúe
  return NextResponse.next();
}

// Configurar en qué rutas se debe ejecutar este middleware
export const config = {
  // Ignoramos los archivos estáticos de Next.js, imágenes y la API
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/register'],
};