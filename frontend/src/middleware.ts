import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Driver routes
  if (pathname.startsWith('/driver/') && !pathname.startsWith('/driver/login') && !pathname.startsWith('/driver/register')) {
    const driverToken = request.cookies.get('driver_token');
    if (!driverToken) {
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }
  }
  
  // Customer routes
  if (pathname.startsWith('/customer/') && !pathname.startsWith('/customer/login') && !pathname.startsWith('/customer/register')) {
    const customerToken = request.cookies.get('customer_token');
    if (!customerToken) {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
  }
  
  // Restaurant routes
  if (pathname.startsWith('/restaurant/') && !pathname.startsWith('/restaurant/login') && !pathname.startsWith('/restaurant/register')) {
    const restaurantToken = request.cookies.get('restaurant_token');
    if (!restaurantToken) {
      return NextResponse.redirect(new URL('/restaurant/login', request.url));
    }
  }
  
  // Admin routes
  if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin_token');
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/driver/:path*', '/customer/:path*', '/restaurant/:path*', '/admin/:path*']
};
