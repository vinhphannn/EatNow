'use client';

import { useState, useEffect } from 'react';
import { restaurantService, RestaurantAnalytics } from '@/services/restaurant.service';
import { handleApiError } from '@/services/api.client';

export default function RestaurantAnalyticsPage() {
  const [analytics, setAnalytics] = useState<RestaurantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'revenue' | 'orders' | 'customers' | 'menu' | 'delivery'>('revenue');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await restaurantService.getAnalytics(selectedPeriod);
      setAnalytics(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return '7 ngày qua';
      case '30d': return '30 ngày qua';
      case '90d': return '90 ngày qua';
      case '1y': return '1 năm qua';
      default: return '30 ngày qua';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl mt-6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Không thể tải dữ liệu phân tích</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadAnalytics}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phân tích & Báo cáo</h1>
          <p className="text-gray-600 mt-1">Theo dõi hiệu suất kinh doanh chi tiết</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
            <option value="1y">1 năm qua</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      {analytics?.financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.financialSummary.totalRevenue)}
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
                <p className="text-sm font-medium text-gray-600">Lợi nhuận gộp</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.financialSummary.grossProfit)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {(analytics.financialSummary.profitMargin * 100).toFixed(1)}% margin
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Phí nền tảng</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.financialSummary.platformCommission)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Thu nhập ròng</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.financialSummary.netProfit)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'revenue', label: 'Doanh thu', icon: '💰' },
              { id: 'orders', label: 'Đơn hàng', icon: '📦' },
              { id: 'customers', label: 'Khách hàng', icon: '👥' },
              { id: 'menu', label: 'Thực đơn', icon: '🍽️' },
              { id: 'delivery', label: 'Giao hàng', icon: '🚚' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Revenue Tab */}
          {activeTab === 'revenue' && analytics?.revenueByDay && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Doanh thu theo ngày ({getPeriodLabel(selectedPeriod)})
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📊</span>
                    <p className="text-gray-500">Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Tổng doanh thu: {formatCurrency(
                        analytics.revenueByDay.reduce((sum, day) => sum + day.revenue, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Doanh thu theo giờ</h4>
                  <div className="space-y-2">
                    {analytics.revenueByHour?.slice(0, 5).map((hour, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{hour.hour}:00 - {hour.hour + 1}:00</span>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(hour.revenue)}</p>
                          <p className="text-sm text-gray-500">{hour.orders} đơn</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Top ngày doanh thu cao</h4>
                  <div className="space-y-2">
                    {analytics.revenueByDay
                      ?.sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((day, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{new Date(day.date).toLocaleDateString('vi-VN')}</span>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(day.revenue)}</p>
                            <p className="text-sm text-gray-500">{day.orders} đơn</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && analytics?.orderStatusDistribution && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Phân tích đơn hàng ({getPeriodLabel(selectedPeriod)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Phân bố trạng thái đơn hàng</h4>
                    <div className="space-y-2">
                      {analytics.orderStatusDistribution.map((status, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">
                            {status.status === 'pending' ? 'Chờ xác nhận' :
                             status.status === 'confirmed' ? 'Đã xác nhận' :
                             status.status === 'preparing' ? 'Đang chuẩn bị' :
                             status.status === 'ready' ? 'Sẵn sàng' :
                             status.status === 'delivered' ? 'Đã giao' :
                             status.status === 'cancelled' ? 'Đã hủy' : status.status}
                          </span>
                          <div className="text-right">
                            <p className="font-semibold">{formatNumber(status.count)}</p>
                            <p className="text-sm text-gray-500">{status.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Timeline đơn hàng</h4>
                    <div className="space-y-2">
                      {analytics.orderTimeline?.slice(0, 10).map((timeline, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {new Date(timeline.timestamp).toLocaleString('vi-VN')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {timeline.status === 'pending' ? 'Đơn mới' :
                               timeline.status === 'confirmed' ? 'Đã xác nhận' :
                               timeline.status === 'preparing' ? 'Đang chuẩn bị' :
                               timeline.status === 'ready' ? 'Sẵn sàng' :
                               timeline.status === 'delivered' ? 'Đã giao' :
                               timeline.status === 'cancelled' ? 'Đã hủy' : timeline.status}
                            </p>
                          </div>
                          <span className="font-semibold text-orange-600">{timeline.count} đơn</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && analytics?.customerSegments && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Phân tích khách hàng ({getPeriodLabel(selectedPeriod)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Phân khúc khách hàng</h4>
                    <div className="space-y-2">
                      {analytics.customerSegments.map((segment, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{segment.segment}</span>
                            <span className="text-orange-600 font-semibold">{formatNumber(segment.count)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Doanh thu: {formatCurrency(segment.revenue)}</span>
                            <span>Đơn TB: {formatCurrency(segment.avgOrderValue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Thống kê tổng quan</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Tổng khách hàng</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatNumber(analytics.customerSegments.reduce((sum, s) => sum + s.count, 0))}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Tổng doanh thu từ khách hàng</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(analytics.customerSegments.reduce((sum, s) => sum + s.revenue, 0))}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Giá trị đơn hàng trung bình</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatCurrency(
                            analytics.customerSegments.reduce((sum, s) => sum + s.avgOrderValue, 0) / 
                            analytics.customerSegments.length || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === 'menu' && analytics?.menuPerformance && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hiệu suất thực đơn ({getPeriodLabel(selectedPeriod)})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {analytics.menuPerformance
                    ?.sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={item.itemId} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">{item.category || 'Chưa phân loại'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600">
                              {formatCurrency(item.revenue)}
                            </p>
                            <p className="text-sm text-gray-500">doanh thu</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Đơn hàng</p>
                            <p className="font-semibold">{formatNumber(item.orders)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Đánh giá</p>
                            <p className="font-semibold">⭐ {item.rating.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Độ phổ biến</p>
                            <p className="font-semibold">{item.popularity.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Lợi nhuận</p>
                            <p className="font-semibold text-green-600">
                              {(item.profitMargin * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Tab */}
          {activeTab === 'delivery' && analytics?.deliveryPerformance && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hiệu suất giao hàng ({getPeriodLabel(selectedPeriod)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Thống kê tổng quan</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Thời gian giao hàng trung bình</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {analytics.deliveryPerformance.avgDeliveryTime.toFixed(1)} phút
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Tỷ lệ giao đúng giờ</p>
                        <p className="text-2xl font-bold text-green-900">
                          {(analytics.deliveryPerformance.onTimeRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Khoảng cách trung bình</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {analytics.deliveryPerformance.distanceStats.avgDistance.toFixed(1)} km
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Hiệu suất tài xế</h4>
                    <div className="space-y-2">
                      {analytics.deliveryPerformance.driverPerformance
                        ?.sort((a, b) => b.orders - a.orders)
                        .slice(0, 5)
                        .map((driver, index) => (
                          <div key={driver.driverId} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{driver.name}</span>
                              <span className="text-orange-600 font-semibold">{driver.orders} đơn</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>TB: {driver.avgDeliveryTime.toFixed(1)} phút</span>
                              <span>⭐ {driver.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


