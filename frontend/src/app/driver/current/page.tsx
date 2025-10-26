"use client";
import { useEffect, useMemo, useState } from "react";
import { driverService } from "@/services/driver.service";
import { OrderChat } from '@/components';

type UiOrder = {
    id: string;
    code: string;
    pickup: string;
    dropoff: string;
    cod: number;
    status: string;
    totalAmount?: number;
    deliveryFee?: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    createdAt?: string;
    restaurantAddress?: string;
    customerAddress?: string;
    customerPhone?: string;
    restaurantPhone?: string;
    items?: any[];
    orderNote?: string;
    deliveryNote?: string;
    paymentMethod?: string;
};

const statusConfig = {
    picking_up: { label: 'Đang lấy hàng', color: 'bg-indigo-100 text-indigo-800', icon: '🚗' },
    arrived_at_restaurant: { label: 'Đã đến quán', color: 'bg-blue-100 text-blue-800', icon: '🏪' },
    picked_up: { label: 'Đã lấy đơn', color: 'bg-purple-100 text-purple-800', icon: '📦' },
    arrived_at_customer: { label: 'Đã đến vị trí giao', color: 'bg-indigo-100 text-indigo-800', icon: '🏠' },
    delivered: { label: 'Đã giao', color: 'bg-gray-100 text-gray-800', icon: '🎉' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: '❌' },
};

// Helper to read token safely on client
const getToken = () => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('eatnow_token'); } catch { return null; }
};

