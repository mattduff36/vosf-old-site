import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Debug logging
  console.log('Middleware - Path:', pathname);
  
  // Only protect dashboard routes - let everything else through
  if (pathname.startsWith('/dashboard')) {
    const authToken = request.cookies.get('auth-token');
    console.log('Middleware - Dashboard access, token exists:', !!authToken?.value);
    
    if (!authToken?.value) {
      console.log('Middleware - No token, redirecting to /');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
