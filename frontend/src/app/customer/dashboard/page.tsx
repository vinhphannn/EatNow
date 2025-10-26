"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerNavBar } from "@/components";
import { useCustomerAuth } from "@/contexts/AuthContext";

export default function CustomerDashboardPage() {
  const { user } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const recentOrders = [
    {
      id: "ORD001",
      restaurant: "Pizza Hut",
      status: "delivered",
      date: "2024-01-15",
      total: 275000,
      items: 3
    },
    {
      id: "ORD002", 
      restaurant: "KFC",
      status: "preparing",
      date: "2024-01-14",
      total: 195000,
      items: 2
    },
    {
      id: "ORD003",
      restaurant: "McDonald's",
      status: "cancelled",
      date: "2024-01-13",
      total: 85000,
      items: 1
    }
  ];

  const favoriteRestaurants = [
    {
      id: 1,
      name: "Pizza Hut",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300",
      rating: 4.5,
      lastOrder: "2 ngày trước"
    },
    {
      id: 2,
      name: "KFC",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300",
      rating: 4.3,
      lastOrder: "1 tuần trước"
    },
    {
      id: 3,
      name: "McDonald's",
      image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300",
      rating: 4.2,
      lastOrder: "3 ngày trước"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Đã giao";
      case "preparing":
        return "Đang chuẩn bị";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavBar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xin chào, {user?.name || 'Khách hàng'}! 👋
          </h1>
          <p className="text-gray-600">
            Chào mừng bạn quay trở lại với EatNow
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-gray-600">Đơn hàng</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-gray-600">Đánh giá TB</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2.5M</p>
                <p className="text-gray-600">Tổng chi tiêu</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Gold</p>
                <p className="text-gray-600">Thành viên</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "orders"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Đơn hàng
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "favorites"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Yêu thích
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Đơn hàng gần đây
                  </h3>
                  <Link
                    href="/customer/orders"
                    className="text-orange-600 font-medium hover:underline"
                  >
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
                          <span className="text-xl">🍽️</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.restaurant}</p>
                          <p className="text-sm text-gray-600">
                            {order.items} món • {new Date(order.date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {order.total.toLocaleString('vi-VN')}đ
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/customer/restaurant"
                    className="flex items-center p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
                  >
                    <span className="text-2xl mr-3">🍽️</span>
                    <div>
                      <p className="font-bold">Đặt món ngay</p>
                      <p className="text-sm opacity-90">Khám phá nhà hàng</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/customer/home"
                    className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                  >
                    <span className="text-2xl mr-3">🛒</span>
                    <div>
                      <p className="font-bold text-gray-900">Giỏ hàng</p>
                      <p className="text-sm text-gray-600">Xem đơn hàng</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/customer/profile"
                    className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                  >
                    <span className="text-2xl mr-3">👤</span>
                    <div>
                      <p className="font-bold text-gray-900">Hồ sơ</p>
                      <p className="text-sm text-gray-600">Cập nhật thông tin</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Tất cả đơn hàng
                  </h3>
                  <Link
                    href="/customer/orders"
                    className="text-orange-600 font-medium hover:underline"
                  >
                    Xem chi tiết
                  </Link>
                </div>

                {recentOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">#{order.id}</p>
                        <p className="text-sm text-gray-600">{order.restaurant}</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{order.items} món • {new Date(order.date).toLocaleDateString('vi-VN')}</span>
                      <span className="font-bold text-gray-900">
                        {order.total.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Nhà hàng yêu thích
                  </h3>
                  <Link
                    href="/customer/restaurant"
                    className="text-orange-600 font-medium hover:underline"
                  >
                    Khám phá thêm
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteRestaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/customer/restaurant/${restaurant.id}`}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{restaurant.name}</p>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm text-gray-600">{restaurant.rating}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Đặt lần cuối: {restaurant.lastOrder}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
