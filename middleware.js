import { NextResponse } from 'next/server';

export function middleware(request) {
  const authenticated = request.cookies.get('authenticated');
  const isAuthPage = request.nextUrl.pathname === '/';
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  
  // If user is authenticated and trying to access login page, redirect to dashboard
  if (authenticated && authenticated.value === 'true' && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is not authenticated and trying to access dashboard, redirect to login
  if ((!authenticated || authenticated.value !== 'true') && isDashboard) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
