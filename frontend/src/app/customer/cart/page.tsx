"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useApi";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { cartService } from "@/services/cart.service";
import { userService } from "@/services/user.service";
import { apiClient } from "@/services/api.client";

export default function CartPage() {
  const { user } = useCustomerAuth();
  const router = useRouter();
  // Use cookie-based authentication instead of localStorage
  const token = user ? 'cookie-auth' : null; // Dummy token for cookie auth
  const { data: cartData, loading: cartLoading, error: cartError } = useCart(token);
  
  // Debug logs
  console.log('Cart page data:', {
    user,
    token: token ? 'exists' : 'missing',
    cartData,
    cartLoading,
    cartError
  });
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ subtotal: number; deliveryFee: number; serviceFee: number; total: number }>({ subtotal: 0, deliveryFee: 0, serviceFee: 0, total: 0 });
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [promoCode, setPromoCode] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [deliveryFees, setDeliveryFees] = useState<{[key: string]: number}>({});
  const [deliveryDistances, setDeliveryDistances] = useState<{[key: string]: number}>({});

  // Load cart data from database
  useEffect(() => {
    console.log('Cart data received:', cartData);
    if (cartData && Array.isArray(cartData)) {
      setCartItems(cartData);
    } else if (cartData && (cartData as any).items && Array.isArray((cartData as any).items)) {
      setCartItems((cartData as any).items);
    } else {
      setCartItems([]);
    }
  }, [cartData]);

  // Load summary and address
  useEffect(() => {
    const load = async () => {
      try {
        const s = await cartService.getCartSummary('cookie-auth');
        // Accept both direct object or wrapped
        const subtotal = (s as any)?.subtotal ?? 0;
        const deliveryFee = (s as any)?.deliveryFee ?? 0;
        const serviceFee = (s as any)?.serviceFee ?? 0;
        const total = (s as any)?.total ?? (subtotal + deliveryFee + serviceFee);
        setSummary({ subtotal, deliveryFee, serviceFee, total });
      } catch (e) {
        // Fallback client-side
        const fallbackSubtotal = cartItems.reduce((total, item) => total + (item.subtotal || (item.item?.price * item.quantity) || 0), 0);
        const deliveryFee = 15000; // fallback default
        const serviceFee = 5000;   // fallback default
        setSummary({ subtotal: fallbackSubtotal, deliveryFee, serviceFee, total: fallbackSubtotal + deliveryFee + serviceFee });
      }
      try {
        const profile = await userService.getProfile();
        const addresses = profile.addresses || [];
        setUserAddresses(addresses);
        const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
          setDeliveryAddress(defaultAddr.addressLine);
        }
      } catch {}
    };
    if (user) load();
  }, [user, cartItems.length]);

  // Calculate delivery fees when address changes
  useEffect(() => {
    calculateAllDeliveryFees();
  }, [selectedAddress, customAddress, cartItems]);

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!token) return;
    
    if (newQuantity <= 0) {
      await removeItem(cartItemId);
      return;
    }
    
    try {
      await cartService.updateCartItem(cartItemId, { quantity: newQuantity }, token);
      // Refresh cart data
      window.location.reload();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Có lỗi xảy ra khi cập nhật số lượng');
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!token) return;
    
    try {
      await cartService.removeFromCart(cartItemId, token);
      // Refresh cart data
      window.location.reload();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Có lỗi xảy ra khi xóa món ăn');
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.subtotal || (item.item?.price * item.quantity) || 0), 0);
  };

  const getTotalDeliveryFee = () => {
    return Object.values(deliveryFees).reduce((total, fee) => total + fee, 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const deliveryFee = getTotalDeliveryFee();
    const serviceFee = summary.serviceFee || 0;
    return subtotal + deliveryFee + serviceFee;
  };

  const groupItemsByRestaurant = () => {
    const groups: { [key: string]: any[] } = {};
    cartItems.forEach(item => {
      // Ensure we have restaurant ID - this is critical for order separation
      const restaurantId = item.restaurant?.id || item.restaurantId;
      const restaurantName = item.restaurant?.name || item.restaurantName;
      
      if (!restaurantId) {
        console.error('Missing restaurant ID for item:', item);
        return; // Skip items without restaurant ID
      }
      
      // Use restaurant ID as primary key to ensure proper separation
      const key = restaurantId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    console.log('Restaurant groups:', Object.keys(groups).map(key => ({
      restaurantId: key,
      itemCount: groups[key].length,
      restaurantName: groups[key][0]?.restaurant?.name || groups[key][0]?.restaurantName
    })));
    
    return groups;
  };

  const restaurantGroups = groupItemsByRestaurant();

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Calculate delivery fee based on distance
  const calculateDeliveryFee = (distance: number): number => {
    if (distance <= 3) {
      return 0; // Free delivery within 3km
    } else {
      const extraDistance = distance - 3;
      const extraFee = Math.ceil(extraDistance / 5) * 5000; // 5k per 5km block
      return extraFee;
    }
  };

  // Calculate delivery fees and distances for all restaurants
  const calculateAllDeliveryFees = () => {
    if (!selectedAddress && !customAddress.trim()) {
      console.log('No address selected, skipping delivery fee calculation');
      return;
    }

    if (cartItems.length === 0) {
      console.log('No cart items, skipping delivery fee calculation');
      return;
    }

    const userCoords = selectedAddress?.coordinates || { lat: 0, lng: 0 };
    const currentRestaurantGroups = groupItemsByRestaurant();
    
    const newDeliveryFees: {[key: string]: number} = {};
    const newDeliveryDistances: {[key: string]: number} = {};
    
    console.log('Calculating delivery fees for restaurants:', Object.keys(currentRestaurantGroups));
    
    Object.entries(currentRestaurantGroups).forEach(([restaurantKey, items]) => {
      const restaurant = items[0].restaurant;
      if (restaurant?.coordinates) {
        const distance = calculateDistance(
          userCoords.lat,
          userCoords.lng,
          restaurant.coordinates.lat,
          restaurant.coordinates.lng
        );
        newDeliveryDistances[restaurantKey] = distance;
        newDeliveryFees[restaurantKey] = calculateDeliveryFee(distance);
        console.log(`Restaurant ${restaurantKey}: distance=${distance}km, fee=${newDeliveryFees[restaurantKey]}đ`);
      } else {
        // Fallback: assume 5km distance if no coordinates
        newDeliveryDistances[restaurantKey] = 5;
        newDeliveryFees[restaurantKey] = 5000;
        console.log(`Restaurant ${restaurantKey}: no coordinates, using fallback distance=5km, fee=5000đ`);
      }
    });
    
    setDeliveryFees(newDeliveryFees);
    setDeliveryDistances(newDeliveryDistances);
    console.log('Delivery fees calculated:', newDeliveryFees);
  };

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Simple alert for now, can be replaced with a proper toast library
    alert(message);
  };

  // Handle address selection
  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
    setDeliveryAddress(address.addressLine);
    setShowAddressModal(false);
  };

  // Handle custom address input
  const handleCustomAddress = () => {
    if (customAddress.trim()) {
      const customAddr = {
        addressLine: customAddress.trim(),
        isDefault: false,
        label: 'Địa chỉ tùy chỉnh'
      };
      setSelectedAddress(customAddr);
      setDeliveryAddress(customAddress.trim());
      setShowAddressModal(false);
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đặt hàng', 'error');
      return;
    }

    if (!selectedAddress && !customAddress.trim()) {
      showToast('Vui lòng chọn địa chỉ giao hàng', 'error');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Giỏ hàng trống', 'error');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Group items by restaurant
      const restaurantGroups = groupItemsByRestaurant();
      
      // Create orders for each restaurant - CRITICAL: Each restaurant gets separate order
      const orderPromises = Object.entries(restaurantGroups).map(async ([restaurantId, items]) => {
        const restaurantName = items[0].restaurant?.name || items[0].restaurantName;
        
        // Calculate totals for THIS restaurant only
        const subtotal = items.reduce((total, item) => {
          const itemSubtotal = item.subtotal || (item.item?.price * item.quantity) || (item.price * item.quantity);
          return total + (itemSubtotal || 0);
        }, 0);
        
        // Ensure delivery fee is calculated
        let deliveryFee = Number(deliveryFees[restaurantId]) || 0;
        
        // If delivery fee is not calculated, calculate it now
        if (deliveryFee === 0 && (selectedAddress || customAddress.trim())) {
          const restaurant = items[0].restaurant;
          if (restaurant?.coordinates) {
            const userCoords = selectedAddress?.coordinates || { lat: 0, lng: 0 };
            const distance = calculateDistance(
              userCoords.lat,
              userCoords.lng,
              restaurant.coordinates.lat,
              restaurant.coordinates.lng
            );
            deliveryFee = calculateDeliveryFee(distance);
            console.log(`Calculated delivery fee on-the-fly: ${deliveryFee}đ for distance ${distance}km`);
          } else {
            deliveryFee = 5000; // Fallback
            console.log(`Using fallback delivery fee: ${deliveryFee}đ`);
          }
        }
        
        const finalTotal = Number(subtotal) + Number(deliveryFee);
        
        // Validate calculations
        if (isNaN(subtotal) || isNaN(deliveryFee) || isNaN(finalTotal)) {
          console.error('Invalid calculation:', { subtotal, deliveryFee, finalTotal, restaurantId });
          throw new Error(`Invalid calculation for restaurant ${restaurantId}`);
        }
        
        console.log(`Creating order for restaurant: ${restaurantName} (${restaurantId})`);
        console.log(`- Items: ${items.length}`);
        console.log(`- Subtotal: ${subtotal}đ`);
        console.log(`- Delivery fee: ${deliveryFee}đ`);
        console.log(`- Final total: ${finalTotal}đ`);
        
        const orderData = {
          restaurantId, // This ensures order goes to correct restaurant
          items: items.map(item => ({
            itemId: item.item?.id || item.itemId,
            name: item.item?.name || item.name,
            price: item.item?.price || item.price,
            quantity: item.quantity,
            subtotal: item.subtotal || (item.item?.price * item.quantity) || (item.price * item.quantity),
            specialInstructions: item.specialInstructions || ''
          })),
          deliveryAddress: selectedAddress ? {
            label: selectedAddress.label || 'Địa chỉ giao hàng',
            addressLine: selectedAddress.addressLine,
            latitude: selectedAddress.coordinates?.lat || selectedAddress.latitude || 0,
            longitude: selectedAddress.coordinates?.lng || selectedAddress.longitude || 0,
            note: selectedAddress.note || ''
          } : {
            label: 'Địa chỉ tùy chỉnh',
            addressLine: customAddress.trim(),
            latitude: 0,
            longitude: 0,
            note: ''
          },
          deliveryDistance: deliveryDistances[restaurantId] || 0,
          deliveryFee: deliveryFee,
          total: subtotal,
          paymentMethod,
          promoCode: promoCode.trim() || undefined,
          finalTotal: finalTotal
        };

        return apiClient.post(`/api/v1/orders`, orderData);
      });

      const orders = await Promise.all(orderPromises);
      
      // Show success message with detailed order information
      const orderDetails = orders.map((order: any, index: number) => {
        const restaurantGroup = Object.values(restaurantGroups)[index];
        const restaurantName = restaurantGroup?.[0]?.restaurant?.name || 
                              restaurantGroup?.[0]?.restaurantName || 
                              `Nhà hàng ${index + 1}`;
        const orderCode = order.orderCode || order.id || order._id;
        return `${restaurantName}: ${orderCode}`;
      }).join('\n');
      
      const orderCount = orders.length;
      const message = orderCount === 1 
        ? `Đặt hàng thành công!\nMã đơn hàng: ${(orders[0] as any).orderCode || (orders[0] as any).id}`
        : `Đặt hàng thành công! Tạo ${orderCount} đơn hàng:\n${orderDetails}`;
      
      showToast(message, 'success');
      
      console.log('Orders created successfully:', orders.map((order: any) => ({
        orderCode: order.orderCode || order.id,
        restaurantId: order.restaurantId,
        total: order.total,
        deliveryFee: order.deliveryFee,
        finalTotal: order.finalTotal
      })));

      // Clear cart
      try {
        await apiClient.delete(`/api/v1/cart`);
        localStorage.removeItem('cart');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }

      // Redirect to orders page after 3 seconds (longer for multiple orders)
      setTimeout(() => {
        router.push('/customer/orders');
      }, 3000);

    } catch (error: any) {
      console.error('Error placing order:', error);
      
      if (error.response?.status === 401) {
        showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        router.push('/customer/login');
      } else if (error.response?.status === 400) {
        showToast('Thông tin đơn hàng không hợp lệ. Vui lòng kiểm tra lại.', 'error');
      } else if (error.response?.status === 404) {
        showToast('Không tìm thấy nhà hàng hoặc món ăn. Vui lòng thử lại.', 'error');
      } else {
        showToast('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau.', 'error');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

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

  // No user state
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vui lòng đăng nhập
          </h1>
          <p className="text-gray-600 mb-8">
            Bạn cần đăng nhập để xem giỏ hàng
          </p>
          <Link
            href="/customer/login"
            className="inline-flex items-center px-8 py-4 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors text-lg"
          >
            <span className="mr-2">🔑</span>
            Đăng nhập ngay
          </Link>
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
          <p className="text-sm mt-2">Chi tiết lỗi: {cartError.message || 'Unknown error'}</p>
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
            href="/customer/restaurants"
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
          href="/customer/restaurants"
          className="text-orange-600 font-medium hover:text-orange-700"
        >
          Tiếp tục mua sắm
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {Object.entries(restaurantGroups).map(([restaurantKey, items]) => {
            const restaurantName = items[0].restaurant?.name || items[0].restaurantName;
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
                      <div className="flex items-center mt-1">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-green-600 font-medium">Đang mở cửa</span>
                        {deliveryDistances[restaurantKey] && (
                          <span className="text-xs text-gray-500 ml-2">
                            • {deliveryDistances[restaurantKey].toFixed(1)}km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 space-y-4">
                  {items.map((item) => {
                    const itemData = item.item || item;
                    const itemName = itemData.name;
                    const itemPrice = itemData.price;
                    const itemType = itemData.type;
                    const itemImage = itemData.imageUrl || itemData.image;
                    
                    return (
                      <div key={item.id} className="flex items-start space-x-4">
                        {/* Item Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={itemName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">
                              {itemType === 'food' ? '🍽️' : '🥤'}
                            </span>
                          )}
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {itemName}
                          </h4>
                          {item.specialInstructions && (
                            <p className="text-sm text-orange-600 mb-2">
                              Ghi chú: {item.specialInstructions}
                            </p>
                          )}
                          
                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-orange-600">
                              {itemPrice.toLocaleString('vi-VN')}đ
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
                    );
                  })}
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
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Giao đến</p>
                  <p className="text-sm text-gray-600 mb-2">
                    {deliveryAddress || 'Chưa thiết lập địa chỉ'}
                  </p>
                  <button 
                    onClick={() => setShowAddressModal(true)}
                    className="text-orange-600 text-sm hover:underline"
                  >
                    {deliveryAddress ? 'Thay đổi' : 'Chọn địa chỉ'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({cartItems.length} món)</span>
                <span>{(summary.subtotal || getSubtotal()).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí giao hàng</span>
                <span>{getTotalDeliveryFee().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí dịch vụ</span>
                <span>{(summary.serviceFee || 0).toLocaleString('vi-VN')}đ</span>
              </div>
              
              {/* Restaurant Breakdown - Shows how orders will be split */}
              {Object.keys(restaurantGroups).length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-xs text-orange-600 font-medium">
                      {Object.keys(restaurantGroups).length === 1 
                        ? 'Đơn hàng sẽ được tạo cho nhà hàng:'
                        : `Sẽ tạo ${Object.keys(restaurantGroups).length} đơn hàng riêng biệt:`
                      }
                    </p>
                  </div>
                  {Object.entries(restaurantGroups).map(([restaurantId, items], index) => {
                    const restaurantName = items[0].restaurant?.name || items[0].restaurantName;
                    const restaurantTotal = items.reduce((total, item) => total + (item.subtotal || (item.item?.price * item.quantity) || (item.price * item.quantity)), 0);
                    const restaurantDeliveryFee = deliveryFees[restaurantId] || 0;
                    const restaurantFinalTotal = restaurantTotal + restaurantDeliveryFee;
                    return (
                      <div key={restaurantId} className="bg-orange-50 rounded-lg p-2 mb-2 border border-orange-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-orange-800">
                            Đơn {index + 1}: {restaurantName}
                          </span>
                          <span className="text-xs font-bold text-orange-600">
                            {restaurantFinalTotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 ml-2">
                          <span>• {items.length} món</span>
                          <span>{restaurantTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 ml-2">
                          <span>• Khoảng cách: {deliveryDistances[restaurantId]?.toFixed(1)}km</span>
                          <span>{restaurantDeliveryFee > 0 ? `${restaurantDeliveryFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span>{getTotal().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !deliveryAddress}
              className={`w-full py-4 rounded-xl font-bold text-center transition-colors ${
                isPlacingOrder || !deliveryAddress
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {isPlacingOrder ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang đặt hàng...
                </div>
              ) : (
                'Đặt hàng ngay'
              )}
            </button>

            {/* Payment Methods */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Phương thức thanh toán</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 p-2 rounded-lg text-center transition-colors ${
                    paymentMethod === 'card' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-xs">💳</span>
                  <p className="text-xs mt-1">Thẻ</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('ewallet')}
                  className={`flex-1 p-2 rounded-lg text-center transition-colors ${
                    paymentMethod === 'ewallet' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-xs">📱</span>
                  <p className="text-xs mt-1">Ví điện tử</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 p-2 rounded-lg text-center transition-colors ${
                    paymentMethod === 'cash' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-xs">💰</span>
                  <p className="text-xs mt-1">COD</p>
                </button>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Thời gian giao hàng dự kiến: 25-35 phút</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Miễn phí giao hàng trong bán kính 3km</span>
              </div>
              {Object.keys(deliveryDistances).length > 0 && (
                <div className="flex items-center text-sm text-blue-600 mt-1">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Tổng khoảng cách: {Object.values(deliveryDistances).reduce((total, distance) => total + distance, 0).toFixed(1)}km</span>
                </div>
              )}
              {getTotalDeliveryFee() > 0 && (
                <div className="flex items-center text-sm text-orange-600 mt-1">
                  <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Phí giao hàng: 5.000đ mỗi 5km (từ km thứ 4)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Chọn địa chỉ giao hàng</h3>
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

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Saved Addresses */}
              {userAddresses.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Địa chỉ đã lưu</h4>
                  <div className="space-y-3">
                    {userAddresses.map((address, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddressSelect(address)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedAddress?.addressLine === address.addressLine
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-orange-600 text-sm">📍</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{address.label}</p>
                            <p className="text-sm text-gray-600">{address.addressLine}</p>
                            {address.city && address.ward && (
                              <p className="text-xs text-gray-500">{address.ward}, {address.city}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Address */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Địa chỉ khác</h4>
                <div className="space-y-3">
                  <textarea
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Nhập địa chỉ giao hàng..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleCustomAddress}
                    disabled={!customAddress.trim()}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      customAddress.trim()
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Sử dụng địa chỉ này
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
