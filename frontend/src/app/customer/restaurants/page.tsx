'use client';

import { useSearchParams } from 'next/navigation';
import { useRestaurants } from '@/hooks/useApi';
import Link from 'next/link';

export default function CustomerRestaurantsPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const { data: restaurants, loading, error } = useRestaurants();

  if (loading) {
    return (
      <main className="min-h-screen container mx-auto px-4 py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2">Đang tải nhà hàng...</span>
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

  // Filter restaurants by category if specified
  const filteredRestaurants = category 
    ? restaurants?.filter((r: any) => r.category === category) || []
    : restaurants || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category ? `Nhà hàng ${category}` : 'Tất cả nhà hàng'}
          </h1>
          <p className="text-gray-600">
            {filteredRestaurants.length} nhà hàng có sẵn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant: any) => (
            <Link
              key={restaurant.restaurant_id}
              href={`/customer/restaurant/${restaurant.restaurant_id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                {restaurant.imageUrl ? (
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.restaurant_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-2">🏪</div>
                    <div className="text-sm text-gray-600 font-medium">Nhà hàng</div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Đang mở
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {restaurant.restaurant_name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {restaurant.items?.length || 0} món ăn
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="text-gray-600">4.5</span>
                  </div>
                  <span className="text-gray-500">15-25 phút</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {category ? `Không có nhà hàng ${category}` : 'Chưa có nhà hàng nào'}
            </h3>
            <p className="text-gray-500 mb-4">
              {category 
                ? 'Hãy thử tìm kiếm danh mục khác' 
                : 'Hệ thống đang được thiết lập'
              }
            </p>
            <Link 
              href="/customer"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
