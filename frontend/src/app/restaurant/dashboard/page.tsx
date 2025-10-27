"use client";

import { useState, useEffect } from "react";
import { restaurantService, RestaurantStats, RecentOrder } from "@modules/restaurant/services";
import { useRestaurantWallet } from "@/hooks/useRestaurantWallet";
import WalletCard from "@/components/WalletCard";
import { handleApiError } from "@/services/api.client";

export default function RestaurantDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { wallet, loading: walletLoading } = useRestaurantWallet();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use AuthContext instead of localStorage
      if (user) {
        setUser(user);
      }

      // Load restaurant data
      const restaurantData = await restaurantService.getRestaurant();
      setRestaurant(restaurantData);

      // Load dashboard stats
      const statsData = await restaurantService.getDashboardStats();
      setStats(statsData);

      // Load recent orders
      const ordersData = await restaurantService.getRecentOrders(5);
      setRecentOrders(ordersData);

    } catch (err) {
      console.error('Load dashboard data error:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        restaurantService.getDashboardStats(),
        restaurantService.getRecentOrders(5)
      ]);
      
      setStats(statsData);
      setRecentOrders(ordersData);
    } catch (err) {
      console.error('Refresh data error:', err);
      setError(handleApiError(err));
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'delivered': return 'Đã giao';
      default: return 'Không xác định';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Không thể tải dữ liệu</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadInitialData}
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Xin chào, {restaurant?.name || user?.name || user?.email}!
            </h1>
            <p className="text-orange-100 mt-1">
              {restaurant?.isOpen ? 'Nhà hàng đang mở cửa' : 'Nhà hàng đang đóng cửa'} • 
              {restaurant?.isAcceptingOrders ? ' Đang nhận đơn' : ' Tạm dừng nhận đơn'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <span>⭐</span>
                {stats?.averageRating.toFixed(1) || '0.0'} ({stats?.totalReviews || 0} đánh giá)
              </span>
              <span className="flex items-center gap-1">
                <span>📦</span>
                {stats?.todayOrders || 0} đơn hôm nay
              </span>
              <span className="flex items-center gap-1">
                <span>💰</span>
                ₫{((stats?.todayRevenue || 0) / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-orange-100 text-sm">Hôm nay</p>
              <p className="text-2xl font-bold">{new Date().toLocaleDateString('vi-VN')}</p>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="mt-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Đang tải...' : '🔄 Làm mới'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div>{!walletLoading && <WalletCard title="Ví nhà hàng" wallet={wallet} />}</div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn hôm nay</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.todayOrders || 0}</p>
              <p className={`text-xs mt-1 ${(stats?.todayGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.todayGrowth || 0) >= 0 ? '+' : ''}{(stats?.todayGrowth || 0).toFixed(1)}% so với hôm qua
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doanh thu hôm nay</p>
              <p className="text-3xl font-bold text-gray-900">₫{((stats?.todayRevenue || 0) / 1000000).toFixed(1)}M</p>
              <p className={`text-xs mt-1 ${(stats?.todayGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.todayGrowth || 0) >= 0 ? '+' : ''}{(stats?.todayGrowth || 0).toFixed(1)}% so với hôm qua
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đánh giá TB</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.averageRating.toFixed(1) || '0.0'}★</p>
              <p className="text-xs text-gray-500 mt-1">{stats?.totalReviews || 0} đánh giá</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Món ăn</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalMenuItems || 0}</p>
              <p className="text-xs text-blue-600 mt-1">
                {stats?.activeMenuItems || 0} đang bán • {stats?.newItemsThisMonth || 0} món mới
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hiệu suất</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tỷ lệ hoàn thành</span>
              <span className="font-semibold text-green-600">{stats?.completionRate.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Thời gian chuẩn bị TB</span>
              <span className="font-semibold text-blue-600">{stats?.avgPreparationTime || 0} phút</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giao hàng đúng giờ</span>
              <span className="font-semibold text-green-600">{stats?.onTimeDeliveryRate.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đơn chờ xử lý</span>
              <span className="font-semibold text-orange-600">{stats?.pendingOrders || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tháng này</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng đơn hàng</span>
              <span className="font-semibold text-gray-900">{stats?.monthlyOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Doanh thu</span>
              <span className="font-semibold text-gray-900">₫{((stats?.monthlyRevenue || 0) / 1000000).toFixed(0)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đơn TB/ngày</span>
              <span className="font-semibold text-gray-900">{Math.round((stats?.monthlyOrders || 0) / 30)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giá trị đơn TB</span>
              <span className="font-semibold text-gray-900">₫{(stats?.avgOrderValue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Khách hàng</h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Khách mới tháng này</span>
              <span className="font-semibold text-blue-600">{stats?.newCustomers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Khách quay lại</span>
              <span className="font-semibold text-green-600">{stats?.returningCustomers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tỷ lệ giữ chân</span>
              <span className="font-semibold text-purple-600">{stats?.customerRetentionRate.toFixed(1) || '0.0'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Hành động nhanh</h3>
          <span className="text-2xl">⚡</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="text-left px-4 py-3 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="font-medium">📦 Xem đơn hàng mới</div>
            <div className="text-xs text-orange-600 mt-1">{stats?.pendingOrders || 0} đơn chờ</div>
          </button>
          <button className="text-left px-4 py-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="font-medium">🍽️ Quản lý menu</div>
            <div className="text-xs text-blue-600 mt-1">{stats?.totalMenuItems || 0} món</div>
          </button>
          <button className="text-left px-4 py-3 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <div className="font-medium">💰 Xem báo cáo</div>
            <div className="text-xs text-green-600 mt-1">Doanh thu chi tiết</div>
          </button>
          <button className="text-left px-4 py-3 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="font-medium">👥 Quản lý khách hàng</div>
            <div className="text-xs text-purple-600 mt-1">Khách hàng & đánh giá</div>
          </button>
        </div>
      </div>

      {/* Recent Orders & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Xem tất cả
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-gray-500">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-sm">
                            #{order.code || order._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.customer?.name || 'Khách hàng'}</p>
                          <p className="text-sm text-gray-500">
                            {order.items?.slice(0, 2).map(item => item.name || 'Món ăn').join(', ')}
                            {order.items?.length > 2 && ` +${order.items.length - 2} món khác`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₫{order.finalTotal.toLocaleString()}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Món ăn bán chạy</h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Xem chi tiết
              </button>
            </div>
          </div>
          <div className="p-6">
            {stats?.topSellingItems && stats.topSellingItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🍽️</div>
                <p className="text-gray-500">Chưa có dữ liệu bán hàng</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.topSellingItems?.slice(0, 5).map((item, index) => (
                  <div key={item.itemId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.orders} đơn hàng</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₫{(item.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-500">doanh thu</p>
                    </div>
                  </div>
                )) || []}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Biểu đồ hiệu suất 7 ngày qua</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                7 ngày
              </button>
              <button className="px-3 py-1 text-sm text-gray-500 rounded-md hover:bg-gray-100">
                30 ngày
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-4 block">📈</span>
              <p className="text-gray-500">Biểu đồ doanh thu và đơn hàng sẽ được hiển thị ở đây</p>
              <p className="text-sm text-gray-400 mt-2">Tích hợp với thư viện chart trong tương lai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Status & Quick Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Trạng thái nhà hàng</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                restaurant?.isOpen ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className="text-2xl">{restaurant?.isOpen ? '🟢' : '🔴'}</span>
              </div>
              <h4 className="font-medium text-gray-900">Trạng thái mở cửa</h4>
              <p className="text-sm text-gray-500 mt-1">
                {restaurant?.isOpen ? 'Đang mở cửa' : 'Đang đóng cửa'}
              </p>
              <button className={`mt-2 px-3 py-1 text-sm rounded-md ${
                restaurant?.isOpen 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}>
                {restaurant?.isOpen ? 'Đóng cửa' : 'Mở cửa'}
              </button>
            </div>

            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                restaurant?.isAcceptingOrders ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <span className="text-2xl">{restaurant?.isAcceptingOrders ? '📦' : '⏸️'}</span>
              </div>
              <h4 className="font-medium text-gray-900">Nhận đơn hàng</h4>
              <p className="text-sm text-gray-500 mt-1">
                {restaurant?.isAcceptingOrders ? 'Đang nhận đơn' : 'Tạm dừng nhận đơn'}
              </p>
              <button className={`mt-2 px-3 py-1 text-sm rounded-md ${
                restaurant?.isAcceptingOrders 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}>
                {restaurant?.isAcceptingOrders ? 'Tạm dừng' : 'Bắt đầu nhận'}
              </button>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">⚙️</span>
              </div>
              <h4 className="font-medium text-gray-900">Cài đặt nhanh</h4>
              <p className="text-sm text-gray-500 mt-1">Thời gian chuẩn bị: {stats?.avgPreparationTime || 0} phút</p>
              <button className="mt-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200">
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}