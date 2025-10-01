"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRestaurantAuth } from "@/contexts/AuthContext";

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Use restaurant auth hook
  const { isAuthenticated, isLoading, user } = useRestaurantAuth();
  
  // Cookie-based auth only
  const token = null as any;

  // Redirect to login if not authenticated (but only if not already on login page)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/restaurant/login') {
      router.push('/restaurant/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);
  
  const isActive = (href: string) => pathname?.startsWith(href) ? "bg-orange-50 text-orange-700 border-r-2 border-orange-500" : "hover:bg-gray-50";

  // Load restaurant data after authentication
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadRestaurantData = async () => {
      try {
        // Cookie-based: luôn lấy từ /restaurants/mine cho an toàn
        const r = await fetch(`${api}/api/v1/restaurants/mine`, { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setRestaurant(data || null);
        } else {
          setRestaurant(null);
        }
      } catch (error) {
        console.error('Load restaurant data error:', error);
      }
    };

    loadRestaurantData();
  }, [isAuthenticated, user, api]);

  const displayName = useMemo(() => restaurant?.name || user?.email || "Nhà hàng", [restaurant, user]);
  const avatarText = useMemo(() => (restaurant?.name || user?.name || user?.email || "?").slice(0,1).toUpperCase(), [restaurant, user]);

  // Navigation menu items
  const navigation = [
    {
      name: 'Tổng quan',
      href: '/restaurant/dashboard',
      icon: '📊',
      description: 'Dashboard tổng quan'
    },
    {
      name: 'Đơn hàng',
      href: '/restaurant/orders',
      icon: '📦',
      description: 'Quản lý đơn hàng',
      badge: stats?.pendingOrders || 0
    },
    {
      name: 'Thực đơn',
      href: '/restaurant/menu',
      icon: '🍽️',
      description: 'Quản lý món ăn'
    },
    {
      name: 'Khách hàng',
      href: '/restaurant/customers',
      icon: '👥',
      description: 'Quản lý khách hàng'
    },
    {
      name: 'Khuyến mãi',
      href: '/restaurant/promotions',
      icon: '🎉',
      description: 'Quản lý khuyến mãi'
    },
    {
      name: 'Báo cáo',
      href: '/restaurant/stats',
      icon: '📈',
      description: 'Thống kê & báo cáo'
    },
    {
      name: 'Cài đặt',
      href: '/restaurant/profile',
      icon: '⚙️',
      description: 'Cài đặt nhà hàng'
    }
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // If on login page, render children directly (login page will handle its own UI)
  if (pathname === '/restaurant/login') {
    return <>{children}</>;
  }

  // Don't render layout if not authenticated and not on login page
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo & Restaurant Info */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">EatNow</h1>
              <p className="text-xs text-gray-500">Restaurant</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Restaurant Status */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 truncate">
                {restaurant?.name || 'Chưa thiết lập'}
              </h2>
              <p className="text-xs text-gray-500">Nhà hàng của bạn</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              restaurant?.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {restaurant?.isOpen ? 'Đang mở' : 'Đã đóng'}
            </div>
          </div>
          {restaurant?.address && (
            <p className="text-xs text-gray-500 mt-1 truncate">{restaurant.address}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats?.todayOrders || 0}</div>
              <div className="text-xs text-gray-500">Đơn hôm nay</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">₫{stats?.todayRevenue?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-500">Doanh thu</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)}`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">{avatarText}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500">Quản lý nhà hàng</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => pathname?.startsWith(item.href))?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {navigation.find(item => pathname?.startsWith(item.href))?.description || 'Quản lý nhà hàng'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM5 17h10M5 7h14M5 12h14" />
                </svg>
                {stats?.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.unreadNotifications}
                  </span>
                )}
              </button>

              {/* Restaurant toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Trạng thái:</span>
                <button
                  onClick={async () => {
                    try {
                      const next = !restaurant?.isOpen;
                      const res = await fetch(`${api}/api/v1/restaurants/mine`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ isOpen: next })
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setRestaurant((prev: any) => ({ ...(prev||{}), ...updated }));
                      }
                    } catch {}
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    restaurant?.isOpen ? 'bg-orange-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    restaurant?.isOpen ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* User menu */}
              {isAuthenticated && user?.role === 'restaurant' ? (
                <Link href="/restaurant/profile" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">{avatarText}</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">Nhà hàng</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Hidden when authenticated */}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


