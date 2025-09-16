'use client';

import { useRestaurants } from '../../../hooks/useApi';
import Link from 'next/link';

// Restaurant list page với optimized data fetching
export default function RestaurantListPage() {
  const { data: restaurants, loading, error } = useRestaurants();

  if (loading) {
    return (
      <main className="min-h-screen container mx-auto px-4 py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2">Đang tải danh sách nhà hàng...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen container mx-auto px-4 py-10">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-2">Lỗi tải dữ liệu</h1>
          <p>Không thể tải danh sách nhà hàng. Vui lòng thử lại sau.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Danh sách nhà hàng</h1>
      
      {restaurants?.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p>Chưa có nhà hàng nào</p>
          <p className="text-sm mt-2">Hãy đăng ký nhà hàng để bắt đầu kinh doanh!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants?.map((restaurant: any) => (
            <div key={restaurant.restaurant_id} className="card p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {restaurant.restaurant_name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {restaurant.items?.length || 0} món ăn
              </p>
              <Link 
                href={`/customer/restaurant/${restaurant.restaurant_id}`}
                className="btn-primary w-full text-center"
              >
                Xem menu
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
