import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas públicas que NO requieren autenticación
  const publicRoutes = [
    '/',
    '/login',
    '/registro',
    '/verificar-email',
    '/recuperar-contrasena',
    '/restablecer-contrasena',
    '/correo-enviado',
    '/cuenta-desactivada'
  ]

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route + '/')
  )

  // Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Rutas protegidas - verificar autenticación
  const authenticated = request.cookies.get('authenticated')
  const usuario = request.cookies.get('usuario')
  
  console.log('🔐 Middleware - Ruta:', request.nextUrl.pathname)
  console.log('🔐 Middleware - Authenticated:', authenticated?.value)
  console.log('🔐 Middleware - Usuario:', usuario?.value ? 'Presente' : 'Ausente')

  // Si NO está autenticado, redirigir al login
  if (!authenticated || authenticated.value !== 'true') {
    console.log('❌ No autenticado - Redirigiendo a /login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si está autenticado, permitir acceso
  console.log('✅ Autenticado - Permitiendo acceso')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - Rutas públicas definidas arriba
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}