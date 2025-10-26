"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { useDeliveryAddress } from "@/contexts/DeliveryAddressContext";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faLocationDot } from "@fortawesome/free-solid-svg-icons";

export default function CustomerNavBar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useCustomerAuth();
  const { addressLabel } = useDeliveryAddress();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddress, setShowAddress] = useState(true);

  const isActive = (href: string) => 
    pathname?.startsWith(href) ? "text-orange-600 font-semibold" : "text-gray-700 hover:text-orange-600";

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Address is now managed by DeliveryAddressContext

  // Collapse address row on scroll, keep search visible
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 8) setShowAddress(false);
      else setShowAddress(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-2">
        {/* Top row: delivery address (collapsible on scroll) */}
        <div className={`overflow-hidden transition-all duration-300 ${showAddress ? 'max-h-14 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}>
          <button
            onClick={() => (window.location.href = '/customer/profile')}
            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex w-8 h-8 rounded-lg bg-orange-100 items-center justify-center">
                <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-orange-600" />
              </span>
              <div className="text-left">
                <div className="text-[11px] text-gray-500">Giao đến</div>
                <div className="text-sm font-semibold text-gray-900 truncate max-w-[220px] sm:max-w-[360px]">
                  <span id="customer-navbar-address">{addressLabel}</span>
                </div>
              </div>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Bottom row: search only (no cart, no avatar) */}
        <div className="relative">
          <Link href="/customer/search">
            <input
              type="text"
              placeholder="Tìm món ăn, nhà hàng..."
              className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
              readOnly
            />
          </Link>
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link href="/customer/search" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors">
            Tìm
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <Link href="/customer/restaurant" className="block text-gray-700 hover:text-orange-600 font-medium">
              🍽️ Nhà hàng
            </Link>
            <Link href="/customer/orders" className="block text-gray-700 hover:text-orange-600 font-medium">
              📦 Đơn hàng
            </Link>
            <Link href="/customer/profile" className="block text-gray-700 hover:text-orange-600 font-medium">
              👤 Hồ sơ
            </Link>
            
            {/* Mobile Auth */}
            {!isAuthenticated && (
              <div className="pt-4 border-t space-y-3">
                <Link
                  href="/customer/login"
                  className="block w-full text-center px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/customer/register"
                  className="block w-full text-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}