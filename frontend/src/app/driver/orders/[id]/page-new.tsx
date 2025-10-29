"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { driverService } from "@/services/driver.service";

type OrderDetail = {
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    deliveryFee: number;
    subtotal: number;
    tax: number;
    discount: number;
    createdAt: string;
    restaurant: {
        name: string;
        address: string;
        phone?: string;
    };
    customer: {
        name: string;
        phone: string;
        address: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        subtotal: number;
        note?: string;
    }>;
    paymentMethod: string;
    cod: number;
    orderNote: string;
    deliveryNote: string;
    trackingHistory?: Array<{
        status: string;
        timestamp: string;
        note?: string;
        updatedBy: string;
    }>;
};

const statusSteps = [
    { key: 'pending', label: 'Chờ xác nhận', icon: '⏳', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'confirmed', label: 'Đã xác nhận', icon: '✅', color: 'bg-blue-100 text-blue-800' },
    { key: 'preparing', label: 'Đang chuẩn bị', icon: '👨‍🍳', color: 'bg-orange-100 text-orange-800' },
    { key: 'ready', label: 'Sẵn sàng lấy', icon: '📦', color: 'bg-purple-100 text-purple-800' },
    { key: 'picking_up', label: 'Đang lấy hàng', icon: '🚗', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'delivering', label: 'Đang giao hàng', icon: '🏍️', color: 'bg-green-100 text-green-800' },
    { key: 'delivered', label: 'Đã giao xong', icon: '🎉', color: 'bg-gray-100 text-gray-800' },
];

