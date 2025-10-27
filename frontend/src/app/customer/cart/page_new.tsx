"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useApi";
import { useCustomerAuth } from "@/contexts/AuthContext";

export default function CartPage() {
  const { user } = useCustomerAuth();
  // Cookie-based auth: no need to get token from localStorage
  const { data: cartData, loading: cartLoading, error: cartError } = useCart(null);
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryFee] = useState(15000);
  const [serviceFee] = useState(5000);

  // Load cart data from database
  useEffect(() => {
    if (cartData && Array.isArray(cartData)) {
      setCartItems(cartData);
    }
  }, [cartData]);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotal = () => {
    return getSubtotal() + deliveryFee + serviceFee;
  };

  const groupItemsByRestaurant = () => {
    const groups: { [key: string]: any[] } = {};
    cartItems.forEach(item => {
      const key = `${item.restaurantId}-${item.restaurantName}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return groups;
  };

  const restaurantGroups = groupItemsByRestaurant();

  // Loading state
  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Đang tải giỏ hàng...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (cartError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-600">
          <h1 className="text-2xl font-bold mb-2">Lỗi tải giỏ hàng</h1>
          <p>Không thể tải giỏ hàng. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">🛒</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-gray-600 mb-8">
            Hãy thêm món ăn yêu thích vào giỏ hàng để đặt món
          </p>
          <Link
            href="/customer/restaurant"
            className="inline-flex items-center px-8 py-4 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors text-lg"
          >
            <span className="mr-2">🍽️</span>
            Khám phá nhà hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Giỏ hàng ({cartItems.length} món)
        </h1>
        <Link
          href="/customer/restaurant"
          className="text-orange-600 font-medium hover:text-orange-700"
        >
          Tiếp tục mua sắm
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {Object.entries(restaurantGroups).map(([restaurantKey, items]) => {
            const restaurantName = items[0].restaurantName;
            return (
              <div key={restaurantKey} className="bg-white rounded-2xl shadow-sm mb-6">
                {/* Restaurant Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">
                        {restaurantName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{restaurantName}</h3>
                      <p className="text-sm text-gray-600">
                        {items.length} món • Giao trong 25-35 phút
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4">
                      {/* Item Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                        {item.image || item.imageUrl ? (
                          <img
                            src={item.image || item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">
                            {item.type === 'food' ? '🍽️' : '🥤'}
                          </span>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.name}
                        </h4>
                        {item.options && (
                          <p className="text-sm text-gray-600 mb-1">
                            {item.options}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-sm text-orange-600 mb-2">
                            Ghi chú: {item.note}
                          </p>
                        )}
                        
                        {/* Price and Quantity */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-600">
                            {item.price.toLocaleString('vi-VN')}đ
                          </span>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                            >
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Tóm tắt đơn hàng
            </h3>

            {/* Delivery Address */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Giao đến</p>
                  <p className="text-sm text-gray-600">
                    123 Đường ABC, Quận 1, TP.HCM
                  </p>
                  <Link href="/customer/address" className="text-orange-600 text-sm hover:underline">
                    Thay đổi
                  </Link>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({cartItems.length} món)</span>
                <span>{getSubtotal().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí giao hàng</span>
                <span>{deliveryFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí dịch vụ</span>
                <span>{serviceFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span>{getTotal().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/customer/checkout"
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-center hover:bg-orange-600 transition-colors block"
            >
              Đặt hàng ngay
            </Link>

            {/* Payment Methods */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Phương thức thanh toán</p>
              <div className="flex space-x-2">
                <div className="flex-1 p-2 bg-gray-100 rounded-lg text-center">
                  <span className="text-xs">💳</span>
                  <p className="text-xs mt-1">Thẻ</p>
                </div>
                <div className="flex-1 p-2 bg-gray-100 rounded-lg text-center">
                  <span className="text-xs">📱</span>
                  <p className="text-xs mt-1">Ví điện tử</p>
                </div>
                <div className="flex-1 p-2 bg-orange-100 rounded-lg text-center">
                  <span className="text-xs">💰</span>
                  <p className="text-xs mt-1">COD</p>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}