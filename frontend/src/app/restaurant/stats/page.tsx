"use client";
import { useMemo, useState, useEffect } from "react";

export default function RestaurantStatsPage() {
  const [range, setRange] = useState<'today'|'week'|'month'|'year'>('today');
  const [loading, setLoading] = useState(false);

  // Mock data - in real app, this would come from API
  const statsData = useMemo(() => {
    const baseData = {
      today: {
        orders: 24,
        revenue: 2400000,
        customers: 18,
        avgOrderValue: 100000,
        growth: { orders: 12, revenue: 8, customers: 15 }
      },
      week: {
        orders: 168,
        revenue: 16800000,
        customers: 125,
        avgOrderValue: 100000,
        growth: { orders: 8, revenue: 15, customers: 12 }
      },
      month: {
        orders: 720,
        revenue: 72000000,
        customers: 540,
        avgOrderValue: 100000,
        growth: { orders: 25, revenue: 30, customers: 22 }
      },
      year: {
        orders: 8640,
        revenue: 864000000,
        customers: 6480,
        avgOrderValue: 100000,
        growth: { orders: 45, revenue: 52, customers: 38 }
      }
    };
    return baseData[range];
  }, [range]);

  const chartData = useMemo(() => {
    if (range === 'today') return [12, 9, 7, 11, 14, 8, 10, 15, 18, 22, 16, 20, 14, 11, 9, 13, 17, 21, 19, 16, 12, 8, 6, 10];
    if (range === 'week') return [70, 64, 72, 81, 68, 75, 82];
    if (range === 'month') return [200, 340, 410, 380, 420, 450];
    return [2000, 3400, 4100, 3800, 4200, 4500, 4800, 5200, 5100, 4900, 5300, 5600];
  }, [range]);

  const topSellingItems = [
    { name: "Cơm tấm sườn nướng", orders: 45, revenue: 2025000, growth: 12 },
    { name: "Bún bò Huế", orders: 38, revenue: 2470000, growth: 8 },
    { name: "Phở bò", orders: 32, revenue: 1760000, growth: 15 },
    { name: "Bánh mì thịt nướng", orders: 28, revenue: 840000, growth: 22 },
    { name: "Gỏi cuốn tôm thịt", orders: 25, revenue: 1250000, growth: 5 }
  ];

  const peakHours = [
    { hour: "11:00-12:00", orders: 45, revenue: 2250000 },
    { hour: "12:00-13:00", orders: 52, revenue: 2600000 },
    { hour: "18:00-19:00", orders: 38, revenue: 1900000 },
    { hour: "19:00-20:00", orders: 41, revenue: 2050000 },
    { hour: "20:00-21:00", orders: 29, revenue: 1450000 }
  ];

  const customerMetrics = [
    { label: "Khách hàng mới", value: 12, growth: 15 },
    { label: "Khách hàng quay lại", value: 85, growth: 8 },
    { label: "Tỷ lệ giữ chân", value: 78, growth: 12 },
    { label: "Đánh giá trung bình", value: 4.8, growth: 5 }
  ];

  const getRangeLabel = () => {
    switch (range) {
      case 'today': return 'Hôm nay';
      case 'week': return '7 ngày qua';
      case 'month': return '30 ngày qua';
      case 'year': return '12 tháng qua';
      default: return 'Hôm nay';
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600 bg-green-100';
    if (growth < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '→';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="text-gray-600 mt-1">Phân tích hiệu suất kinh doanh của nhà hàng</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value as any)} 
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="today">📅 Hôm nay</option>
            <option value="week">📊 7 ngày qua</option>
            <option value="month">📈 30 ngày qua</option>
            <option value="year">🗓️ 12 tháng qua</option>
          </select>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
            📄 Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Tổng đơn hàng</p>
              <p className="text-3xl font-bold text-gray-900">{statsData.orders.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(statsData.growth.orders)}`}>
            <span className="mr-1">{getGrowthIcon(statsData.growth.orders)}</span>
            {Math.abs(statsData.growth.orders)}% so với kỳ trước
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Doanh thu</p>
              <p className="text-3xl font-bold text-gray-900">₫{(statsData.revenue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(statsData.growth.revenue)}`}>
            <span className="mr-1">{getGrowthIcon(statsData.growth.revenue)}</span>
            {Math.abs(statsData.growth.revenue)}% so với kỳ trước
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Khách hàng</p>
              <p className="text-3xl font-bold text-gray-900">{statsData.customers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(statsData.growth.customers)}`}>
            <span className="mr-1">{getGrowthIcon(statsData.growth.customers)}</span>
            {Math.abs(statsData.growth.customers)}% so với kỳ trước
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Giá trị đơn TB</p>
              <p className="text-3xl font-bold text-gray-900">₫{statsData.avgOrderValue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Trung bình mỗi đơn hàng
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Doanh thu theo thời gian</h3>
              <p className="text-sm text-gray-600">{getRangeLabel()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Doanh thu</span>
            </div>
          </div>
          
          {/* Simple Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {chartData.map((value, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all duration-300 hover:from-orange-600 hover:to-orange-500"
                  style={{ height: `${(value / Math.max(...chartData)) * 200}px` }}
                  title={`${value} đơn`}
                ></div>
                <div className="text-xs text-gray-500 mt-2">
                  {range === 'today' ? `${index}h` : 
                   range === 'week' ? `${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index]}` :
                   range === 'month' ? `T${index + 1}` : `T${index + 1}`}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Tổng: ₫{(chartData.reduce((sum, val) => sum + val * 100000, 0) / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Món ăn bán chạy</h3>
            <span className="text-sm text-gray-600">{getRangeLabel()}</span>
          </div>
          
          <div className="space-y-4">
            {topSellingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(item.growth)}`}>
                    <span className="mr-1">{getGrowthIcon(item.growth)}</span>
                    {Math.abs(item.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Metrics & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Metrics */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Chỉ số khách hàng</h3>
          <div className="grid grid-cols-2 gap-4">
            {customerMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{metric.value}{metric.label.includes('Tỷ lệ') ? '%' : metric.label.includes('Đánh giá') ? '★' : ''}</p>
                <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(metric.growth)}`}>
                  <span className="mr-1">{getGrowthIcon(metric.growth)}</span>
                  {Math.abs(metric.growth)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Giờ cao điểm</h3>
          <div className="space-y-3">
            {peakHours.map((hour, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{hour.hour}</p>
                    <p className="text-sm text-gray-500">{hour.orders} đơn hàng</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₫{(hour.revenue / 1000).toFixed(0)}K</p>
                  <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(hour.orders / Math.max(...peakHours.map(h => h.orders))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">💡 Nhận xét & Khuyến nghị</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Điểm mạnh</h4>
            <ul className="space-y-1 text-orange-100 text-sm">
              <li>• Doanh thu tăng trưởng ổn định</li>
              <li>• Khách hàng quay lại cao</li>
              <li>• Giờ cao điểm tập trung rõ ràng</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Cơ hội cải thiện</h4>
            <ul className="space-y-1 text-orange-100 text-sm">
              <li>• Tăng cường marketing vào giờ thấp điểm</li>
              <li>• Mở rộng menu món ăn bán chạy</li>
              <li>• Tối ưu hóa thời gian chuẩn bị</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


