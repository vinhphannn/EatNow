'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/Toast';
import OrderNotification from '../../../components/OrderNotification';

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
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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

  useEffect(() => {
    loadCart();
    loadUserAddresses();
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    try {
      // Get user info to get customerId
      const userResponse = await fetch(`${api}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        setCustomerId(user.id);
      }

      const response = await fetch(`${api}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const cart = await response.json();
        setCartItems(cart);
      } else {
        showToast('Không thể tải giỏ hàng', 'error');
      }
    } catch (error) {
      console.error('Load cart error:', error);
      showToast('Có lỗi xảy ra khi tải giỏ hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddresses = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) return;

    try {
      const response = await fetch(`${api}/users/me/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setUserAddresses(profile.addresses || []);
        
        // Set default address if available
        const defaultAddress = profile.addresses?.find((addr: any) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setDeliveryAddress(defaultAddress.addressLine);
        }
      }
    } catch (error) {
      console.error('Load user addresses error:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDeliveryFee = () => {
    const total = calculateTotal();
    return total >= 100000 ? 0 : 15000; // Miễn phí ship từ 100k
  };

  const calculateFinalTotal = () => {
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
    }
  };

  const handleCustomAddress = () => {
    setSelectedAddressId('');
    setDeliveryAddress('');
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

    if (!deliveryAddress.trim()) {
      showToast('Vui lòng chọn hoặc nhập địa chỉ giao hàng', 'error');
      return;
    }

    setOrderLoading(true);
    try {
      const token = localStorage.getItem('eatnow_token');
      const orderData = {
        items: cartItems.map(item => ({
          itemId: item.item.id,
          quantity: item.quantity,
          price: item.item.price
        })),
        paymentMethod,
        deliveryAddress: deliveryAddress.trim(),
        specialInstructions: specialInstructions.trim(),
        total: calculateFinalTotal(),
        deliveryFee: calculateDeliveryFee()
      };

      const response = await fetch(`${api}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const order = await response.json();
        showToast('Đặt hàng thành công! Nhà hàng đã được thông báo', 'success');
        
        // Clear cart
        await fetch(`${api}/cart`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Redirect to order tracking
        router.push(`/customer/orders/${order.id}`);
      } else {
        const error = await response.text();
        console.error('Place order failed:', error);
        showToast('Không thể đặt hàng. Vui lòng thử lại', 'error');
      }
    } catch (error) {
      console.error('Place order error:', error);
      showToast('Có lỗi xảy ra khi đặt hàng', 'error');
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
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
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
                        <h3 className="font-medium text-gray-900">{item.item.name}</h3>
                        <p className="text-sm text-gray-600">{item.restaurant.name}</p>
                        <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {item.subtotal.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
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
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                    <span>Tổng cộng:</span>
                    <span>{calculateFinalTotal().toLocaleString('vi-VN')}đ</span>
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
      {customerId && <OrderNotification customerId={customerId} />}
    </main>
  );
}