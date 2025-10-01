'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Trang Nhà hàng: redirect đến dashboard
export default function RestaurantPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/restaurant/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}