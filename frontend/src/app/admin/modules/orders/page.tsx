"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingBag,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faTruck,
  faEye,
  faEdit,
  faTrash,
  faFilter,
  faSearch,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  restaurantName: string;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  createdAt: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        // Mock data - replace with real API calls
        const mockOrders: Order[] = [
          {
            _id: '1',
            orderNumber: 'ORD-001',
            customerName: 'Nguyễn Văn A',
            restaurantName: 'Nhà hàng ABC',
            total: 150000,
            status: 'delivering',
            createdAt: '2024-01-15T10:30:00Z',
            deliveryAddress: '123 Đường ABC, Quận 1, TP.HCM',
            items: [
              { name: 'Phở bò', quantity: 1, price: 50000 },
              { name: 'Nước ngọt', quantity: 2, price: 25000 }
            ]
          },
          {
            _id: '2',
            orderNumber: 'ORD-002',
            customerName: 'Trần Thị B',
            restaurantName: 'Quán XYZ',
            total: 200000,
            status: 'preparing',
            createdAt: '2024-01-15T10:15:00Z',
            deliveryAddress: '456 Đường XYZ, Quận 2, TP.HCM',
            items: [
              { name: 'Cơm tấm', quantity: 2, price: 80000 },
              { name: 'Canh chua', quantity: 1, price: 40000 }
            ]
          },
          {
            _id: '3',
            orderNumber: 'ORD-003',
            customerName: 'Lê Văn C',
            restaurantName: 'Cafe DEF',
            total: 80000,
            status: 'delivered',
            createdAt: '2024-01-15T10:00:00Z',
            deliveryAddress: '789 Đường DEF, Quận 3, TP.HCM',
            items: [
              { name: 'Cà phê đen', quantity: 2, price: 40000 }
            ]
          }
        ];
        setOrders(mockOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivering': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'delivering': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-600">Theo dõi và quản lý tất cả đơn hàng trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faShoppingBag} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang giao</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'delivering').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faTruck} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
              />
              <input
                type="text"
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="preparing">Đang chuẩn bị</option>
              <option value="ready">Sẵn sàng</option>
              <option value="delivering">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredOrders.map((order) => (
            <div key={order._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Khách hàng</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nhà hàng</p>
                      <p className="text-sm text-gray-600">{order.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tổng tiền</p>
                      <p className="text-sm text-gray-600">{order.total.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">Địa chỉ giao hàng</p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">Món ăn</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {order.items.map((item, index) => (
                        <span key={index} className="text-sm text-gray-600">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-400 hover:text-red-600">
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



