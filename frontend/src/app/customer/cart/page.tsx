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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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
        
        // Auto-select all items when cart loads
        const itemIds = new Set(cart.map((item: CartItem) => item.id)) as Set<string>;
        setSelectedItems(itemIds);
      } else if (response.status === 401) {
        router.push('/customer/login');
      }
    } catch (error) {
      console.error('Load cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group cart items by restaurant
  const groupedCartItems = cartItems.reduce((acc, item) => {
    const restaurantId = item.restaurant.id;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurant: item.restaurant,
        items: []
      };
    }
    acc[restaurantId].items.push(item);
    return acc;
  }, {} as Record<string, { restaurant: CartItem['restaurant'], items: CartItem[] }>);

  // Calculate totals for selected items
  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Count unique restaurants for delivery fee calculation
  const selectedRestaurantIds = new Set(selectedCartItems.map(item => item.restaurant.id));
  const deliveryFee = selectedRestaurantIds.size * 15000; // 15k per restaurant
  const total = subtotal + deliveryFee;

  // Handle item selection
  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle restaurant selection (select/deselect all items in restaurant)
  const toggleRestaurant = (restaurantId: string) => {
    const restaurantItems = groupedCartItems[restaurantId]?.items || [];
    const allSelected = restaurantItems.every(item => selectedItems.has(item.id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      // Deselect all items in this restaurant
      restaurantItems.forEach(item => newSelected.delete(item.id));
    } else {
      // Select all items in this restaurant
      restaurantItems.forEach(item => newSelected.add(item.id));
    }
    setSelectedItems(newSelected);
  };

  // Handle proceed to checkout
  const proceedToCheckout = () => {
    if (selectedCartItems.length === 0) {
      alert('Vui lòng chọn ít nhất một món để thanh toán');
      return;
    }
    
    // Store selected items in localStorage for checkout
    localStorage.setItem('checkout_items', JSON.stringify(selectedCartItems));
    router.push('/customer/checkout');
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
            {/* Cart Items Grouped by Restaurant */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {Object.entries(groupedCartItems).map(([restaurantId, group]) => (
                  <div key={restaurantId} className="bg-white rounded-lg shadow-sm border">
                    {/* Restaurant Header */}
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={group.items.every(item => selectedItems.has(item.id))}
                            onChange={() => toggleRestaurant(restaurantId)}
                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-800">{group.restaurant.name}</h3>
                            <p className="text-sm text-gray-600">{group.restaurant.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {group.items.filter(item => selectedItems.has(item.id)).length}/{group.items.length} món
                          </p>
                          <p className="font-semibold text-orange-600">
                            {new Intl.NumberFormat('vi-VN').format(
                              group.items
                                .filter(item => selectedItems.has(item.id))
                                .reduce((sum, item) => sum + item.subtotal, 0)
                            )} đ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items in this restaurant */}
                    <div className="p-4 space-y-4">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          {/* Item Checkbox */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                          </div>
                          
                          {/* Item Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {(item.item.imageUrl || item.item.imageId) ? (
                              <img 
                                src={item.item.imageId ? `${api}/images/${item.item.imageId}` : item.item.imageUrl} 
                                alt={item.item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xl">🍽️</span>
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-800">{item.item.name}</h4>
                                <p className="text-sm text-gray-500">{item.item.type}</p>
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                disabled={updating === item.id}
                              >
                                {updating === item.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                  disabled={updating === item.id}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                  disabled={updating === item.id}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-800">
                                  {new Intl.NumberFormat('vi-VN').format(item.subtotal)} đ
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Intl.NumberFormat('vi-VN').format(item.item.price)} đ/món
                                </p>
                              </div>
                            </div>

                            {/* Special Instructions */}
                            {item.specialInstructions && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                <strong>Ghi chú:</strong> {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
                    <span className="font-medium">{selectedCartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số nhà hàng:</span>
                    <span className="font-medium">{selectedRestaurantIds.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(subtotal)} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí ship:</span>
                    <span className="font-medium">
                      {deliveryFee === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(deliveryFee)} đ`}
                    </span>
                  </div>
                  
                  {/* Per Restaurant Breakdown */}
                  {selectedRestaurantIds.size > 1 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Chi tiết theo nhà hàng:</p>
                      {Object.entries(groupedCartItems)
                        .filter(([restaurantId]) => selectedRestaurantIds.has(restaurantId))
                        .map(([restaurantId, group]) => {
                          const selectedGroupItems = group.items.filter(item => selectedItems.has(item.id));
                          const groupSubtotal = selectedGroupItems.reduce((sum, item) => sum + item.subtotal, 0);
                          const groupDeliveryFee = 15000;
                          return (
                            <div key={restaurantId} className="text-xs text-gray-600 mb-1">
                              <div className="flex justify-between">
                                <span>{group.restaurant.name}:</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(groupSubtotal + groupDeliveryFee)} đ</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-orange-600">{new Intl.NumberFormat('vi-VN').format(total)} đ</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={proceedToCheckout}
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
