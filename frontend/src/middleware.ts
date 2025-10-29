import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Cookie-based route protection
  const isPublicRoute = (
    pathname.startsWith('/driver/login') ||
    pathname.startsWith('/driver/register') ||
    pathname.startsWith('/customer/login') ||
    pathname.startsWith('/customer/register') ||
    pathname.startsWith('/restaurant/login') ||
    pathname.startsWith('/restaurant/register') ||
    pathname.startsWith('/admin/login')
  );

  if (!isPublicRoute) {
    // Middleware chỉ dựa vào role-indicator (không nhạy cảm) để quyết định điều hướng.
    // Token thật là HttpOnly sẽ được xác thực ở /auth/me phía client.

    if (pathname.startsWith('/driver/')) {
      const driverToken = request.cookies.get('driver_token');
      if (!driverToken) return NextResponse.redirect(new URL('/driver/login', request.url));
    }
    if (pathname.startsWith('/customer/')) {
      const customerToken = request.cookies.get('customer_token');
      if (!customerToken) return NextResponse.redirect(new URL('/customer/login', request.url));
    }
    if (pathname.startsWith('/restaurant/')) {
      const restaurantToken = request.cookies.get('restaurant_token');
      if (!restaurantToken) return NextResponse.redirect(new URL('/restaurant/login', request.url));
    }
    if (pathname.startsWith('/admin/')) {
      const adminToken = request.cookies.get('admin_token');
      if (!adminToken) return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/driver/:path*', 
    '/customer/:path*', 
    '/restaurant/:path*', 
    '/admin/:path*'
  ]
};
