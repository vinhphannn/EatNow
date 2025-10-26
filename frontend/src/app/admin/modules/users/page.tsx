"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faStore,
  faTruck,
  faShoppingBag,
  faDollarSign,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faEye,
  faClock,
  faStar,
  faMapMarkerAlt,
  faUser,
  faUserTie,
  faMotorcycle
} from '@fortawesome/free-solid-svg-icons';

interface UserStats {
  totalUsers: number;
  totalRestaurants: number;
  totalDrivers: number;
  activeUsers: number;
  newUsersToday: number;
  topUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    lastLogin: string;
  }>;
}

export default function UsersManagementPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'customers' | 'restaurants' | 'drivers'>('customers');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab') as 'customers' | 'restaurants' | 'drivers';
    if (tab && ['customers', 'restaurants', 'drivers'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // Mock data - replace with real API calls
        const mockStats: UserStats = {
          totalUsers: 1250,
          totalRestaurants: 45,
          totalDrivers: 120,
          activeUsers: 980,
          newUsersToday: 15,
          topUsers: [
            { _id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', role: 'customer', lastLogin: '2024-01-15T10:30:00Z' },
            { _id: '2', name: 'Trần Thị B', email: 'tranthib@email.com', role: 'restaurant', lastLogin: '2024-01-15T09:15:00Z' },
            { _id: '3', name: 'Lê Văn C', email: 'levanc@email.com', role: 'driver', lastLogin: '2024-01-15T08:45:00Z' }
          ]
        };
        setStats(mockStats);
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!stats) return null;

  const tabs = [
    { id: 'customers', label: 'Khách hàng', icon: faUser, count: stats.totalUsers },
    { id: 'restaurants', label: 'Nhà hàng', icon: faStore, count: stats.totalRestaurants },
    { id: 'drivers', label: 'Tài xế', icon: faMotorcycle, count: stats.totalDrivers }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Người dùng hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faEye} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Người dùng mới hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newUsersToday}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowUp} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tỷ lệ hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'customers' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách khách hàng</h3>
              <div className="space-y-3">
                {stats.topUsers.filter(user => user.role === 'customer').map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Đăng nhập lần cuối</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.lastLogin).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'restaurants' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách nhà hàng</h3>
              <div className="space-y-3">
                {stats.topUsers.filter(user => user.role === 'restaurant').map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faStore} className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Đăng nhập lần cuối</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.lastLogin).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách tài xế</h3>
              <div className="space-y-3">
                {stats.topUsers.filter(user => user.role === 'driver').map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faMotorcycle} className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Đăng nhập lần cuối</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.lastLogin).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
