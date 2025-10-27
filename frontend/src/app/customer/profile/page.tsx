"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/api.client";
import { useToast } from "@/components";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faWallet, faHeart, faUser, faEdit, faTrash, faPlus, faStar, faPhone, faStickyNote, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

interface AddressForm {
  label: string;
  phone: string;
  addressLine: string;
  note?: string;
  recipientName?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface WalletInfo {
  balance: number;
  transactions: any[];
}

interface FavoriteRestaurant {
  _id: string;
  name: string;
  address: string;
  imageUrl?: string;
  rating: number;
  cuisine: string;
}

export default function CustomerProfilePage() {
  const { showToast } = useToast();
  const { user, logout } = useCustomerAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'addresses' | 'wallet' | 'favorites'>('addresses');
  const [loading, setLoading] = useState(true);
  
  // Address management
  const [addresses, setAddresses] = useState<AddressForm[]>([]);
  const [addressLabels, setAddressLabels] = useState<string[]>(['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác']);
  const [form, setForm] = useState<AddressForm>({ label: "Nhà", phone: "", addressLine: "", note: "", recipientName: "", latitude: undefined, longitude: undefined, isDefault: false });
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  
  // Wallet management
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({ balance: 0, transactions: [] });
  
  // Favorites management
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        // Load Leaflet CSS if not already loaded
        if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(cssLink);
        }
        
