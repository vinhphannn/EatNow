"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faList, faUser } from "@fortawesome/free-solid-svg-icons";

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-8 left-0 right-0 z-50 flex justify-center">
      <div className="w-[92%] max-w-md bg-white border border-gray-200 shadow-lg rounded-2xl px-4 py-2">
        <div className="grid grid-cols-3 text-xs">
          <Link href="/customer/home" className={`flex flex-col items-center justify-center py-2 ${pathname === '/customer/home' ? 'text-orange-600' : 'text-gray-700'}`}>
            <FontAwesomeIcon icon={faHouse} className="w-5 h-5 mb-1" />
            <span>Trang chủ</span>
          </Link>
          <Link href="/customer/orders" className={`flex flex-col items-center justify-center py-2 ${pathname?.startsWith('/customer/orders') ? 'text-orange-600' : 'text-gray-700'}`}>
            <FontAwesomeIcon icon={faList} className="w-5 h-5 mb-1" />
            <span>Đơn hàng</span>
          </Link>
          <Link href="/customer/profile" className={`flex flex-col items-center justify-center py-2 ${pathname?.startsWith('/customer/profile') ? 'text-orange-600' : 'text-gray-700'}`}>
            <FontAwesomeIcon icon={faUser} className="w-5 h-5 mb-1" />
            <span>Tôi</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

