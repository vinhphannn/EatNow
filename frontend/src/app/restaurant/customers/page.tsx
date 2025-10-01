'use client';

import { useState, useEffect } from 'react';
import { restaurantService } from '@modules/restaurant/services';
import { handleApiError } from '@/services/api.client';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  averageOrderValue: number;
  loyaltyTier: string;
  tags: string[];
}

interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomers: number;
  averageOrderValue: number;
  topSpendingCustomers: Customer[];
  loyaltyDistribution: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
}

export default function RestaurantCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'revenue' | 'lastOrder'>('lastOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [currentPage, sortBy, sortOrder, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getCustomers({
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder,
      });

      setCustomers(response.customers || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // This would be a new API endpoint for customer stats
      const response = await restaurantService.getCustomers({
        page: 1,
        limit: 1000,
        sortBy: 'revenue',
        sortOrder: 'desc',
      });

      const allCustomers = response.customers || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: CustomerStats = {
        totalCustomers: allCustomers.length,
        newCustomersThisMonth: allCustomers.filter(c => 
          c.lastOrderAt && new Date(c.lastOrderAt) >= thisMonth
        ).length,
        returningCustomers: allCustomers.filter(c => c.totalOrders > 1).length,
        averageOrderValue: allCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / allCustomers.length || 0,
        topSpendingCustomers: allCustomers.slice(0, 5),
        loyaltyDistribution: [
          { tier: 'Bronze', count: allCustomers.filter(c => c.totalSpent < 1000000).length, percentage: 0 },
          { tier: 'Silver', count: allCustomers.filter(c => c.totalSpent >= 1000000 && c.totalSpent < 5000000).length, percentage: 0 },
          { tier: 'Gold', count: allCustomers.filter(c => c.totalSpent >= 5000000 && c.totalSpent < 10000000).length, percentage: 0 },
          { tier: 'Platinum', count: allCustomers.filter(c => c.totalSpent >= 10000000).length, percentage: 0 },
        ]
      };

      // Calculate percentages
      stats.loyaltyDistribution.forEach(tier => {
        tier.percentage = (tier.count / stats.totalCustomers) * 100;
      });

      setStats(stats);
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const loadCustomerDetails = async (customer: Customer) => {
    try {
      const details = await restaurantService.getCustomerDetails(customer._id);
      setCustomerDetails(details);
      setSelectedCustomer(customer);
      setShowDetails(true);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl mt-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
          <p className="text-gray-600 mt-1">Theo dõi và phân tích hành vi khách hàng</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Xuất báo cáo
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Gửi khuyến mãi
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng khách hàng</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.newCustomersThisMonth} mới tháng này</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khách quay lại</p>
                <p className="text-3xl font-bold text-gray-900">{stats.returningCustomers}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {((stats.returningCustomers / stats.totalCustomers) * 100).toFixed(1)}% tổng khách
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giá trị đơn TB</p>
                <p className="text-3xl font-bold text-gray-900">₫{stats.averageOrderValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Trung bình mỗi đơn</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khách VIP</p>
                <p className="text-3xl font-bold text-gray-900">{stats.loyaltyDistribution.find(t => t.tier === 'Platinum')?.count || 0}</p>
                <p className="text-xs text-purple-600 mt-1">Platinum tier</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="lastOrder">Lần đặt cuối</option>
              <option value="revenue">Tổng chi tiêu</option>
              <option value="orders">Số đơn hàng</option>
              <option value="name">Tên</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách khách hàng</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {customers.map((customer) => (
            <div key={customer._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    {customer.avatarUrl ? (
                      <img src={customer.avatarUrl} alt={customer.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-orange-600 font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{customer.name}</h4>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-500">📞 {customer.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Đơn hàng</p>
                    <p className="font-semibold text-gray-900">{customer.totalOrders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Tổng chi tiêu</p>
                    <p className="font-semibold text-gray-900">₫{customer.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Đơn TB</p>
                    <p className="font-semibold text-gray-900">₫{customer.averageOrderValue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Cấp độ</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLoyaltyTierColor(customer.loyaltyTier)}`}>
                      {customer.loyaltyTier}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Lần cuối</p>
                    <p className="font-semibold text-gray-900">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Chưa có'}
                    </p>
                  </div>
                  <button
                    onClick={() => loadCustomerDetails(customer)}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Trang {currentPage} của {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && customerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Chi tiết khách hàng: {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Tên:</span> {selectedCustomer.name}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <p><span className="text-gray-500">Số điện thoại:</span> {selectedCustomer.phone}</p>
                    )}
                    <p><span className="text-gray-500">Cấp độ:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLoyaltyTierColor(selectedCustomer.loyaltyTier)}`}>
                        {selectedCustomer.loyaltyTier}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Thống kê</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Tổng đơn hàng:</span> {customerDetails.stats.totalOrders}</p>
                    <p><span className="text-gray-500">Tổng chi tiêu:</span> ₫{customerDetails.stats.totalSpent.toLocaleString()}</p>
                    <p><span className="text-gray-500">Giá trị đơn TB:</span> ₫{customerDetails.stats.averageOrderValue.toLocaleString()}</p>
                    <p><span className="text-gray-500">Lần đặt cuối:</span> {
                      customerDetails.stats.lastOrderAt ? formatDate(customerDetails.stats.lastOrderAt) : 'Chưa có'
                    }</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Đơn hàng gần đây</h4>
                <div className="space-y-3">
                  {customerDetails.orders.slice(0, 5).map((order: any) => (
                    <div key={order._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">#{order.code || order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm text-gray-500">
                            {order.items.map((item: any) => item.name).join(', ')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₫{order.finalTotal.toLocaleString()}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'delivered' ? 'Đã giao' :
                             order.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Items */}
              {customerDetails.stats.favoriteItems && customerDetails.stats.favoriteItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Món ăn yêu thích</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {customerDetails.stats.favoriteItems.map((item: any) => (
                      <div key={item.itemId} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.orders} lần đặt</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}