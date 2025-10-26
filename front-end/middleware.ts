import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/perfil', '/lecciones', '/progreso']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Verificar si hay token de autenticación
    const usuario = request.cookies.get('usuario')
    
    if (!usuario) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/perfil/:path*', '/lecciones/:path*', '/progreso/:path*']
}