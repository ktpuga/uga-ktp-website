import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow unauthenticated access to this list and the auth API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/code-of-conduct') ||
    pathname.startsWith('/robots.txt')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Optional role-based routes
  if (pathname.startsWith('/hackathon') && !['actives', 'alumni'].includes(token.role as string)) {
    return NextResponse.redirect(new URL('/auth/login?error=insufficient_permissions', req.url));
  }

  if (pathname.startsWith('/alumni') && token.role !== 'alumni') {
    return NextResponse.redirect(new URL('/auth/login?error=insufficient_permissions', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/rush/:path*', '/hackathon/:path*', '/alumni/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};