        // Load addresses and address labels
        const profile = await apiClient.get<any>(`/api/v1/customer/profile`);
        setAddresses(profile.addresses || []);
        setAddressLabels(profile.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác']);
        
        // Load wallet info
        try {
          const wallet = await apiClient.get<any>(`/api/v1/wallet/balance`);
          setWalletInfo({ balance: wallet.balance || 0, transactions: wallet.transactions || [] });
        } catch (e) {
          // Wallet not available
        }
        
        // Load favorite restaurants
        try {
          const favorites = await apiClient.get<any>(`/api/v1/customer/favorites`);
          setFavoriteRestaurants(favorites || []);
        } catch (e) {
          // Favorites not available
        }

        // Get user's current location ONCE when page loads
        if (navigator.geolocation) {
          showToast('Đang lấy vị trí của bạn...', 'info');
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Auto-generate address from current location
              const generatedAddress = await getAddressFromCoordinates(latitude, longitude);
              if (generatedAddress) {
                setForm(prev => ({
                  ...prev,
                  latitude,
                  longitude,
                  addressLine: generatedAddress
                }));
                showToast('Đã lấy vị trí và tạo địa chỉ tự động', 'success');
              } else {
                setForm(prev => ({
                  ...prev,
                  latitude,
                  longitude
                }));
                showToast('Đã lấy vị trí, vui lòng nhập địa chỉ thủ công', 'info');
              }
              
              // Map will be initialized automatically by useEffect when form.latitude/longitude change
            },
            (error) => {
              console.error('Geolocation error:', error);
              showToast('Không thể lấy vị trí. Vui lòng chọn vị trí thủ công trên bản đồ.', 'error');
              // Map will be initialized with default location
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          );
        } else {
          showToast('Trình duyệt không hỗ trợ định vị. Vui lòng chọn vị trí thủ công trên bản đồ.', 'error');
          // Map will be initialized with default location
        }
        
      } catch (e) {
        console.error('Error loading profile data:', e);
        showToast('Không thể tải thông tin tài khoản', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Initialize mini maps for addresses
  useEffect(() => {
    if (typeof window !== 'undefined' && addresses.length > 0) {
      const initMiniMaps = () => {
        const L = (window as any).L;

        if (L) {
          addresses.forEach((address: any, idx: number) => {
            if (typeof address.latitude === 'number' && typeof address.longitude === 'number') {
              const mapElement = document.getElementById(`mini-map-${idx}`) as any;
              if (mapElement && !mapElement._map) {
                // Initialize mini map
                const miniMap = L.map(`mini-map-${idx}`, {
                  zoomControl: false,
                  attributionControl: false,
                  dragging: false,
                  touchZoom: false,
                  doubleClickZoom: false,
                  scrollWheelZoom: false,
                  boxZoom: false,
                  keyboard: false
                }).setView([address.latitude, address.longitude], 15);

                mapElement._map = miniMap;

                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: ''
                }).addTo(miniMap);

                // Add marker
                L.marker([address.latitude, address.longitude], {
                  icon: L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                  })
                }).addTo(miniMap);

                // Hide fallback content when map loads
                const fallbackContent = mapElement.querySelector('.absolute');
                if (fallbackContent) {
                  fallbackContent.style.display = 'none';
                }
              }
            }
          });
        } else {
          setTimeout(initMiniMaps, 100);
        }
      };

      // Try to initialize immediately
      initMiniMaps();
    }
  }, [addresses]);

  const initMiniMap = () => {
    if (!mapRef.current) {
      console.log('❌ Map ref not available');
      return;
    }
    
    console.log('🗺️ Starting map initialization...');
    
    // Load Leaflet CSS and JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        // Check if already loaded
        if ((window as any).L) {
          console.log('✅ Leaflet already loaded');
          resolve((window as any).L);
          return;
        }
        
        console.log('📦 Loading Leaflet...');
        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
        
        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          console.log('✅ Leaflet loaded successfully');
          resolve((window as any).L);
        };
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then((L: any) => {
      if (!mapRef.current) {
        console.log('❌ Map ref lost during Leaflet loading');
        return;
      }
      
      const el = mapRef.current;
      console.log('🗺️ Map container found:', el);
      
      // Clean up existing map if it exists
      if ((el as any)._map) {
        console.log('🧹 Cleaning up existing map');
        (el as any)._map.remove();
        (el as any)._map = null;
      }
      
      // Clear container content
      el.innerHTML = "";
      
      // Use user's location if available, otherwise default to Ho Chi Minh City
      const defaultLat = form.latitude || 10.8231;
      const defaultLng = form.longitude || 106.6297;
      const zoom = form.latitude ? 16 : 13; // Zoom in more if user location is available
      
      console.log('🗺️ Initializing main map at:', defaultLat, defaultLng, 'zoom:', zoom);
      
      const map = L.map(el).setView([defaultLat, defaultLng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // Add marker if user location is available
      if (form.latitude && form.longitude) {
        console.log('📍 Adding marker at:', form.latitude, form.longitude);
        markerRef.current = L.marker([form.latitude, form.longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #f97316; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        console.log('🗺️ Map clicked at:', lat, lng);
        setForm(prev => ({ 
          ...prev, 
          latitude: Number(lat.toFixed(6)), 
          longitude: Number(lng.toFixed(6)) 
        }));
        
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #f97316; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);
      });

      // Note: We don't show existing addresses on the main map
      // The main map is only for selecting new address location

      (el as any)._map = map;
      setMapInitialized(true);
      console.log('✅ Map initialized successfully');
    }).catch((error: any) => {
      console.error('❌ Map initialization failed:', error);
    });
  };

  useEffect(() => {
    // Initialize map when we have user location and map hasn't been initialized yet
    if (form.latitude && form.longitude && !mapInitialized) {
      console.log('🗺️ Initializing map with user location:', form.latitude, form.longitude);
      initMiniMap();
    }
    
    return () => {
      // Don't cleanup map here - let it persist
    };
  }, [form.latitude, form.longitude, mapInitialized]); // Re-run when location changes

  // Initialize map with default location if no geolocation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only initialize if we still don't have location AND map hasn't been initialized yet
      if (!form.latitude && !form.longitude && !mapInitialized && mapRef.current) {
        console.log('🗺️ Initializing map with default location (no geolocation)');
        initMiniMap();
      }
    }, 2000); // Wait 2 seconds for geolocation to complete

    return () => clearTimeout(timer);
  }, [mapInitialized]); // Re-run when mapInitialized changes

  // Cleanup map when component unmounts
  useEffect(() => {
    return () => {
      if (mapRef.current && (mapRef.current as any)._map) {
        (mapRef.current as any)._map.remove();
      }
    };
  }, []); // Only run on unmount

  // Reverse geocoding function
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Format address for Vietnam
        const address = data.display_name
          .split(',')
          .map((part: string) => part.trim())
          .filter((part: string) => part.length > 0)
          .slice(0, -3) // Remove country, continent
          .join(', ');
        
        return address;
      }
      return '';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return '';
    }
  };

  const handleSave = async () => {
    try {
      if (!form.label.trim() || !form.phone.trim() || !/^0\d{9,10}$/.test(form.phone.trim())) {
        showToast('Vui lòng nhập đầy đủ nhãn và số điện thoại hợp lệ', 'error');
        return;
      }
      if (typeof form.latitude !== 'number' || typeof form.longitude !== 'number') {
        showToast('Vui lòng chọn vị trí trên bản đồ', 'error');
        return;
      }
      
      // Auto-generate address from coordinates if not provided
      let finalAddressLine = form.addressLine;
      if (!finalAddressLine || finalAddressLine.trim() === '') {
        showToast('Đang tạo địa chỉ từ vị trí...', 'info');
        const generatedAddress = await getAddressFromCoordinates(form.latitude, form.longitude);
        if (generatedAddress) {
          finalAddressLine = generatedAddress;
          setForm(prev => ({ ...prev, addressLine: generatedAddress }));
          showToast('Đã tự động tạo địa chỉ từ vị trí', 'success');
        } else {
          showToast('Không thể tạo địa chỉ từ vị trí. Vui lòng nhập thủ công.', 'error');
          return;
        }
        }
        
        // Confirm dialog before saving
        const confirmMessage = `Xác nhận thông tin địa chỉ:\n\n` +
          `📍 Nhãn: ${form.label}\n` +
          `👤 Người nhận: ${form.recipientName || 'Chưa có'}\n` +
          `📞 SĐT: ${form.phone}\n` +
          `🏠 Địa chỉ: ${finalAddressLine}\n` +
          `📝 Ghi chú: ${form.note || 'Không có'}\n` +
          `🗺️ Vị trí: ${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)}\n\n` +
          `Bạn có chắc chắn muốn lưu địa chỉ này?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
        
        const addressData = {
          label: form.label,
          phone: form.phone,
          addressLine: finalAddressLine,
          note: form.note,
          recipientName: form.recipientName,
          latitude: form.latitude,
          longitude: form.longitude,
          isDefault: Boolean(form.isDefault)
        };
      
      const response = await apiClient.post(`/api/v1/customer/addresses`, addressData);
      // Address saved successfully
      
      showToast('Đã lưu địa chỉ thành công', 'success');
      
      // Reset form
      setForm({ label: "Nhà", phone: "", addressLine: "", note: "", recipientName: "", latitude: undefined, longitude: undefined, isDefault: false });
      
      // Reload addresses
      const profile = await apiClient.get<any>(`/api/v1/customer/profile`);
      setAddresses(profile.addresses || []);
      
    } catch (e) {
      console.error('Error saving address:', e);
      showToast('Không thể lưu địa chỉ', 'error');
    }
  };

  // Wallet functions
  const handleTopUp = async (amount: number) => {
    try {
      await apiClient.post(`/api/v1/wallet/topup`, { amount });
      showToast(`Đã nạp ${amount.toLocaleString()}đ vào ví`, 'success');
      
      // Reload wallet
      const wallet = await apiClient.get<any>(`/api/v1/wallet/balance`);
      setWalletInfo({ balance: wallet.balance || 0, transactions: wallet.transactions || [] });
    } catch (e) {
      console.error('Error topping up wallet:', e);
      showToast('Không thể nạp tiền vào ví', 'error');
    }
  };

  // Favorites functions
  const handleRemoveFavorite = async (restaurantId: string) => {
    try {
      await apiClient.delete(`/api/v1/customer/favorites/${restaurantId}`);
      showToast('Đã xóa khỏi danh sách yêu thích', 'success');
      
      // Reload favorites
      const favorites = await apiClient.get<any>(`/api/v1/customer/favorites`);
      setFavoriteRestaurants(favorites || []);
    } catch (e) {
      console.error('Error removing favorite:', e);
      showToast('Không thể xóa khỏi danh sách yêu thích', 'error');
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await logout();
      showToast('Đã đăng xuất thành công', 'success');
      router.push('/customer/login');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Có lỗi xảy ra khi đăng xuất', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-20">
        {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="text-2xl text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.name || 'Tài khoản của tôi'}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'addresses' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
          <span>Địa chỉ</span>
        </button>
            <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'wallet' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
          <span>Ví điện tử</span>
            </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
            activeTab === 'favorites' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FontAwesomeIcon icon={faHeart} className="w-4 h-4" />
          <span>Yêu thích</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'addresses' && (
            <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Địa chỉ của tôi</h2>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn *</label>
                <select 
                  value={form.label} 
                  onChange={(e) => setForm({...form, label: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                >
                  {addressLabels.map((label) => (
                    <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên người nhận *</label>
                <input 
                  value={form.recipientName || ''} 
                  onChange={(e) => setForm({...form, recipientName: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  placeholder="Tên người nhận hàng" 
                />
            </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input 
                  value={form.phone} 
                  onChange={(e) => setForm({...form, phone: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  placeholder="0123456789" 
                />
            </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                <textarea 
                  value={form.addressLine} 
                  onChange={(e) => setForm({...form, addressLine: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  rows={3}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
            </div>
              
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input 
                  value={form.note} 
                  onChange={(e) => setForm({...form, note: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                  placeholder="Hướng dẫn giao hàng (tùy chọn)" 
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={form.isDefault} 
                  onChange={(e) => setForm({...form, isDefault: e.target.checked})} 
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" 
                />
                <label className="ml-2 text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
            </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Lưu địa chỉ
              </button>
            </div>

            {/* Map */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn vị trí trên bản đồ</h3>
                <div 
                  ref={mapRef} 
                  className="w-full h-64 rounded-lg border relative z-10"
                  style={{ minHeight: '256px' }}
                />
              {form.latitude && form.longitude && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Vị trí đã chọn:</span> {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </div>
              )}
            </div>
          </div>

          {/* Address List */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách địa chỉ</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-500 text-sm">Đang tải...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📍</span>
          </div>
                <p className="text-sm">Chưa có địa chỉ nào</p>
                <p className="text-xs text-gray-400 mt-1">Thêm địa chỉ để dễ dàng đặt hàng</p>
        </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((a: any, idx: number) => {
                  // Address data loaded
                  return (
                  <div key={idx} className="p-4 rounded-lg border bg-white hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
              <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-semibold text-gray-900 text-lg">{a.label}</span>
                          {a.isDefault && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                      Mặc định
                    </span>
                  )}
                </div>
                        
                        {/* Thông tin người nhận */}
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-gray-500" />
                          <span className="text-sm font-medium text-gray-800">
                            {a.recipientName || 'Chưa có tên người nhận'}
                          </span>
                        </div>
                        
                        {/* Số điện thoại */}
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faPhone} className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-700">{a.phone}</span>
                        </div>
                        
                        {/* Địa chỉ */}
                        <div className="flex items-start gap-2 mb-3">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 text-gray-500 mt-0.5" />
                          <span className="text-sm text-gray-800 leading-relaxed">{a.addressLine}</span>
                        </div>
                        
                        {/* Ghi chú */}
                        {a.note && (
                          <div className="flex items-start gap-2 mb-3">
                            <FontAwesomeIcon icon={faStickyNote} className="w-3 h-3 text-gray-500 mt-0.5" />
                            <span className="text-xs text-gray-600 italic">{a.note}</span>
                          </div>
                        )}
                        
                        {/* Map nhỏ với icon vị trí */}
                        {typeof a.latitude === 'number' && typeof a.longitude === 'number' && (
                          <div className="mt-3">
                            <div 
                              className="w-full h-24 rounded-lg border overflow-hidden bg-gray-100 relative z-10"
                              id={`mini-map-${idx}`}
                              style={{ minHeight: '96px' }}
                            >
                              {/* Fallback content if map fails to load */}
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                                <div className="text-center">
                                  <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div>
                                  <div>Vị trí đã chọn</div>
                                  <div className="text-xs text-gray-400">
                                    {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                )}
              </div>
                      <div className="flex flex-col gap-1 ml-3">
                <button
                          onClick={() => {
                            setForm({
                              label: a.label,
                              phone: a.phone,
                              addressLine: a.addressLine,
                              note: a.note || '',
                              recipientName: a.recipientName || '',
                              latitude: a.latitude,
                              longitude: a.longitude,
                              isDefault: a.isDefault
                            });
                            // Focus on map to show location
                            if (mapRef.current && (mapRef.current as any)._map) {
                              const map = (mapRef.current as any)._map;
                              if (a.latitude && a.longitude) {
                                map.setView([a.latitude, a.longitude], 15);
                                if (markerRef.current) {
                                  map.removeLayer(markerRef.current);
                                }
                                markerRef.current = (window as any).L.marker([a.latitude, a.longitude]).addTo(map);
                              }
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Xem trên bản đồ
                </button>
                <button
                          onClick={async () => {
                            if (confirm('Xóa địa chỉ này?')) {
                              try {
                                await apiClient.delete(`/api/v1/customer/addresses/${idx}`);
                                showToast('Đã xóa địa chỉ', 'success');
                                
                                // Reload addresses
                                const profile = await apiClient.get<any>(`/api/v1/customer/profile`);
                                setAddresses(profile.addresses || []);
                              } catch (e) {
                                console.error('Error deleting address:', e);
                                showToast('Không thể xóa địa chỉ', 'error');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
                  );
                })}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Ví điện tử</h2>
        </div>

          <div className="bg-white rounded-xl border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
        <div>
                <h3 className="text-lg font-semibold text-gray-900">Số dư hiện tại</h3>
                <p className="text-3xl font-bold text-orange-600">{walletInfo.balance.toLocaleString()}đ</p>
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faWallet} className="text-2xl text-orange-600" />
          </div>
        </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTopUp(50000)}
                className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <div className="text-sm text-gray-600">Nạp</div>
                <div className="font-semibold">50.000đ</div>
              </button>
              <button
                onClick={() => handleTopUp(100000)}
                className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <div className="text-sm text-gray-600">Nạp</div>
                <div className="font-semibold">100.000đ</div>
              </button>
              <button
                onClick={() => handleTopUp(200000)}
                className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <div className="text-sm text-gray-600">Nạp</div>
                <div className="font-semibold">200.000đ</div>
              </button>
          <button
                onClick={() => handleTopUp(500000)}
                className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
                <div className="text-sm text-gray-600">Nạp</div>
                <div className="font-semibold">500.000đ</div>
          </button>
        </div>
          </div>
          
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử giao dịch</h3>
            {walletInfo.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faWallet} className="text-2xl text-gray-400" />
        </div>
                <p className="text-sm">Chưa có giao dịch nào</p>
          </div>
            ) : (
              <div className="space-y-3">
                {walletInfo.transactions.map((tx: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{tx.description || 'Giao dịch'}</div>
                      <div className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</div>
        </div>
                    <div className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}đ
        </div>
      </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Quán yêu thích</h2>
          </div>
          
          {favoriteRestaurants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faHeart} className="text-3xl text-gray-400" />
              </div>
              <p className="text-lg font-medium mb-2">Chưa có quán yêu thích</p>
              <p className="text-sm text-gray-400">Khám phá và thêm quán vào danh sách yêu thích</p>
              <button
                onClick={() => router.push('/customer/home')}
                className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Khám phá ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteRestaurants.map((restaurant) => (
                <div key={restaurant._id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    {restaurant.imageUrl ? (
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faHeart} className="text-3xl text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFavorite(restaurant._id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-red-500 text-sm" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{restaurant.cuisine}</span>
                      <div className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-sm" />
                        <span className="text-sm font-medium">{restaurant.rating}</span>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}