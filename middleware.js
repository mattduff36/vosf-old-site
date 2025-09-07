import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Only protect dashboard routes - let everything else through
  if (pathname.startsWith('/dashboard')) {
    const authToken = request.cookies.get('auth-token');
    
    if (!authToken?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
