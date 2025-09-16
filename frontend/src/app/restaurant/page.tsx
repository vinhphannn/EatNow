'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  restaurant_id: string;
  restaurant_name: string;
  items: any[];
}

// Trang Nhà hàng: xem nhanh menu hiện có (demo), sau sẽ thêm CRUD
export default function RestaurantPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await fetch(`${api}/demo/restaurants`);
        const data = res.ok ? await res.json() : [];
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, [api]);

  if (loading) {
    return (
      <main className="min-h-screen container mx-auto px-4 py-10">
        <div className="text-center">Đang tải...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Danh sách nhà hàng</h1>
      
      {restaurants.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p>Chưa có nhà hàng nào</p>
          <p className="text-sm mt-2">Hãy đăng ký nhà hàng để bắt đầu kinh doanh!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant.restaurant_id} className="card p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {restaurant.restaurant_name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {restaurant.items.length} món ăn
              </p>
              <a 
                href={`/customer/restaurant/${restaurant.restaurant_id}`}
                className="btn-primary"
              >
                Xem menu
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}