'use client';

import { useParams } from 'next/navigation';
import { useRestaurant } from '../../../../hooks/useApi';

// Client-side rendering với caching
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

interface Restaurant {
  restaurant_id: string;
  restaurant_name: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

// Trang chi tiết nhà hàng: hiển thị menu và thêm vào giỏ hàng
export default function RestaurantDetail() {
  const params = useParams();
  const id = params.id as string;
  
  // Sử dụng optimized hook với caching
  const { data: restaurants, loading, error } = useRestaurant(id);
  
  // Find specific restaurant from the list
  const restaurant = restaurants?.find((r: any) => r.restaurant_id === id) || null;

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
          <p>Không thể tải thông tin nhà hàng. Vui lòng thử lại sau.</p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen container mx-auto px-4 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy nhà hàng</h1>
          <p className="text-gray-600">Nhà hàng này có thể đã ngừng hoạt động hoặc không tồn tại.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">{restaurant.restaurant_name}</h1>
        <p className="text-gray-600 mt-2">Chọn món và thêm vào giỏ</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurant.items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-lg font-semibold text-gray-800">{item.name}</div>
              <div className="text-orange-600 font-bold mt-1">
                {new Intl.NumberFormat('vi-VN').format(item.price)} đ
              </div>
              <a 
                href={`/customer/cart?add=${item.id}&name=${encodeURIComponent(item.name)}&price=${item.price}&rid=${id}`} 
                className="mt-4 inline-block rounded-md bg-orange-600 px-3 py-2 text-white hover:bg-orange-700"
              >
                Thêm vào giỏ
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}