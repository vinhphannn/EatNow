"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast, OrderNotification } from '../../../components';
import { apiClient } from '@/services/api.client';
import { cartService } from '@/services/cart.service';
import { useCustomerAuth } from '@/contexts/AuthContext';
import { useDistanceCalculator } from '@/hooks/useDistanceCalculator';
import { ItemOptionsDisplay } from '@/components/ItemOptionsDisplay';
import { CartItemOptions } from '@/components/CartItemOptions';
import { ItemNumber } from '@/components/ItemNumber';
import { useOrderPlacement } from '@/hooks/useOrderPlacement';
import { calculateDistanceKm, calculateDeliveryFee as calculateDeliveryFeeUtil, estimateDeliveryTime } from '@/utils/deliveryUtils';
import { calculateCartSummary } from '@/utils/cartUtils';

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
  totalPrice: number;
  options?: Array<{
    name: string;
    choices: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
  specialInstructions?: string;
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
  const search = useSearchParams();
  const restaurantId = useMemo(() => String(search?.get('restaurantId') || ''), [search]);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast } = useToast();
  const { user } = useCustomerAuth();
  const { calculateDistance, calculateDeliveryFee: calculateDeliveryFeeFromDistance, estimateDeliveryTime, loading: distanceLoading } = useDistanceCalculator();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [summary, setSummary] = useState<{ subtotal: number; deliveryFee: number; tip: number; doorFee: number; total: number } | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [tip, setTip] = useState<number>(0);
  const [doorFee, setDoorFee] = useState<boolean>(false);
  const [driverTip, setDriverTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [showTipDialog, setShowTipDialog] = useState<boolean>(false);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [restaurantCoords, setRestaurantCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<{ name: string; imageUrl?: string; address?: string } | null>(null);
  
  // Distance calculation states
  const [distance, setDistance] = useState<number>(0);
  const [deliveryTime, setDeliveryTime] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [distanceCalculated, setDistanceCalculated] = useState<boolean>(false);

  useEffect(() => {
    if (!restaurantId) {
      showToast('Thiếu restaurantId. Vui lòng quay lại trang nhà hàng.', 'error');
      router.push('/customer/home');
      return;
    }
    loadCart();
    loadUserAddresses();
  }, [restaurantId]);

  // Calculate distance when restaurant coordinates are loaded and we have a selected address
  useEffect(() => {
    if (restaurantCoords && selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
      console.log('🔍 Recalculating distance with restaurant coords:', { restaurantCoords, selectedAddress });
      calculateDistanceAndFee(
        restaurantCoords.lat, 
        restaurantCoords.lng,
        selectedAddress.latitude,
        selectedAddress.longitude
      );
    }
  }, [restaurantCoords, selectedAddress]);

  // Auto-update recipientName and recipientPhone from selectedAddress
  useEffect(() => {
    if (selectedAddress) {
      if (selectedAddress.recipientName) {
        setRecipientName(selectedAddress.recipientName);
        console.log('🔍 Auto-set recipientName from selectedAddress:', selectedAddress.recipientName);
      }
      if (selectedAddress.phone) {
        setRecipientPhone(selectedAddress.phone);
        console.log('🔍 Auto-set recipientPhone from selectedAddress:', selectedAddress.phone);
      }
    }
  }, [selectedAddress]);

  const loadCart = async () => {
    try {
      // Load cart with new API structure
      const cart = await cartService.getCart(restaurantId, 'cookie-auth');
      console.log('Cart data:', cart);
      
      // Transform cart items to match expected format
      const transformedItems = cart?.items?.map((item: any) => ({
        id: item.itemId,
        item: {
          id: item.itemId,
          name: item.name,
          price: item.price,
          type: 'food',
          description: '',
          imageUrl: item.imageUrl,
          rating: 0
        },
        restaurant: {
          id: cart.restaurantId,
          name: restaurantInfo?.name || '',
          address: restaurantInfo?.address || ''
        },
        quantity: item.quantity,
        subtotal: item.subtotal,
        totalPrice: item.totalPrice,
        options: item.options || [],
        specialInstructions: ''
      })) || [];
      
      setCartItems(transformedItems);

      // Get user info from context
      if (user?.id) setCustomerId(user.id);
      // Don't set recipientName from user - it should come from the selected address

      // Calculate summary from cart data
      const subtotal = Number(cart?.totalAmount || 0);
      setSummary({ subtotal, deliveryFee: 0, tip: 0, doorFee: 0, total: subtotal });

      // Load restaurant info and coordinates for distance calculation
      try {
        const r = await apiClient.get<any>(`/api/v1/restaurants/${restaurantId}`);
        if (r) {
          console.log('Restaurant info:', r);
          setRestaurantInfo({
            name: r.name,
            imageUrl: r.imageUrl,
            address: r.address
          });
          if (r?.latitude !== undefined && r?.longitude !== undefined) {
            setRestaurantCoords({ lat: Number(r.latitude), lng: Number(r.longitude) });
          }
        }
      } catch {}
    } catch (error) {
      console.error('Load cart error:', error);
      showToast('Có lỗi xảy ra khi tải giỏ hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance and delivery fee
  const calculateDistanceAndFee = async (restaurantLat: number, restaurantLng: number, customerLat: number, customerLng: number) => {
    console.log('🔍 Calculating distance:', { restaurantLat, restaurantLng, customerLat, customerLng });
    try {
      const result = await calculateDistance(
        { lat: restaurantLat, lng: restaurantLng },
        { lat: customerLat, lng: customerLng }
      );
      
      console.log('🔍 Distance result:', result);
      
      if (result.success) {
        setDistance(result.distance);
        setDeliveryTime(estimateDeliveryTime(result.distance));
        setDeliveryFee(calculateDeliveryFeeUtil(result.distance));
        setDistanceCalculated(true);
        console.log('🔍 Distance calculated successfully:', result.distance);
        
        // Update summary with new delivery fee
        if (summary) {
          setSummary(prev => prev ? {
            ...prev,
            deliveryFee: calculateDeliveryFeeUtil(result.distance),
            total: prev.subtotal + calculateDeliveryFeeUtil(result.distance) + prev.tip + (prev.doorFee ? 5000 : 0)
          } : null);
        }
        
        showToast(`Khoảng cách: ${result.distance.toFixed(2)}km, Phí ship: ${calculateDeliveryFeeUtil(result.distance).toLocaleString('vi-VN')}đ`, 'success');
      } else {
        showToast('Không thể tính khoảng cách', 'error');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      showToast('Lỗi khi tính khoảng cách', 'error');
    }
  };

  const loadUserAddresses = async () => {
    try {
      // Use customer profile endpoint like profile page
      const profile = await apiClient.get<any>(`/api/v1/customer/profile`);
      console.log('Profile data:', profile);
      setUserAddresses(profile.addresses || []);
      
      // Load phone from customer profile
      if (profile.phone) {
        setRecipientPhone(profile.phone);
      }
      
      const defaultAddress = profile.addresses?.find((addr: any) => addr.isDefault);
      console.log('Default address:', defaultAddress);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
        setDeliveryAddress(defaultAddress.addressLine);
        setSelectedAddress(defaultAddress);
        
        // Calculate distance if we have restaurant coordinates
        console.log('🔍 Checking coordinates:', { restaurantCoords, defaultAddress });
        if (restaurantCoords && defaultAddress.latitude && defaultAddress.longitude) {
          calculateDistanceAndFee(
            restaurantCoords.lat, 
            restaurantCoords.lng,
            defaultAddress.latitude,
            defaultAddress.longitude
          );
        } else {
          console.log('🔍 Missing coordinates:', { restaurantCoords, defaultAddress });
        }
      }
    } catch (error) {
      console.error('Load user addresses error:', error);
      showToast('Không thể tải danh sách địa chỉ', 'error');
    }
  };

  const calculateTotal = () => {
    if (summary) return summary.subtotal;
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateDeliveryFee = () => {
    // Compute based on distance: <=4km => 15k; each km above adds 5k
    if (!summary) return 0;
    return summary.deliveryFee ?? 0;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    const delivery = distanceCalculated ? deliveryFee : calculateDeliveryFeeUtil(0);
    const tipAmount = tip || 0;
    const doorAmount = doorFee ? 5000 : 0;
    const driverTipAmount = driverTip || 0;
    return subtotal + delivery + tipAmount + doorAmount + driverTipAmount;
  };

  // Recompute delivery fee when address or restaurant coords or subtotal change
  useEffect(() => {
    if (!summary) return;
    // Prefer selectedAddress with lat/lng
    const addrLat = selectedAddress?.latitude;
    const addrLng = selectedAddress?.longitude;
    if (typeof addrLat !== 'number' || typeof addrLng !== 'number') {
      // No coordinates → keep fee at 0; submission will block
      setSummary(prev => prev ? { ...prev, deliveryFee: 0, total: prev.subtotal + (tip || 0) + (doorFee ? 5000 : 0) } : prev);
      return;
    }
    if (!restaurantCoords) {
      setSummary(prev => prev ? { ...prev, deliveryFee: 0, total: prev.subtotal + (tip || 0) + (doorFee ? 5000 : 0) } : prev);
      return;
    }
    const km = calculateDistanceKm(Number(addrLat), Number(addrLng), restaurantCoords.lat, restaurantCoords.lng);
    const fee = calculateDeliveryFeeUtil(km);
    setSummary(prev => prev ? { ...prev, deliveryFee: fee, total: prev.subtotal + fee + (tip || 0) + (doorFee ? 5000 : 0) } : prev);
  }, [selectedAddress, restaurantCoords, cartItems, tip, doorFee]);

  const handlePaymentMethodSelect = (method: 'cash' | 'bank_transfer') => {
    setPaymentMethod(method);
  };

  const handleAddressSelect = (addressId: string) => {
    const address = userAddresses.find(addr => addr._id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setDeliveryAddress(address.addressLine);
      setSelectedAddress(address);
      
      // Set recipient name and phone from the address (now handled by useEffect)
      console.log('🔍 Selected address:', address);
      
      // Calculate distance if we have restaurant coordinates and address coordinates
      if (restaurantCoords && address.latitude && address.longitude) {
        calculateDistanceAndFee(
          restaurantCoords.lat, 
          restaurantCoords.lng,
          address.latitude,
          address.longitude
        );
      }
    }
  };

  const handleCustomAddress = () => {
    setSelectedAddressId('');
    setDeliveryAddress('');
    setSelectedAddress(null);
  };

  // Use order placement hook
  const { placeOrder, isLoading: orderLoading } = useOrderPlacement({
    restaurantId,
    cartItems,
    paymentMethod,
    selectedAddress,
    deliveryAddress,
    recipientName,
    recipientPhone,
    specialInstructions,
    deliveryMode,
    scheduledAt,
    tip,
    doorFee,
    driverTip,
    voucherCode,
    deliveryFee: distanceCalculated ? deliveryFee : calculateDeliveryFeeUtil(0),
    restaurantCoords,
    autoNavigate: false
  });

  const payWithWallet = async () => {
    if (!summary) return;
    try {
      // Kiểm tra số dư ví
      const balanceResp = await apiClient.get('/api/v1/customer/wallet/balance') as { balance: number };
      const total = summary.total;
      if (!balanceResp || typeof balanceResp.balance !== 'number') {
        showToast('Không lấy được số dư ví', 'error');
        return;
      }
      if (balanceResp.balance < total) {
        showToast('Số dư không đủ. Vui lòng nạp thêm.', 'info');
        // Điều hướng sang trang ví để nạp
        router.push('/customer/wallet');
        return;
      }

      // Không tạo đơn ở bước chọn phương thức
      showToast('Ví đủ số dư. Nhấn "Đặt đơn" để thanh toán.', 'success');
    } catch (e: any) {
      console.error('payWithWallet error:', e);
      showToast(e?.message || 'Lỗi thanh toán ví', 'error');
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {restaurantInfo?.imageUrl ? (
                      <img
                        src={restaurantInfo.imageUrl}
                        alt={restaurantInfo.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {restaurantInfo?.name || cartItems[0]?.restaurant?.name || 'Đơn hàng của bạn'}
                    </h2>
                    {restaurantInfo?.address && (
                      <p className="text-sm text-gray-600">{restaurantInfo.address}</p>
                    )}
                  </div>
                </div>
                
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
                        <h3 className="font-semibold text-gray-900">{group.restaurant.name}</h3>
                      </div>
                      
                      {group.items.map((item, index) => (
                        <div key={`${item.id}-${index}-${JSON.stringify(item.options || [])}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg ml-4">
                          {/* Số thứ tự bên trái */}
                          <ItemNumber number={index + 1} />
                          
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
                            
                            {/* Display options if available */}
                            {item.options && item.options.length > 0 && (
                              <CartItemOptions options={item.options} />
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {item.totalPrice.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Tổng số món */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Tổng số món:</span>
                    <span className="text-lg font-bold text-blue-900">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)} món
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{calculateTotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí giao hàng:</span>
                    <span>
                      {distanceCalculated ? (
                        deliveryFee === 0 ? 'Miễn phí' : `${deliveryFee.toLocaleString('vi-VN')}đ`
                      ) : (
                        calculateDeliveryFeeUtil(0) === 0 ? 'Miễn phí' : `${calculateDeliveryFeeUtil(0).toLocaleString('vi-VN')}đ`
                      )}
                    </span>
                  </div>
                  
                  {/* Distance info */}
                  {distanceCalculated && (
                    <div className="flex justify-between text-gray-500 text-sm">
                      <span>Khoảng cách:</span>
                      <span>{distance.toFixed(2)} km</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Phí dịch vụ:</span>
                    <span>0đ</span>
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
                  {/* Current selected address display */}
                  {selectedAddress && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{selectedAddress.label}</span>
                            <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full font-medium">
                              Địa chỉ hiện tại
                            </span>
                          </div>
                          
                          {/* Recipient info */}
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-600 text-sm">👤</span>
                              <span className="text-gray-900 text-sm font-medium">
                                {selectedAddress.recipientName || 'Chưa có tên'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 text-sm">📞</span>
                              <span className="text-gray-700 text-sm">
                                {selectedAddress.phone || 'Chưa có số điện thoại'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 text-sm mb-1">{selectedAddress.addressLine}</p>
                          {selectedAddress.note && (
                            <p className="text-gray-600 text-xs">Ghi chú: {selectedAddress.note}</p>
                          )}
                          
                          {/* Distance and delivery info */}
                          {distanceLoading && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex items-center gap-2 text-sm text-yellow-700">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                <span>Đang tính khoảng cách và phí giao hàng...</span>
                              </div>
                            </div>
                          )}
                          
                          {distanceCalculated && !distanceLoading && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-600 font-medium">Khoảng cách:</span>
                                  <span className="ml-1 text-gray-900">{distance.toFixed(2)} km</span>
                                </div>
                                <div>
                                  <span className="text-blue-600 font-medium">Thời gian giao:</span>
                                  <span className="ml-1 text-gray-900">{deliveryTime} phút</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowAddressModal(true)}
                          className="ml-3 px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          Thay đổi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Address selection button */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn địa chỉ giao hàng *
                    </label>
                    
                    {userAddresses.length > 0 ? (
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">📍</span>
                          <span className="text-gray-700 font-medium">
                            {selectedAddress ? 'Chọn địa chỉ khác' : 'Chọn địa chỉ giao hàng'}
                          </span>
                        </div>
                      </button>
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

              {/* Driver Tip & Door Fee */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thưởng cho tài xế</h2>
                
                <div className="space-y-4">
                  {/* Driver Tip */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Thưởng cho tài xế
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 0, label: 'Chưa có' },
                        { value: 5000, label: '5k' },
                        { value: 10000, label: '10k' },
                        { value: -1, label: 'Khác' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (option.value === -1) {
                              setShowTipDialog(true);
                            } else {
                              setDriverTip(option.value);
                              setCustomTip('');
                            }
                          }}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            (option.value === -1 && customTip) || 
                            (option.value !== -1 && driverTip === option.value)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-medium">{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Door Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Giao tận cửa (+5k)
                    </label>
                    <button
                      onClick={() => setDoorFee(!doorFee)}
                      className={`w-full p-3 rounded-lg border-2 transition-colors ${
                        doorFee
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">🚪</span>
                        <span className="text-sm font-medium">
                          {doorFee ? 'Đã bật giao tận cửa' : 'Bật giao tận cửa'}
                        </span>
                      </div>
                    </button>
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
                    onClick={() => {
                      handlePaymentMethodSelect('bank_transfer');
                      // Thử thanh toán ngay bằng ví nếu đủ số dư
                      setTimeout(payWithWallet, 0);
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">👛</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Ví EatNow</p>
                        <p className="text-sm text-gray-600">Trừ trực tiếp từ ví nếu đủ số dư</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="pb-24">
                <button
                  onClick={async () => {
                    try {
                      if (!summary) { showToast('Thiếu tổng tiền', 'error'); return; }
                      if (!paymentMethod) { showToast('Chọn phương thức thanh toán', 'error'); return; }

                      // Nếu chọn Ví EatNow (bank_transfer) → kiểm tra số dư rồi mới tạo đơn + trừ ví
                      if (paymentMethod === 'bank_transfer') {
                        const total = summary.total;
                        const balanceResp = await apiClient.get('/api/v1/customer/wallet/balance') as { balance: number };
                        if (!balanceResp || typeof balanceResp.balance !== 'number') {
                          showToast('Không lấy được số dư ví', 'error');
                          return;
                        }
                        if (balanceResp.balance < total) {
                          showToast('Số dư không đủ. Vui lòng nạp thêm.', 'info');
                          router.push('/customer/wallet');
                          return;
                        }
                      }

                      // Tạo đơn (không auto navigate)
                      const order: any = await placeOrder();
                      if (!order || !order._id) {
                        showToast('Tạo đơn thất bại', 'error');
                        return;
                      }

                      if (paymentMethod === 'bank_transfer') {
                        // Gọi thanh toán bằng ví
                        const payResp = await apiClient.post('/api/v1/payment/order', {
                          method: 'wallet',
                          orderId: order._id,
                          orderCode: order.code,
                          amount: summary.total,
                          restaurantId
                        }) as { success?: boolean; needDeposit?: boolean; message?: string };

                        if (payResp?.success) {
                          showToast('Thanh toán bằng ví thành công', 'success');
                          router.push(`/customer/orders/${order._id}`);
                          return;
                        }
                        if (payResp?.needDeposit) {
                          showToast('Số dư không đủ. Vui lòng nạp thêm.', 'info');
                          router.push('/customer/wallet');
                          return;
                        }

                        showToast(payResp?.message || 'Thanh toán ví thất bại', 'error');
                        return;
                      }

                      // Tiền mặt: điều hướng như flow mặc định
                      router.push(`/customer/orders/${order._id}`);
                    } catch (err: any) {
                      console.error('Place order error:', err);
                      showToast(err?.message || 'Lỗi đặt hàng', 'error');
                    }
                  }}
                  disabled={orderLoading || !paymentMethod}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
                >
                  {orderLoading ? (
                    'Đang xử lý...'
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Đặt đơn</span>
                      <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                        {calculateFinalTotal().toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Tip Dialog */}
      {showTipDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhập số tiền thưởng</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền (nghìn đồng)
                </label>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="Nhập số tiền thưởng..."
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Ví dụ: 15 = 15,000đ</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTipDialog(false);
                    setCustomTip('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const amount = parseInt(customTip) * 1000;
                    if (amount > 0) {
                      setDriverTip(amount);
                    }
                    setShowTipDialog(false);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Chọn địa chỉ giao hàng</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
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
                      onClick={() => {
                        handleAddressSelect(address._id);
                        setShowAddressModal(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Mặc định
                              </span>
                            )}
                          </div>
                          
                          {/* Recipient info in modal */}
                          <div className="mt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-500 text-xs">👤</span>
                              <span className="text-gray-700 text-xs">
                                {address.recipientName || 'Chưa có tên'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-xs">📞</span>
                              <span className="text-gray-600 text-xs">
                                {address.phone || 'Chưa có số điện thoại'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mt-2">{address.addressLine}</p>
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
                    onClick={() => {
                      handleCustomAddress();
                      setShowAddressModal(false);
                    }}
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
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-gray-600 mb-4">Chưa có địa chỉ nào được lưu</p>
                  <button
                    onClick={() => {
                      router.push('/customer/profile');
                      setShowAddressModal(false);
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Thiết lập địa chỉ ngay →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <OrderNotification />
    </main>
  );
}