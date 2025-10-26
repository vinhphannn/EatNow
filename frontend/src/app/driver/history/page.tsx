'use client';

import { useState, useEffect } from 'react';
import { driverService } from '@/services/driver.service';
import { DriverOrderSummary } from '@/types/driver';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

type UiOrder = DriverOrderSummary & {
    orderNote?: string;
    deliveryNote?: string;
    paymentMethod?: string;
    pickup?: string;
    dropoff?: string;
    totalAmount?: number;
    deliveryFee?: number;
    deliveredAt?: string;
};

const statusConfig = {
    delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: '✅' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: '❌' },
};


export default function DriverHistoryPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [orders, setOrders] = useState<UiOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const load = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading driver history...');
            
            const response = await driverService.getDriverHistory(page, 20);
            console.log('Driver history response:', response);

            if (response && response.success && response.data) {
                const mappedOrders = response.data.orders.map((o: any) => ({
                    id: o._id || o.id,
                    code: o.orderNumber || o.code || o.id,
                    status: o.status || "delivered",
                    restaurant: {
                        id: o.restaurantId?._id || o.restaurantId?.id || "",
                        name: o.restaurantId?.name || o.restaurantName || "",
                        address: o.restaurantId?.address || "",
                        phone: o.restaurantId?.phone || "",
                        location: o.restaurantId?.coordinates ? {
                            latitude: o.restaurantId.coordinates.lat || o.restaurantId.coordinates.latitude,
                            longitude: o.restaurantId.coordinates.lng || o.restaurantId.coordinates.longitude
                        } : undefined
                    },
                    customer: {
                        id: o.customerId?._id || o.customerId?.id || "",
                        name: o.customerId?.name || o.customerName || o.deliveryAddress?.recipientName || "",
                        phone: o.customerId?.phone || o.deliveryAddress?.recipientPhone || "",
                        address: o.deliveryAddress?.addressLine || "",
                        location: o.deliveryAddress?.coordinates ? {
                            latitude: o.deliveryAddress.coordinates.lat || o.deliveryAddress.coordinates.latitude,
                            longitude: o.deliveryAddress.coordinates.lng || o.deliveryAddress.coordinates.longitude
                        } : undefined
                    },
                    items: o.items || [],
                    totals: {
                        subtotal: o.subtotal || o.itemsTotal || 0,
                        deliveryFee: o.deliveryFee || 0,
                        discount: o.discount || 0,
                        tax: o.tax || 0,
                        total: o.totalAmount || o.total || 0,
                        cod: typeof o.cod === 'number' ? o.cod : (o.paymentMethod === 'COD' ? (o.finalTotal || o.totalAmount || 0) : 0)
                    },
                    createdAt: o.createdAt,
                    estimatedPickupTime: o.estimatedPickupTime,
                    estimatedDeliveryTime: o.estimatedDeliveryTime,
                    // Additional fields for UI
                    pickup: o.restaurantId?.name || o.restaurantName || "",
                    dropoff: o.customerId?.name || o.customerName || o.deliveryAddress?.recipientName || "",
                    totalAmount: o.totalAmount || o.total || 0,
                    deliveryFee: o.deliveryFee || 0,
                    deliveredAt: o.deliveredAt,
                    orderNote: o.orderNote || "",
                    deliveryNote: o.deliveryNote || "",
                    paymentMethod: o.paymentMethod || "COD",
                    deliveryAddress: o.deliveryAddress
                }));

                setOrders(mappedOrders);
                setPagination(response.data.pagination);
                console.log('All driver history orders:', mappedOrders.length);
            } else {
                throw new Error(response.message || 'Invalid response format');
            }
        } catch (err: any) {
            console.error('Error loading driver history:', err);
            setError(err.message || 'Failed to load driver history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            load();
        }
    }, [authLoading, isAuthenticated]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📋 Lịch sử đơn hàng
                    </h1>
                    <p className="text-gray-600">
                        Xem lại các đơn hàng đã hoàn thành và đã hủy
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Đã giao</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {orders.filter(o => o.status === 'delivered').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <span className="text-2xl">❌</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {orders.filter(o => o.status === 'cancelled').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <span className="text-2xl">💰</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tổng thu nhập</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(
                                        orders
                                            .filter(o => o.status === 'delivered')
                                            .reduce((sum, o) => sum + (o.totals?.deliveryFee || 0), 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                {(loading || authLoading) && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Đang tải lịch sử...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-red-400">⚠️</span>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !authLoading && orders.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử</h3>
                        <p className="text-gray-600">Bạn chưa có đơn hàng nào trong lịch sử</p>
                    </div>
                )}

                {!loading && !authLoading && orders.length > 0 && (
                    <div className="space-y-4">
                        {orders.map((order, index) => {
                            const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.delivered;
                            return (
                                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{statusInfo.icon}</span>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">#{order.code}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(order.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {order.status === 'delivered' && order.deliveredAt && (
                                                        <>Hoàn thành: {formatDate(order.deliveredAt)}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="px-6 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Restaurant Info */}
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">🏪 Nhà hàng</h4>
                                                <p className="text-gray-700">{order.restaurant.name}</p>
                                            </div>

                                            {/* Customer Info */}
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">👤 Khách hàng</h4>
                                                <p className="text-gray-700">{order.customer.name}</p>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium text-gray-900 mb-2">🍽️ Món ăn</h4>
                                                <div className="space-y-1">
                                                    {order.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                                                            <span>{item.name} x{item.quantity || 1}</span>
                                                            <span>{formatCurrency(item.price * (item.quantity || 1))}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Summary */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    <p>Tổng đơn: {formatCurrency(order.totals?.total || 0)}</p>
                                                    <p>Phí giao hàng: {formatCurrency(order.totals?.deliveryFee || 0)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-gray-900">
                                                        {formatCurrency((order.totals?.total || 0) + (order.totals?.deliveryFee || 0))}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && !authLoading && pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => load(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            
                            <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            
                            <button
                                onClick={() => load(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}