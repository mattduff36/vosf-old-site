import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Only protect dashboard routes - let everything else through
  if (pathname.startsWith('/dashboard')) {
    const authenticated = request.cookies.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