export default function DriverCurrentPage() {
    const [orders, setOrders] = useState<UiOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    async function load() {
        try {
            setLoading(true);
            console.log('Loading driver orders...');
            
            // Load all orders for this driver (backend already filters by driverId)
            const res: any = await driverService.getMyOrders({ 
                status: undefined, // Get all orders for this driver
                page: 1, 
                limit: 100 
            });
            console.log('Driver orders response:', res);
            const allOrders: any[] = Array.isArray(res) ? res : res?.orders || [];
            
            // Filter to only show incomplete orders (not delivered or cancelled)
            const incompleteOrders = allOrders.filter((order: any) => {
                const status = order.status?.toLowerCase();
                return status !== 'delivered' && status !== 'cancelled';
            });
            
            console.log('All driver orders:', allOrders.length);
            console.log('Incomplete orders:', incompleteOrders.length);
            console.log('Orders list:', incompleteOrders);
            setOrders(incompleteOrders.map((o: any) => ({
                id: o._id || o.id,
                code: o.orderNumber || o.code || o.id,
                pickup: o.restaurantId?.name || o.restaurantName || "",
                dropoff: o.customerId?.name || o.customerName || o.deliveryAddress?.recipientName || "",
                cod: typeof o.cod === 'number' ? o.cod : (o.paymentMethod === 'COD' ? (o.finalTotal || o.totalAmount || 0) : 0),
                status: o.status || "picking_up",
                totalAmount: o.totalAmount || o.total || 0,
                deliveryFee: o.deliveryFee || 0,
                subtotal: o.subtotal || o.itemsTotal || 0,
                tax: o.tax || 0,
                discount: o.discount || 0,
                createdAt: o.createdAt,
                restaurantAddress: o.restaurantId?.address || o.restaurantAddress || "",
                customerAddress: o.deliveryAddress?.addressLine || o.customerAddress || "",
                customerPhone: o.customerId?.phone || o.deliveryAddress?.recipientPhone || o.customerPhone || "",
                restaurantPhone: o.restaurantId?.phone || o.restaurantPhone || "",
                items: o.items || [],
                orderNote: o.orderNote || o.note || "",
                deliveryNote: o.deliveryNote || o.deliveryAddress?.note || "",
                paymentMethod: o.paymentMethod || "COD",
            })));
        } catch (e: any) {
            console.error('Error loading driver orders:', e);
            setError(e?.message || "Không tải được danh sách đơn");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function accept(id: string) {
        await driverService.acceptOrder(id);
        await load();
    }
    async function reject(id: string) {
        await driverService.rejectOrder(id, 'Từ chối đơn hàng');
        await load();
    }
    
    // 4 trạng thái chính cho tài xế
    async function arrivedAtRestaurant(id: string) {
        try {
            await driverService.updateOrderStatus(id, { status: 'arrived_at_restaurant' });
            await load();
        } catch (error) {
            console.error('Error updating status to arrived_at_restaurant:', error);
        }
    }
    
    async function pickedUpOrder(id: string) {
        try {
            await driverService.updateOrderStatus(id, { status: 'picked_up' });
            await load();
        } catch (error) {
            console.error('Error updating status to picked_up:', error);
        }
    }
    
    async function arrivedAtCustomer(id: string) {
        try {
            await driverService.updateOrderStatus(id, { status: 'arrived_at_customer' });
            await load();
        } catch (error) {
            console.error('Error updating status to arrived_at_customer:', error);
        }
    }
    
    async function completeOrder(id: string) {
        try {
            await driverService.updateOrderStatus(id, { status: 'delivered' });
            await load();
        } catch (error) {
            console.error('Error completing order:', error);
        }
    }
    
    async function cancelOrder(id: string) {
        try {
            if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Đơn hàng sẽ được gán lại cho tài xế khác.')) {
                await driverService.updateOrderStatus(id, { 
                    status: 'cancelled',
                    driverId: null, // Reset driverId để tìm tài xế khác
                    cancellationReason: 'Tài xế hủy đơn hàng'
                });
                await load();
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
        }
    }

    const empty = useMemo(() => !loading && orders.length === 0, [loading, orders.length]);

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
                        <p className="mt-1 text-gray-600">Tất cả đơn hàng chưa hoàn thành được gán cho bạn</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">
                                Chưa hoàn thành: <span className="font-semibold text-orange-600">{orders.length}</span> đơn hàng
                            </div>
                            {orders.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                    Bao gồm tất cả trạng thái chưa giao xong
                                </div>
                            )}
                        </div>
                        <a
                            href="/driver/history"
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            📋 Lịch sử
                        </a>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        <span className="ml-3 text-gray-600">Đang tải đơn hàng...</span>
                    </div>
                )}

                {empty && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                        <p className="text-gray-600 mb-4">Bạn hiện tại không có đơn hàng nào được gán</p>
                        <div className="space-y-2 text-sm text-gray-500 mb-6">
                            <p>• Truy cập bản đồ để tìm và nhận đơn hàng mới</p>
                            <p>• Chỉ hiển thị đơn hàng chưa hoàn thành (chưa giao xong)</p>
                            <p>• Đơn hàng đã giao xong sẽ không hiển thị ở đây</p>
                        </div>
                        <a 
                            href="/driver/dashboard" 
                            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                        >
                            🗺️ Xem bản đồ tìm đơn hàng
                        </a>
                    </div>
                )}

                {!loading && orders.length > 0 && (
                    <div className="space-y-4">
                        {orders.map((order, index) => {
                            const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.picking_up;
                            return (
                                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="text-2xl">{statusInfo.icon}</div>
                                    <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Đơn hàng #{order.code}
                                                        </h3>
                                                        {orders.length > 1 && (
                                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                                                #{index + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                        {order.createdAt && (
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    ₫{order.totalAmount?.toLocaleString() || '0'}
                                                </div>
                                                {order.deliveryFee > 0 && (
                                                    <div className="text-sm text-gray-500">
                                                        Phí ship: ₫{order.deliveryFee.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="px-6 py-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Restaurant Info */}
                                            <div className="space-y-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="text-orange-600 text-lg">🏪</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">Nhà hàng</h4>
                                                        <p className="text-gray-700 font-medium">{order.pickup}</p>
                                                        {order.restaurantAddress && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                📍 {order.restaurantAddress}
                                                            </p>
                                                        )}
                                                        {order.restaurantPhone && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                📞 {order.restaurantPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Customer Info */}
                                                <div className="flex items-start space-x-3">
                                                    <div className="text-blue-600 text-lg">👤</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">Khách hàng</h4>
                                                        <p className="text-gray-700 font-medium">{order.dropoff}</p>
                                                        {order.customerPhone && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                📞 {order.customerPhone}
                                                            </p>
                                                        )}
                                                        {order.customerAddress && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                📍 {order.customerAddress}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Info */}
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="font-medium text-gray-900 mb-3">Thông tin thanh toán</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Tạm tính:</span>
                                                            <span className="font-medium">₫{order.subtotal?.toLocaleString() || '0'}</span>
                                                        </div>
                                                        {order.discount > 0 && (
                                                            <div className="flex justify-between text-green-600">
                                                                <span>Giảm giá:</span>
                                                                <span>-₫{order.discount.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Phí ship:</span>
                                                            <span className="font-medium">₫{order.deliveryFee?.toLocaleString() || '0'}</span>
                                                        </div>
                                                        {order.tax > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Thuế:</span>
                                                                <span className="font-medium">₫{order.tax.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                                                            <span>Tổng cộng:</span>
                                                            <span className="text-orange-600">₫{order.totalAmount?.toLocaleString() || '0'}</span>
                                                        </div>
                                                        {order.cod > 0 && (
                                                            <div className="bg-yellow-100 rounded p-2 mt-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-yellow-600">💰</span>
                                                                    <span className="text-sm font-medium text-yellow-800">
                                                                        Thu hộ: ₫{order.cod.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-gray-100">
                                                <h4 className="font-medium text-gray-900 mb-3">Chi tiết món ăn</h4>
                                                <div className="space-y-2">
                                                    {order.items.map((item: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                            <div className="flex-1">
                                                                <span className="text-gray-700 font-medium">
                                                                    {item.quantity}x {item.name}
                                                                </span>
                                                                {item.note && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Ghi chú: {item.note}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="text-gray-900 font-semibold">
                                                                ₫{item.subtotal?.toLocaleString() || '0'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {(order.orderNote || order.deliveryNote) && (
                                            <div className="mt-6 pt-4 border-t border-gray-100">
                                                <h4 className="font-medium text-gray-900 mb-3">Ghi chú</h4>
                                                <div className="space-y-2">
                                                    {order.orderNote && (
                                                        <div className="bg-blue-50 rounded-lg p-3">
                                                            <div className="flex items-start space-x-2">
                                                                <span className="text-blue-600">📝</span>
                                                                <div>
                                                                    <p className="text-sm font-medium text-blue-800">Ghi chú đơn hàng:</p>
                                                                    <p className="text-sm text-blue-700 mt-1">{order.orderNote}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {order.deliveryNote && (
                                                        <div className="bg-green-50 rounded-lg p-3">
                                                            <div className="flex items-start space-x-2">
                                                                <span className="text-green-600">🚚</span>
                                                                <div>
                                                                    <p className="text-sm font-medium text-green-800">Ghi chú giao hàng:</p>
                                                                    <p className="text-sm text-green-700 mt-1">{order.deliveryNote}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                        <div className="space-y-3">
                                            {/* Status Progress */}
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Trạng thái hiện tại:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                    {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                                                </span>
                                            </div>

                                            {/* Action Buttons - Chỉ hiện 1 nút trạng thái theo trình tự */}
                                            <div className="space-y-3">
                                                {/* Nút trạng thái chính - chỉ hiện 1 nút theo trình tự */}
                                                <div className="flex justify-center">
                                                    {/* Đã đến quán */}
                                                    {order.status === "picking_up" && (
                                                        <button 
                                                            onClick={() => arrivedAtRestaurant(order.id)} 
                                                            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-lg"
                                                        >
                                                            🏪 Đã đến quán
                                                        </button>
                                                    )}
                                                    
                                                    {/* Đã lấy đơn */}
                                                    {order.status === "arrived_at_restaurant" && (
                                                        <button 
                                                            onClick={() => pickedUpOrder(order.id)} 
                                                            className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors text-lg"
                                                        >
                                                            📦 Đã lấy đơn
                                                        </button>
                                                    )}
                                                    
                                                    {/* Đã đến vị trí giao */}
                                                    {order.status === "picked_up" && (
                                                        <button 
                                                            onClick={() => arrivedAtCustomer(order.id)} 
                                                            className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-lg"
                                                        >
                                                            🏠 Đã đến vị trí giao
                                                        </button>
                                                    )}
                                                    
                                                    {/* Đã hoàn thành */}
                                                    {order.status === "arrived_at_customer" && (
                                                        <button 
                                                            onClick={() => completeOrder(order.id)} 
                                                            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-lg"
                                                        >
                                                            ✅ Đã hoàn thành
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Nút phụ - nhỏ và ở dưới */}
                                                <div className="flex gap-2 justify-center">
                                                    {/* Nút hủy đơn - nhỏ */}
                                                    {order.status !== "delivered" && order.status !== "cancelled" && (
                                                        <button 
                                                            onClick={() => cancelOrder(order.id)} 
                                                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                                                        >
                                                            ❌ Hủy
                                                        </button>
                                                    )}

                                                    {/* Nút gọi - hiện dropdown với 2 số */}
                                                    {(order.restaurantPhone || order.customerPhone) && (
                                                        <div className="relative">
                                                            <button 
                                                                onClick={() => {
                                                                    const numbers = [];
                                                                    if (order.restaurantPhone) numbers.push({ label: 'Nhà hàng', phone: order.restaurantPhone });
                                                                    if (order.customerPhone) numbers.push({ label: 'Khách hàng', phone: order.customerPhone });
                                                                    
                                                                    if (numbers.length === 1) {
                                                                        window.open(`tel:${numbers[0].phone}`);
                                                                    } else {
                                                                        // Hiện dropdown với 2 số
                                                                        const choice = confirm(`Chọn số để gọi:\n1. Nhà hàng: ${order.restaurantPhone}\n2. Khách hàng: ${order.customerPhone}\n\nOK = Nhà hàng, Cancel = Khách hàng`);
                                                                        const phone = choice ? order.restaurantPhone : order.customerPhone;
                                                                        if (phone) window.open(`tel:${phone}`);
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                                                            >
                                                                📞 Gọi
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Nút nhắn tin - nhỏ */}
                                                    <button 
                                                        onClick={() => {
                                                            // Toggle chat visibility
                                                            const chatElement = document.getElementById(`chat-${order.id}`);
                                                            if (chatElement) {
                                                                chatElement.style.display = chatElement.style.display === 'none' ? 'block' : 'none';
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                                                    >
                                                        💬 Chat
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Order Summary */}
                                            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                                <div className="flex justify-between">
                                                    <span>Mã đơn: #{order.code}</span>
                                                    <span>Phương thức: {order.paymentMethod === 'COD' ? 'Thu hộ' : 'Chuyển khoản'}</span>
                                                </div>
                                                {order.createdAt && (
                                                    <div className="mt-1">
                                                        <span>Thời gian đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Chat with Customer - Toggle visibility */}
                                        {typeof window !== 'undefined' && order.id && (
                                          <div id={`chat-${order.id}`} className="mt-4" style={{ display: 'none' }}>
                                            <OrderChat orderId={order.id} token={getToken() || ''} role={'driver'} />
                                          </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
