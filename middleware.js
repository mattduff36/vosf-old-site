import { NextResponse } from 'next/server';

export function middleware(request) {
  const authToken = request.cookies.get('auth-token');
  const isAuthPage = request.nextUrl.pathname === '/';
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/database');
  
  // Simple token presence check (detailed JWT verification happens in API routes)
  const isAuthenticated = !!authToken?.value;
  
  // If user has token and trying to access login page, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user has no token and trying to access dashboard, redirect to login
  if (!isAuthenticated && isDashboard) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If user has no token and trying to access API routes, return 401
  if (!isAuthenticated && isApiRoute) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
