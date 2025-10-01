'use client';

import { useParams } from 'next/navigation';
import { useRestaurant, useRestaurantItems } from '@/hooks/useApi';
import { useCustomerAuth } from '@/contexts/AuthContext';
import { cartService } from '@/services/cart.service';

// Client-side rendering với caching
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  status: string;
}

// Trang chi tiết nhà hàng: hiển thị menu và thêm vào giỏ hàng
export default function RestaurantDetail() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useCustomerAuth();
  
  // Sử dụng optimized hook với caching
  const { data: restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(id);
  const { data: items, loading: itemsLoading, error: itemsError } = useRestaurantItems(id);
  
  const loading = restaurantLoading || itemsLoading;
  const error = restaurantError || itemsError;

  const handleAddToCart = async (itemId: string) => {
    try {
      if (!user) {
        window.location.href = '/customer/login';
        return;
      }
      // Cookie-based auth; token param is unused but required by typing
      await cartService.addToCart({ itemId, quantity: 1 }, 'cookie-auth');
      // Optional: give quick feedback
      alert('Đã thêm vào giỏ hàng');
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Không thể thêm vào giỏ. Vui lòng thử lại.');
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
        <p className="text-gray-600 mt-2">Chọn món và thêm vào giỏ</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item) => (
            <div key={item._id} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">
                      {item.type === 'food' ? '🍽️' : '🥤'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800">{item.name}</div>
                  <div className="text-orange-600 font-bold">
                    {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                  </div>
                </div>
              </div>
              {item.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
              )}
              <button
                onClick={() => handleAddToCart(item._id)}
                className="w-full inline-block text-center rounded-md bg-orange-600 px-3 py-2 text-white hover:bg-orange-700 transition-colors"
              >
                Thêm vào giỏ
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}