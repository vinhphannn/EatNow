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
    if (pathname.startsWith('/driver/')) {
      const driverAccessToken = request.cookies.get('driver_access_token');
      const driverToken = request.cookies.get('driver_token');
      if (!driverAccessToken || !driverToken) {
        return NextResponse.redirect(new URL('/driver/login', request.url));
      }
    }
    if (pathname.startsWith('/customer/')) {
      const customerAccessToken = request.cookies.get('customer_access_token');
      const customerToken = request.cookies.get('customer_token');
      if (!customerAccessToken || !customerToken) {
        return NextResponse.redirect(new URL('/customer/login', request.url));
      }
    }
    if (pathname.startsWith('/restaurant/')) {
      const restaurantAccessToken = request.cookies.get('restaurant_access_token');
      const restaurantToken = request.cookies.get('restaurant_token');
      if (!restaurantAccessToken || !restaurantToken) {
        return NextResponse.redirect(new URL('/restaurant/login', request.url));
      }
    }
    if (pathname.startsWith('/admin/')) {
      const adminAccessToken = request.cookies.get('admin_access_token');
      const adminToken = request.cookies.get('admin_token');
      if (!adminAccessToken || !adminToken) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
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
