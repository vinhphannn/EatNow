"use client";

import { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Truck,
  ShoppingBag,
  DollarSign,
  LineChart,
  ArrowUp,
  ArrowDown,
  Star,
  Cog,
  Brain,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  pendingOrders: number;
  completedOrders: number;
  averageRating: number;
  topRestaurants: Array<{
    _id: string;
    name: string;
    rating: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    _id: string;
    customerName: string;
    restaurantName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

interface SmartAssignmentStats {
  success: boolean;
  data: {
    smartAssignment: {
      pendingOrders: number;
      availableDrivers: number;
      systemStatus: string;
    };
    orderStats: Record<string, number>;
    driverStats: Record<string, number>;
    recentOrders: Array<{
      _id: string;
      code: string;
      customerName: string;
      restaurantName: string;
      driverName: string;
      total: number;
      status: string;
      createdAt: string;
    }>;
    activeDrivers: Array<{
      _id: string;
      name: string;
      phone: string;
      status: string;
      currentOrderId: string | null;
      activeOrdersCount: number;
      rating: number;
    }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [smartStats, setSmartStats] = useState<SmartAssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemLoading, setSystemLoading] = useState(false);

	useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        
        const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
        
        // Load real data from APIs
        const [usersRes, restaurantsRes, driversRes, ordersRes] = await Promise.all([
          fetch(`${api}/admin/users?limit=1`, { credentials: 'include' }),
          fetch(`${api}/admin/restaurants?limit=1`, { credentials: 'include' }),
          fetch(`${api}/admin/drivers?limit=1`, { credentials: 'include' }),
          fetch(`${api}/admin/orders?limit=1`, { credentials: 'include' })
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : { meta: { total: 0 } };
        const restaurantsData = restaurantsRes.ok ? await restaurantsRes.json() : { meta: { total: 0 } };
        const driversData = driversRes.ok ? await driversRes.json() : { meta: { total: 0 } };
        const ordersData = ordersRes.ok ? await ordersRes.json() : { meta: { total: 0 } };

        const stats: DashboardStats = {
          totalUsers: usersData?.meta?.total || 0,
          totalRestaurants: restaurantsData?.meta?.total || 0,
          totalDrivers: driversData?.meta?.total || 0,
          totalOrders: ordersData?.meta?.total || 0,
          totalRevenue: 125000000, // TODO: Calculate from orders
          activeOrders: 25,
          pendingOrders: 12,
          completedOrders: 3413,
          averageRating: 4.6,
          topRestaurants: [
            { _id: '1', name: 'Nhà hàng ABC', rating: 4.8, orderCount: 156 },
            { _id: '2', name: 'Quán XYZ', rating: 4.7, orderCount: 142 },
            { _id: '3', name: 'Cafe DEF', rating: 4.6, orderCount: 128 }
          ],
          recentOrders: [
            { _id: '1', customerName: 'Nguyễn Văn A', restaurantName: 'Nhà hàng ABC', total: 150000, status: 'completed', createdAt: '2024-01-15T10:30:00Z' },
            { _id: '2', customerName: 'Trần Thị B', restaurantName: 'Quán XYZ', total: 200000, status: 'delivering', createdAt: '2024-01-15T10:15:00Z' },
            { _id: '3', customerName: 'Lê Văn C', restaurantName: 'Cafe DEF', total: 80000, status: 'pending', createdAt: '2024-01-15T10:00:00Z' }
          ]
        };
        setStats(stats);
        
        // Load smart assignment stats (separate API call)
        try {
          const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
          const smartRes = await fetch(`${api}/admin/system/smart-assignment`, { credentials: 'include' });
          if (smartRes.ok) {
            const smartData = await smartRes.json();
            setSmartStats(smartData as SmartAssignmentStats);
          }
        } catch (error) {
          console.error('Error loading smart assignment stats:', error);
        }
        
		} catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to mock data
        const mockStats: DashboardStats = {
          totalUsers: 1250,
          totalRestaurants: 45,
          totalDrivers: 120,
          totalOrders: 3450,
          totalRevenue: 125000000,
          activeOrders: 25,
          pendingOrders: 12,
          completedOrders: 3413,
          averageRating: 4.6,
          topRestaurants: [
            { _id: '1', name: 'Nhà hàng ABC', rating: 4.8, orderCount: 156 },
            { _id: '2', name: 'Quán XYZ', rating: 4.7, orderCount: 142 },
            { _id: '3', name: 'Cafe DEF', rating: 4.6, orderCount: 128 }
          ],
          recentOrders: [
            { _id: '1', customerName: 'Nguyễn Văn A', restaurantName: 'Nhà hàng ABC', total: 150000, status: 'completed', createdAt: '2024-01-15T10:30:00Z' },
            { _id: '2', customerName: 'Trần Thị B', restaurantName: 'Quán XYZ', total: 200000, status: 'delivering', createdAt: '2024-01-15T10:15:00Z' },
            { _id: '3', customerName: 'Lê Văn C', restaurantName: 'Cafe DEF', total: 80000, status: 'pending', createdAt: '2024-01-15T10:00:00Z' }
          ]
        };
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
	}, []);

  const handleTriggerSmartAssignment = async () => {
    try {
      setSystemLoading(true);
      const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
      
      // Call backend API directly
      await fetch(`${api}/admin/system/smart-assignment/trigger`, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Reload smart assignment stats
      const smartRes = await fetch(`${api}/admin/system/smart-assignment`, { credentials: 'include' });
      if (smartRes.ok) {
        const smartData = await smartRes.json();
        setSmartStats(smartData as SmartAssignmentStats);
      }
    } catch (error) {
      console.error('Error triggering smart assignment:', error);
    } finally {
      setSystemLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Nhà hàng',
      value: stats.totalRestaurants.toLocaleString(),
      icon: Store,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Tài xế',
      value: stats.totalDrivers.toLocaleString(),
      icon: Truck,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Doanh thu',
      value: `${(stats.totalRevenue / 1000000).toFixed(1)}M VNĐ`,
      icon: DollarSign,
      color: 'bg-red-500',
      change: '+22%',
      changeType: 'increase'
    },
    {
      title: 'Đánh giá TB',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'bg-yellow-500',
      change: '+0.2',
      changeType: 'increase'
    }
  ];

	return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
        <p className="text-gray-600">Thống kê và báo cáo tổng quan về hoạt động của hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'increase' ? (
                    <ArrowUp className={`w-3 h-3 mr-1 text-green-500`} />
                  ) : (
                    <ArrowDown className={`w-3 h-3 mr-1 text-red-500`} />
                  )}
                  <span className={`text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Đang chờ</span>
              </div>
              <span className="font-semibold">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Đang giao</span>
              </div>
              <span className="font-semibold">{stats.activeOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Hoàn thành</span>
              </div>
              <span className="font-semibold">{stats.completedOrders}</span>
            </div>
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhà hàng top</h3>
          <div className="space-y-3">
            {stats.topRestaurants.map((restaurant, index) => (
              <div key={restaurant._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                  </div>
					<div>
                    <p className="text-sm font-medium text-gray-900">{restaurant.name}</p>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-gray-500">{restaurant.rating}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{restaurant.orderCount} đơn</span>
              </div>
            ))}
					</div>
				</div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng gần đây</h3>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.restaurantName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {order.total.toLocaleString()}đ
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'completed' ? 'Hoàn thành' :
                     order.status === 'delivering' ? 'Đang giao' : 'Chờ xử lý'}
                  </span>
                </div>
              </div>
            ))}
          </div>
				</div>
			</div>

      {/* Smart Assignment System */}
      {smartStats && smartStats.data && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Brain className="w-5 h-5 text-purple-500 mr-2" />
              Hệ thống gán đơn thông minh
            </h3>
            <button
              onClick={handleTriggerSmartAssignment}
              disabled={systemLoading}
              className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {systemLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cog className="w-4 h-4 mr-2" />
              )}
              {systemLoading ? 'Đang xử lý...' : 'Trigger Manual'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Đơn hàng đang tìm tài xế</p>
                  <p className="text-2xl font-bold text-purple-900">{smartStats.data.smartAssignment.pendingOrders}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Tài xế sẵn sàng</p>
                  <p className="text-2xl font-bold text-green-900">{smartStats.data.smartAssignment.availableDrivers}</p>
                </div>
                <Truck className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Trạng thái hệ thống</p>
                  <p className="text-lg font-bold text-blue-900 capitalize">{smartStats.data.smartAssignment.systemStatus}</p>
                </div>
                {smartStats.data.smartAssignment.systemStatus === 'running' ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                )}
              </div>
            </div>
          </div>

          {/* Active Drivers */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Tài xế hoạt động</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {smartStats.data.activeDrivers.slice(0, 6).map((driver) => (
                <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      driver.status === 'available' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {driver.activeOrdersCount} đơn • ⭐ {driver.rating}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{driver.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Đơn hàng gần đây</h4>
            <div className="space-y-2">
              {smartStats.data.recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{order.code} • {order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.restaurantName} • {order.driverName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {order.total.toLocaleString()}đ
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'picking_up' || order.status === 'picked_up' || order.status === 'arrived_at_customer' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'preparing' || order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'delivered' ? 'Đã giao' :
                       order.status === 'picking_up' ? 'Đang lấy hàng' :
                       order.status === 'picked_up' ? 'Đã lấy hàng' :
                       order.status === 'arrived_at_customer' ? 'Đã đến nơi' :
                       order.status === 'preparing' ? 'Đang chuẩn bị' :
                       order.status === 'confirmed' ? 'Đã xác nhận' :
                       order.status === 'cancelled' ? 'Đã hủy' :
                       'Đang xử lý'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Quản lý người dùng</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Store className="w-6 h-6 text-green-500 mb-2" />
            <span className="text-sm font-medium">Quản lý nhà hàng</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingBag className="w-6 h-6 text-orange-500 mb-2" />
            <span className="text-sm font-medium">Xem đơn hàng</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <LineChart className="w-6 h-6 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Báo cáo</span>
          </button>
        </div>
      </div>
    </div>
  );
}