export default function DriverOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    
    console.log('DriverOrderDetailPage - params:', params);
    console.log('DriverOrderDetailPage - orderId:', orderId);
    
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        console.log('OrderDetailPage mounted with orderId:', orderId);
        if (orderId) {
            loadOrder();
        } else {
            console.error('No orderId provided');
            setError('Không có ID đơn hàng');
        }
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Loading order with ID:', orderId);
            
            const orderData = await driverService.getOrderById(orderId);
            console.log('Raw API response:', orderData);
            
            // Map the API response to our UI format
            const mappedOrder: OrderDetail = {
                id: (orderData as any)._id || orderData.id,
                code: (orderData as any).orderNumber || orderData.code || orderData.id,
                status: orderData.status || 'pending',
                totalAmount: (orderData as any).totalAmount || (orderData as any).total || 0,
                deliveryFee: (orderData as any).deliveryFee || 0,
                subtotal: (orderData as any).subtotal || (orderData as any).itemsTotal || 0,
                tax: (orderData as any).tax || 0,
                discount: (orderData as any).discount || 0,
                createdAt: (orderData as any).createdAt,
                restaurant: {
                    name: (orderData as any).restaurantId?.name || 'N/A',
                    address: (orderData as any).restaurantId?.address || '',
                    phone: (orderData as any).restaurantId?.phone || '',
                },
                customer: {
                    name: (orderData as any).customerId?.name || 'N/A',
                    phone: (orderData as any).customerId?.phone || '',
                    address: (orderData as any).deliveryAddress?.address || '',
                },
                items: (orderData as any).items || [],
                paymentMethod: (orderData as any).paymentMethod || 'COD',
                cod: (orderData as any).paymentMethod === 'COD' ? ((orderData as any).totalAmount || (orderData as any).total || 0) : 0,
                trackingHistory: (orderData as any).trackingHistory || [],
                orderNote: (orderData as any).orderNote || (orderData as any).note || '',
                deliveryNote: (orderData as any).deliveryNote || (orderData as any).deliveryAddress?.note || '',
            };
            
            console.log('Mapped order:', mappedOrder);
            setOrder(mappedOrder);
        } catch (e: any) {
            console.error('Error loading order:', e);
            setError(e?.message || "Không thể tải chi tiết đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (newStatus: string) => {
        try {
            setUpdating(true);
            console.log('Updating order status to:', newStatus);
            
            // Call appropriate driver service method based on status
            switch (newStatus) {
                case 'confirmed':
                    await driverService.acceptOrder(orderId);
                    break;
                case 'picking_up':
                    await driverService.updateOrderStatus(orderId, { status: 'arrived_at_restaurant' } as any);
                    break;
                case 'delivering':
                    await driverService.updateOrderStatus(orderId, { status: 'picked_up' } as any);
                    break;
                case 'delivered':
                    await driverService.updateOrderStatus(orderId, { status: 'delivered' } as any);
                    break;
                default:
                    throw new Error('Invalid status transition');
            }
            
            // Reload order data
            await loadOrder();
        } catch (e: any) {
            console.error('Error updating order status:', e);
            setError(e?.message || "Không thể cập nhật trạng thái đơn hàng");
        } finally {
            setUpdating(false);
        }
    };

    const sendMessage = () => {
        if (message.trim()) {
            console.log('Sending message:', message);
            // TODO: Implement message sending
            setMessage('');
        }
    };

    const getCurrentStepIndex = () => {
        if (!order) return -1;
        return statusSteps.findIndex(step => step.key === order.status);
    };

    const getNextAction = () => {
        if (!order) return null;
        
        switch (order.status) {
            case 'pending':
                return { label: 'Nhận đơn', action: 'confirmed', color: 'bg-orange-600 hover:bg-orange-700' };
            case 'confirmed':
                return { label: 'Đã đến quán', action: 'picking_up', color: 'bg-blue-600 hover:bg-blue-700' };
            case 'picking_up':
                return { label: 'Đã lấy đơn', action: 'delivering', color: 'bg-purple-600 hover:bg-purple-700' };
            case 'delivering':
                return { label: 'Đã giao xong', action: 'delivered', color: 'bg-green-600 hover:bg-green-700' };
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải chi tiết đơn hàng...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải đơn hàng</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        Quay lại
                    </button>
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải đơn hàng</h2>
                    <p className="text-gray-600 mb-4">Đơn hàng không tồn tại</p>
                    <button 
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        Quay lại
                    </button>
                </div>
            </main>
        );
    }

    const currentStepIndex = getCurrentStepIndex();
    const nextAction = getNextAction();

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Đơn hàng #{order.code}
                            </h1>
                            <p className="text-gray-600">Chi tiết đơn hàng</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                            ₫{order.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chi tiết món ăn</h2>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-500">₫{item.price.toLocaleString()} x {item.quantity}</p>
                                            {item.note && (
                                                <p className="text-sm text-blue-600 mt-1">Ghi chú: {item.note}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">₫{item.subtotal.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chi tiết thanh toán</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tạm tính:</span>
                                    <span className="font-medium">₫{order.subtotal.toLocaleString()}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá:</span>
                                        <span>-₫{order.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phí giao hàng:</span>
                                    <span className="font-medium">₫{order.deliveryFee.toLocaleString()}</span>
                                </div>
                                {order.tax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Thuế:</span>
                                        <span className="font-medium">₫{order.tax.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                                    <span>Tổng cộng:</span>
                                    <span className="text-orange-600">₫{order.totalAmount.toLocaleString()}</span>
                                </div>
                                {order.cod > 0 && (
                                    <div className="flex justify-between text-red-600 font-semibold bg-red-50 p-3 rounded-lg">
                                        <span>💰 Tiền thu hộ (COD):</span>
                                        <span>₫{order.cod.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Notes */}
                        {(order.orderNote || order.deliveryNote) && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ghi chú</h2>
                                <div className="space-y-3">
                                    {order.orderNote && (
                                        <div>
                                            <h3 className="font-medium text-gray-700 mb-1">Ghi chú đơn hàng:</h3>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.orderNote}</p>
                                        </div>
                                    )}
                                    {order.deliveryNote && (
                                        <div>
                                            <h3 className="font-medium text-gray-700 mb-1">Ghi chú địa chỉ giao hàng:</h3>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.deliveryNote}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Message Customer */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nhắn tin với khách hàng</h2>
                            <div className="space-y-3">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn cho khách hàng..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    rows={3}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Gửi tin nhắn
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Progress */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
                            <div className="space-y-4">
                                {statusSteps.map((step, index) => {
                                    const isCompleted = index < currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    
                                    return (
                                        <div key={step.key} className="flex items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3
                                                ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                                {isCompleted ? '✓' : step.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>
                                                    {step.label}
                                                </p>
                                                {isCurrent && (
                                                    <p className="text-xs text-gray-500">Trạng thái hiện tại</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Restaurant Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin nhà hàng</h2>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <span className="text-orange-600 mr-3">🏪</span>
                                    <div>
                                        <p className="font-medium text-gray-900">{order.restaurant.name}</p>
                                        <p className="text-sm text-gray-600">{order.restaurant.address}</p>
                                        {order.restaurant.phone && (
                                            <p className="text-sm text-gray-600">📞 {order.restaurant.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <span className="text-blue-600 mr-3">👤</span>
                                    <div>
                                        <p className="font-medium text-gray-900">{order.customer.name}</p>
                                        <p className="text-sm text-gray-600">📞 {order.customer.phone}</p>
                                        <p className="text-sm text-gray-600">📍 {order.customer.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        {nextAction && (order.status !== 'delivered' && order.status !== 'cancelled') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <button
                                    onClick={() => updateOrderStatus(nextAction.action)}
                                    disabled={updating}
                                    className={`w-full px-4 py-3 text-white rounded-lg font-semibold text-lg transition-colors duration-200
                                        ${nextAction.color} ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {updating ? 'Đang cập nhật...' : nextAction.label}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
