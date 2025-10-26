"use client";

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faStore,
  faTruck,
  faEye,
  faEyeSlash,
  faRefresh,
  faFilter,
  faSearch,
  faLocationArrow,
  faClock,
  faUser,
  faPhone
} from '@fortawesome/free-solid-svg-icons';

interface Restaurant {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  rating: number;
  deliveryFee: number;
  phone?: string;
  imageUrl?: string;
}

interface Driver {
  _id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline' | 'busy';
  vehicleType: string;
  licensePlate: string;
  currentOrder?: {
    _id: string;
    orderNumber: string;
    customerName: string;
    restaurantName: string;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  restaurantName: string;
  customerAddress: string;
  restaurantAddress: string;
  totalAmount: number;
  createdAt: string;
  driverId?: string;
}

export default function AdminMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'restaurants' | 'drivers' | 'orders'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 21.0285, lng: 105.8542 }); // Hà Nội
  const [zoom, setZoom] = useState(12);

  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

  useEffect(() => {
    loadMapData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load restaurants
      const restaurantsRes = await fetch(`${api}/admin/restaurants?limit=100`, {
        credentials: 'include'
      });
      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json();
        const restaurantsList = Array.isArray(restaurantsData?.data) ? restaurantsData.data : [];
        setRestaurants(restaurantsList.filter((r: any) => r.latitude && r.longitude));
      }

      // Load drivers
      const driversRes = await fetch(`${api}/admin/drivers?limit=100`, {
        credentials: 'include'
      });
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        const driversList = Array.isArray(driversData?.data) ? driversData.data : [];
        setDrivers(driversList.filter((d: any) => d.latitude && d.longitude));
      }

      // Load active orders
      const ordersRes = await fetch(`${api}/admin/orders?status=pending,confirmed,preparing,ready,delivering&limit=50`, {
        credentials: 'include'
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const ordersList = Array.isArray(ordersData?.data) ? ordersData.data : [];
        setOrders(ordersList);
      }

    } catch (e: any) {
      console.error('Error loading map data:', e);
      setError(e?.message || 'Không thể tải dữ liệu bản đồ');
    } finally {
      setLoading(false);
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getDriverStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Trực tuyến';
      case 'busy': return 'Đang giao hàng';
      case 'offline': return 'Ngoại tuyến';
      default: return 'Không xác định';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-purple-500';
      case 'delivering': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'delivering': return 'Đang giao';
      default: return 'Không xác định';
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    showRestaurants && 
    (selectedFilter === 'all' || selectedFilter === 'restaurants') &&
    (!searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDrivers = drivers.filter(d => 
    showDrivers && 
    (selectedFilter === 'all' || selectedFilter === 'drivers') &&
    (!searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredOrders = orders.filter(o => 
    showOrders && 
    (selectedFilter === 'all' || selectedFilter === 'orders') &&
    (!searchTerm || 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.restaurantName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bản đồ & Vị trí</h1>
              <p className="text-gray-600">Theo dõi realtime vị trí nhà hàng, tài xế và đơn hàng</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadMapData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faRefresh} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          {/* Search and Filters */}
          <div className="p-4 border-b">
            <div className="relative mb-4">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'all', label: 'Tất cả', icon: faEye },
                { key: 'restaurants', label: 'Nhà hàng', icon: faStore },
                { key: 'drivers', label: 'Tài xế', icon: faTruck },
                { key: 'orders', label: 'Đơn hàng', icon: faLocationArrow }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={filter.icon} className="text-xs" />
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>

            {/* Toggle switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Hiển thị nhà hàng</span>
                <button
                  onClick={() => setShowRestaurants(!showRestaurants)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showRestaurants ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    showRestaurants ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Hiển thị tài xế</span>
                <button
                  onClick={() => setShowDrivers(!showDrivers)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showDrivers ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    showDrivers ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Hiển thị đơn hàng</span>
                <button
                  onClick={() => setShowOrders(!showOrders)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showOrders ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    showOrders ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3">Thống kê</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faStore} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Nhà hàng</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {restaurants.length}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faTruck} className="text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Tài xế</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {drivers.filter(d => d.status === 'online').length}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faLocationArrow} className="text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Đơn hàng</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-1">
                  {orders.length}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faClock} className="text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Đang giao</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-1">
                  {orders.filter(o => o.status === 'delivering').length}
                </div>
              </div>
            </div>
          </div>

          {/* Lists */}
          <div className="flex-1 overflow-y-auto">
            {/* Restaurants */}
            {filteredRestaurants.length > 0 && (
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <FontAwesomeIcon icon={faStore} className="text-blue-600" />
                  <span>Nhà hàng ({filteredRestaurants.length})</span>
                </h3>
                <div className="space-y-2">
                  {filteredRestaurants.map(restaurant => (
                    <div key={restaurant._id} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{restaurant.address}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              restaurant.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {restaurant.isOpen ? 'Mở cửa' : 'Đóng cửa'}
                            </span>
                            <span className="text-sm text-gray-600">
                              ⭐ {restaurant.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drivers */}
            {filteredDrivers.length > 0 && (
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <FontAwesomeIcon icon={faTruck} className="text-green-600" />
                  <span>Tài xế ({filteredDrivers.length})</span>
                </h3>
                <div className="space-y-2">
                  {filteredDrivers.map(driver => (
                    <div key={driver._id} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{driver.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{driver.phone}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getDriverStatusColor(driver.status)} text-white`}>
                              {getDriverStatusText(driver.status)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {driver.vehicleType} - {driver.licensePlate}
                            </span>
                          </div>
                          {driver.currentOrder && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <p className="font-medium text-blue-900">Đơn hàng hiện tại:</p>
                              <p className="text-blue-700">{driver.currentOrder.orderNumber}</p>
                            </div>
                          )}
                        </div>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders */}
            {filteredOrders.length > 0 && (
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <FontAwesomeIcon icon={faLocationArrow} className="text-orange-600" />
                  <span>Đơn hàng ({filteredOrders.length})</span>
                </h3>
                <div className="space-y-2">
                  {filteredOrders.map(order => (
                    <div key={order._id} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.customerName} → {order.restaurantName}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getOrderStatusColor(order.status)} text-white`}>
                              {getOrderStatusText(order.status)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Intl.NumberFormat('vi-VN').format(order.totalAmount)} VNĐ
                            </span>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-600 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải bản đồ...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-6xl text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadMapData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-8xl text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Bản đồ tương tác</h3>
                <p className="text-gray-600 mb-4">
                  Tích hợp Google Maps hoặc Mapbox để hiển thị vị trí realtime
                </p>
                <div className="bg-blue-50 p-4 rounded-lg max-w-md">
                  <p className="text-sm text-blue-800">
                    <strong>Dữ liệu đã sẵn sàng:</strong><br />
                    • {restaurants.length} nhà hàng<br />
                    • {drivers.length} tài xế<br />
                    • {orders.length} đơn hàng đang xử lý
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
