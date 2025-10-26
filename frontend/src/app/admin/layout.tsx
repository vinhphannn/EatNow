"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/guards/AuthGuard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faStore,
  faTruck,
  faShoppingBag,
  faChartBar,
  faCog,
  faBars,
  faTimes,
  faUser,
  faSignOutAlt,
  faHome,
  faUtensils,
  faTags,
  faImage,
  faBullhorn,
  faMap,
  faWallet,
  faFileAlt,
  faShieldAlt,
  faBell,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

const adminMenuItems = [
  {
    title: 'Tổng quan',
    icon: faTachometerAlt,
    href: '/admin/dashboard',
    description: 'Thống kê tổng quan hệ thống'
  },
  {
    title: 'Quản lý người dùng',
    icon: faUsers,
    href: '/admin/modules/users',
    description: 'Quản lý tất cả người dùng',
    children: [
      { title: 'Khách hàng', href: '/admin/customers', icon: faUser },
      { title: 'Nhà hàng', href: '/admin/restaurants', icon: faStore },
      { title: 'Tài xế', href: '/admin/drivers', icon: faTruck }
    ]
  },
  {
    title: 'Quản lý nội dung',
    icon: faUtensils,
    href: '/admin/modules/content',
    description: 'Quản lý nội dung hiển thị',
    children: [
      { title: 'Danh mục món ăn', href: '/admin/categories', icon: faTags },
      { title: 'Bộ sưu tập nổi bật', href: '/admin/modules/content/collections', icon: faBullhorn },
      { title: 'Khuyến mãi', href: '/admin/modules/content/promotions', icon: faImage }
    ]
  },
  {
    title: 'Quản lý đơn hàng',
    icon: faShoppingBag,
    href: '/admin/orders',
    description: 'Theo dõi và quản lý đơn hàng'
  },
  {
    title: 'Báo cáo & Thống kê',
    icon: faChartBar,
    href: '/admin/modules/reports',
    description: 'Báo cáo doanh thu và thống kê',
    children: [
      { title: 'Doanh thu', href: '/admin/modules/reports/revenue', icon: faChartBar },
      { title: 'Đơn hàng', href: '/admin/modules/reports/orders', icon: faShoppingBag },
      { title: 'Người dùng', href: '/admin/modules/reports/users', icon: faUsers }
    ]
  },
  {
    title: 'Hệ thống',
    icon: faCog,
    href: '/admin/modules/system',
    description: 'Cài đặt và quản lý hệ thống',
    children: [
      { title: 'Cài đặt chung', href: '/admin/modules/system/settings', icon: faCog },
      { title: 'Thông báo', href: '/admin/modules/system/notifications', icon: faBell },
      { title: 'Bảo mật', href: '/admin/modules/system/security', icon: faShieldAlt },
      { title: 'Backup & Restore', href: '/admin/modules/system/backup', icon: faFileAlt }
    ]
  },
  {
    title: 'Bản đồ & Vị trí',
    icon: faMap,
    href: '/admin/map',
    description: 'Quản lý bản đồ và vị trí'
  },
  {
    title: 'Ví điện tử',
    icon: faWallet,
    href: '/admin/wallet',
    description: 'Quản lý ví điện tử và giao dịch'
  },
  {
    title: 'Hỗ trợ',
    icon: faQuestionCircle,
    href: '/admin/support',
    description: 'Hỗ trợ khách hàng và xử lý khiếu nại'
  }
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {adminMenuItems.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <div
                    onClick={() => toggleExpanded(item.title)}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                      isActive(item.href)
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon 
                        icon={item.icon} 
                        className={`w-5 h-5 ${isActive(item.href) ? 'text-orange-600' : 'text-gray-400'}`} 
                      />
                      <span>{item.title}</span>
                    </div>
                    <FontAwesomeIcon 
                      icon={expandedItems.includes(item.title) ? faTimes : faBars}
                      className="w-4 h-4 text-gray-400"
                    />
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon 
                        icon={item.icon} 
                        className={`w-5 h-5 ${isActive(item.href) ? 'text-orange-600' : 'text-gray-400'}`} 
                      />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                )}

                {item.children && expandedItems.includes(item.title) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive(child.href)
                            ? 'bg-orange-50 text-orange-700 border-l-2 border-orange-500'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FontAwesomeIcon 
                          icon={child.icon} 
                          className="w-4 h-4 text-gray-400" 
                        />
                        <span>{child.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@eatnow.vn</p>
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900">
                  {adminMenuItems.find(item => isActive(item.href))?.title || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500">
                  {adminMenuItems.find(item => isActive(item.href))?.description || 'Quản lý hệ thống'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Bypass guard for the public admin login route
  const pathname = usePathname();
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  return (
    <AdminGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminGuard>
  );
}