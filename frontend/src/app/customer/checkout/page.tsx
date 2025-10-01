'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, OrderNotification } from '../../../components';
import { apiClient } from '@/services/api.client';
import { cartService } from '@/services/cart.service';

interface CartItem {
  id: string;
  item: {
    id: string;
    name: string;
    price: number;
    type: string;
    description?: string;
    imageUrl?: string;
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast, ToastContainer } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [summary, setSummary] = useState<{ subtotal: number; deliveryFee: number; serviceFee: number; total: number } | null>(null);

  useEffect(() => {
    loadCart();
    loadUserAddresses();
  }, []);

  const loadCart = async () => {
    try {
      // Load selected items from localStorage (from cart page)
      const checkoutItems = typeof localStorage !== 'undefined' ? localStorage.getItem('checkout_items') : null;
      if (checkoutItems) {
        const items = JSON.parse(checkoutItems);
        setCartItems(items);
      } else {
        // Fallback to API if no checkout items (cookie-based auth)
        const cart = await apiClient.get<any>(`/api/v1/cart`);
        const items = Array.isArray(cart) ? cart : (cart?.items || []);
        setCartItems(items);
      }

      // Get user info to get customerId (cookie-based auth)
      const me = await apiClient.get<any>(`/api/v1/auth/me`);
      if (me?.id) setCustomerId(me.id);

      // Load summary from backend
      try {
        const s = await cartService.getCartSummary('cookie-auth');
        const subtotal = (s as any)?.subtotal ?? 0;
        const deliveryFee = (s as any)?.deliveryFee ?? 0;
        const serviceFee = (s as any)?.serviceFee ?? 0;
        const total = (s as any)?.total ?? (subtotal + deliveryFee + serviceFee);
        setSummary({ subtotal, deliveryFee, serviceFee, total });
      } catch {
        setSummary(null);
      }
    } catch (error) {
      console.error('Load cart error:', error);
      showToast('Có lỗi xảy ra khi tải giỏ hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddresses = async () => {
    try {
      const profile = await apiClient.get<any>(`/api/v1/users/me/profile`);
      setUserAddresses(profile.addresses || []);
      const defaultAddress = profile.addresses?.find((addr: any) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
        setDeliveryAddress(defaultAddress.addressLine);
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Load user addresses error:', error);
    }
  };

  const calculateTotal = () => {
    if (summary) return summary.subtotal;
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDeliveryFee = () => {
    if (summary) return summary.deliveryFee;
    // Count unique restaurants
    const uniqueRestaurants = new Set(cartItems.map(item => item.restaurant.id));
    return uniqueRestaurants.size * 15000; // 15k per restaurant
  };

  const calculateFinalTotal = () => {
    if (summary) return summary.total;
    return calculateTotal() + calculateDeliveryFee();
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'bank_transfer') => {
    setPaymentMethod(method);
    if (method === 'bank_transfer') {
      showToast('Chức năng chuyển khoản đang được phát triển', 'info');
    }
  };

  const handleAddressSelect = (addressId: string) => {
    const address = userAddresses.find(addr => addr._id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setDeliveryAddress(address.addressLine);
      setSelectedAddress(address);
    }
  };

  const handleCustomAddress = () => {
    setSelectedAddressId('');
    setDeliveryAddress('');
    setSelectedAddress(null);
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      showToast('Vui lòng chọn phương thức thanh toán', 'error');
      return;
    }
    if (paymentMethod === 'bank_transfer') {
      showToast('Chức năng chuyển khoản đang được phát triển', 'info');
      return;
    }
    if (!deliveryAddress.trim() && !selectedAddress) {
      showToast('Vui lòng chọn hoặc nhập địa chỉ giao hàng', 'error');
      return;
    }

    setOrderLoading(true);
    try {
      // Format delivery address based on selection
      let formattedDeliveryAddress;
      if (selectedAddress) {
        formattedDeliveryAddress = {
          label: selectedAddress.label || 'Địa chỉ giao hàng',
          addressLine: selectedAddress.addressLine || deliveryAddress.trim(),
          latitude: selectedAddress.latitude || 0,
          longitude: selectedAddress.longitude || 0,
          note: selectedAddress.note || ''
        };
      } else {
        formattedDeliveryAddress = {
          label: 'Địa chỉ giao hàng',
          addressLine: deliveryAddress.trim(),
          latitude: 0,
          longitude: 0,
          note: ''
        };
      }

      // Group items by restaurant
      const groupedItems = cartItems.reduce((acc, item) => {
        const restaurantId = item.restaurant.id;
        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurant: item.restaurant,
            items: [] as CartItem[]
          };
        }
        acc[restaurantId].items.push(item);
        return acc;
      }, {} as Record<string, { restaurant: any, items: CartItem[] }>);

      // Create separate orders for each restaurant
      const orderPromises = Object.entries(groupedItems).map(async ([restaurantId, group]) => {
        const restaurantSubtotal = group.items.reduce((sum, item) => sum + item.subtotal, 0);
        const restaurantDeliveryFee = 15000; // 15k per restaurant
        const finalTotal = restaurantSubtotal + restaurantDeliveryFee;

        const orderData = {
          items: group.items.map(item => ({
            itemId: item.item.id,
            name: item.item.name,
            price: item.item.price,
            quantity: item.quantity,
            subtotal: item.subtotal
          })),
          paymentMethod,
          deliveryAddress: formattedDeliveryAddress,
          specialInstructions: specialInstructions.trim(),
          total: restaurantSubtotal,
          deliveryFee: restaurantDeliveryFee,
          finalTotal: finalTotal
        };

        return apiClient.post(`/api/v1/orders`, orderData);
      });

      const orders = await Promise.all(orderPromises);
      
      // Show success message with order details
      const orderCodes = orders.map((order: any) => order.orderCode || order.id).join(', ');
      showToast(`Đặt hàng thành công! Mã đơn hàng: ${orderCodes}`, 'success');

      // Clear cart
      try {
        await apiClient.delete(`/api/v1/cart`);
      } catch (error) {
        console.warn('Could not clear cart:', error);
      }

      // Clear checkout items
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('checkout_items');
      }

      // Redirect to orders page after a short delay
      setTimeout(() => {
        router.push('/customer/orders');
      }, 2000);
    } catch (error: any) {
      console.error('Place order error:', error);
      
      // More specific error messages
      if (error?.response?.status === 401) {
        showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại', 'error');
        router.push('/auth/login');
      } else if (error?.response?.status === 400) {
        const errorMsg = error?.response?.data?.message || 'Dữ liệu đơn hàng không hợp lệ';
        showToast(errorMsg, 'error');
      } else if (error?.response?.status === 404) {
        showToast('Không tìm thấy món ăn trong giỏ hàng', 'error');
      } else {
        showToast('Không thể đặt hàng. Vui lòng thử lại', 'error');
      }
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h1>
            <p className="text-gray-600 mb-6">Hãy thêm món ăn vào giỏ hàng để đặt hàng</p>
            <button
              onClick={() => router.push('/customer')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Đơn hàng của bạn</h2>
                
                <div className="space-y-4">
                  {/* Group items by restaurant */}
                  {Object.entries(
                    cartItems.reduce((acc, item) => {
                      const restaurantId = item.restaurant.id;
                      if (!acc[restaurantId]) {
                        acc[restaurantId] = {
                          restaurant: item.restaurant,
                          items: []
                        };
                      }
                      acc[restaurantId].items.push(item);
                      return acc;
                    }, {} as Record<string, { restaurant: any, items: CartItem[] }>)
                  ).map(([restaurantId, group]) => (
                    <div key={restaurantId} className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                        <span className="text-lg">🏪</span>
                        <h3 className="font-semibold text-gray-900">{group.restaurant.name}</h3>
                      </div>
                      
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg ml-4">
                          {item.item.imageUrl ? (
                            <img 
                              src={item.item.imageUrl} 
                              alt={item.item.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-2xl">{item.item.type === 'food' ? '🍽️' : '🥤'}</span>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.item.name}</h4>
                            <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                            <p className="text-sm text-gray-500">
                              {item.item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {item.subtotal.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{calculateTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí giao hàng:</span>
                    <span>
                      {calculateDeliveryFee() === 0 ? 'Miễn phí' : `${calculateDeliveryFee().toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí dịch vụ:</span>
                    <span>0đ</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                    <span>Tổng cộng:</span>
                    <span>{calculateFinalTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  
                  {/* Show breakdown by restaurant */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Chi tiết theo nhà hàng:</p>
                    {Object.entries(
                      cartItems.reduce((acc, item) => {
                        const restaurantId = item.restaurant.id;
                        if (!acc[restaurantId]) {
                          acc[restaurantId] = {
                            restaurant: item.restaurant,
                            items: []
                          };
                        }
                        acc[restaurantId].items.push(item);
                        return acc;
                      }, {} as Record<string, { restaurant: any, items: CartItem[] }>)
                    ).map(([restaurantId, group]) => {
                      const restaurantSubtotal = group.items.reduce((sum, item) => sum + item.subtotal, 0);
                      const restaurantDeliveryFee = 15000;
                      const restaurantTotal = restaurantSubtotal + restaurantDeliveryFee;
                      
                      return (
                        <div key={restaurantId} className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{group.restaurant.name}:</span>
                          <span>{restaurantTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Delivery Info */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin giao hàng</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn địa chỉ giao hàng *
                    </label>
                    
                    {userAddresses.length > 0 ? (
                      <div className="space-y-3">
                        {userAddresses.map((address) => (
                          <div
                            key={address._id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              selectedAddressId === address._id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleAddressSelect(address._id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{address.label}</span>
                                  {address.isDefault && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm mt-1">{address.addressLine}</p>
                                {address.note && (
                                  <p className="text-gray-500 text-xs mt-1">Ghi chú: {address.note}</p>
                                )}
                              </div>
                              <div className="text-orange-500">
                                {selectedAddressId === address._id && '✓'}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={handleCustomAddress}
                          className={`w-full p-3 rounded-lg border-2 transition-colors ${
                            selectedAddressId === ''
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">📍</span>
                            <span className="text-gray-900">Nhập địa chỉ khác</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-4xl mb-2">📍</div>
                        <p className="text-gray-600 mb-4">Chưa có địa chỉ nào được lưu</p>
                        <button
                          onClick={() => router.push('/customer/profile')}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Thiết lập địa chỉ ngay →
                        </button>
                      </div>
                    )}
                    
                    {selectedAddressId === '' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ giao hàng *
                        </label>
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Nhập địa chỉ chi tiết..."
                          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                          required
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú đặc biệt
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Ghi chú cho nhà hàng..."
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handlePaymentMethodSelect('cash')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💵</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Tiền mặt</p>
                        <p className="text-sm text-gray-600">Thanh toán khi nhận hàng</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePaymentMethodSelect('bank_transfer')}
                    className={`w-full p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏦</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Chuyển khoản</p>
                        <p className="text-sm text-gray-600">Chức năng đang phát triển</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={orderLoading || !paymentMethod || paymentMethod === 'bank_transfer'}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {orderLoading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
      <OrderNotification />
    </main>
  );
}