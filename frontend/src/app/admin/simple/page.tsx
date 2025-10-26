"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faStore,
  faTruck,
  faShoppingBag,
  faDollarSign,
  faChartLine,
  faMapMarkerAlt,
  faEye,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

interface User {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  status?: string;
  createdAt?: string;
}

interface Restaurant {
  _id: string;
  name: string;
  address?: string;
  status: string;
  rating?: number;
  createdAt?: string;
}

interface Driver {
  _id: string;
  name: string;
  phone?: string;
  status?: string;
  vehicleType?: string;
  licensePlate?: string;
  createdAt?: string;
}

export default function SimpleAdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'restaurants' | 'drivers'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load users
      const usersRes = await fetch(`${api}/admin/users?limit=20`, {
        credentials: 'include'
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData?.data || []);
      }

      // Load restaurants
      const restaurantsRes = await fetch(`${api}/admin/restaurants?limit=20`, {
        credentials: 'include'
      });
      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json();
        setRestaurants(restaurantsData?.data || []);
      }

      // Load drivers
      const driversRes = await fetch(`${api}/admin/drivers?limit=20`, {
        credentials: 'include'
      });
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData?.data || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    totalRestaurants: restaurants.length,
    totalDrivers: drivers.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    activeRestaurants: restaurants.filter(r => r.status === 'active').length,
    activeDrivers: drivers.filter(d => d.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Quản lý hệ thống EatNow</p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faChartLine} className="mr-2" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'dashboard', label: 'Tổng quan', icon: faChartLine },
              { key: 'users', label: 'Người dùng', icon: faUsers },
              { key: 'restaurants', label: 'Nhà hàng', icon: faStore },
              { key: 'drivers', label: 'Tài xế', icon: faTruck }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Tổng người dùng</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faStore} className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Nhà hàng</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalRestaurants}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faTruck} className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Tài xế</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalDrivers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Hoạt động</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeUsers + stats.activeRestaurants + stats.activeDrivers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Hoạt động gần đây</h3>
                <div className="mt-5">
                  <div className="text-sm text-gray-500">
                    <p>• {stats.totalUsers} người dùng đã đăng ký</p>
                    <p>• {stats.totalRestaurants} nhà hàng đang hoạt động</p>
                    <p>• {stats.totalDrivers} tài xế sẵn sàng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user._id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email} • {user.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status || 'unknown'}
                        </span>
                        <button className="text-blue-600 hover:text-blue-900">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản lý nhà hàng</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <li key={restaurant._id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-300 flex items-center justify-center">
                            <FontAwesomeIcon icon={faStore} className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {restaurant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {restaurant.address} • Rating: {restaurant.rating || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          restaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {restaurant.status}
                        </span>
                        <button className="text-blue-600 hover:text-blue-900">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Quản lý tài xế</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <li key={driver._id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-300 flex items-center justify-center">
                            <FontAwesomeIcon icon={faTruck} className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver.phone} • {driver.vehicleType} - {driver.licensePlate}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          driver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {driver.status || 'unknown'}
                        </span>
                        <button className="text-blue-600 hover:text-blue-900">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



