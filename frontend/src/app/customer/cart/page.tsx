'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  item: {
    id: string;
    name: string;
    price: number;
    type: string;
    description?: string;
    imageUrl?: string;
    imageId?: string;
    rating: number;
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
  quantity: number;
  specialInstructions?: string;
  subtotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    try {
      const response = await fetch(`${api}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const cart = await response.json();
        setCartItems(cart);
      } else if (response.status === 401) {
        router.push('/customer/login');
      }
    } catch (error) {
      console.error('Load cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(cartItemId);
    const token = localStorage.getItem('eatnow_token');

    try {
      const response = await fetch(`${api}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        await loadCart();
      } else {
        alert('Không thể cập nhật số lượng');
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      alert('Có lỗi xảy ra khi cập nhật số lượng');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    const token = localStorage.getItem('eatnow_token');

    try {
      const response = await fetch(`${api}/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadCart();
      } else {
        alert('Không thể xóa món khỏi giỏ hàng');
      }
    } catch (error) {
      console.error('Remove item error:', error);
      alert('Có lỗi xảy ra khi xóa món');
    }
  };

  const clearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả món trong giỏ hàng?')) return;

    const token = localStorage.getItem('eatnow_token');

    try {
      const response = await fetch(`${api}/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadCart();
      } else {
        alert('Không thể xóa giỏ hàng');
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      alert('Có lỗi xảy ra khi xóa giỏ hàng');
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">Hãy thêm món ăn yêu thích vào giỏ hàng</p>
            <button 
              onClick={() => router.push('/customer')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Khám phá món ăn
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex gap-4">
                      {/* Item Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {(item.item.imageUrl || item.item.imageId) ? (
                          <img 
                            src={item.item.imageId ? `${api}/images/${item.item.imageId}` : item.item.imageUrl} 
                            alt={item.item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">{item.item.type === 'food' ? '🍽️' : '🥤'}</span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{item.item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{item.restaurant.name}</p>
                        <p className="text-lg font-bold text-orange-600">
                          {new Intl.NumberFormat('vi-VN').format(item.item.price)} đ
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {item.specialInstructions && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Ghi chú:</span> {item.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Clear Cart Button */}
              <div className="mt-6">
                <button 
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Xóa tất cả món trong giỏ
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số món:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí ship:</span>
                    <span className="font-medium">Miễn phí</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-orange-600">{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push('/customer/checkout')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Tiến hành thanh toán
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}