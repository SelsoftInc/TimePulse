import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/test-login',
  '/simple-login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/change-password',
];

// Routes that match employee registration pattern
const isEmployeeRegisterRoute = (pathname) => {
  return pathname.startsWith('/register/') && pathname.split('/').length === 3;
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.includes(pathname) || isEmployeeRegisterRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check for authentication token in cookies
  const token = request.cookies.get('token')?.value;
  const user = request.cookies.get('user')?.value;
  
  // If no token, redirect to login
  if (!token || !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
