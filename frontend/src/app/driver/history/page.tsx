"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDriverAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/driver/EmptyState";
import driverService from "@/services/driver.service";

type OrderHistory = { 
  _id: string; 
  orderNumber: string; 
  createdAt: string; 
  customerName: string; 
  totalAmount: number; 
  status: string;
  deliveryFee: number;
};

export default function DriverHistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useDriverAuth();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadOrderHistory();
    }
  }, [isAuthenticated, authLoading, status, page, limit, from, to]);

  const loadOrderHistory = async () => {
    setLoading(true);
    try {
      const res: any = await driverService.getOrderHistory({ page, limit, status: status || undefined });
      const data = (res?.orders || res?.data || []) as any[];
      setOrders(data.map((o: any) => ({
        _id: o.id || o._id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt || o.deliveredAt || o.actualDeliveryTime || new Date().toISOString(),
        customerName: o.customerName || o.customer || '—',
        totalAmount: o.finalTotal || o.total || 0,
        deliveryFee: o.deliveryFee || 0,
        status: o.status || 'delivered',
      })));
      const pg = res?.pagination;
      setTotal(pg?.total || data.length);
    } catch (error) {
      console.error('Error loading order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    return orders.filter((r) => {
      if (from && r.createdAt < from) return false;
      if (to && r.createdAt > to) return false;
      return true;
    });
  }, [from, to, orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy',
      'completed': 'Hoàn thành',
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div>
            <label className="block text-sm text-gray-600">Trạng thái</label>
            <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} className="rounded-md border px-3 py-2">
              <option value="">Tất cả</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
              <option value="pending">Đang xử lý</option>
            </select>
          </div>
        </div>
      </main>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
        
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm text-gray-600">Từ ngày</label>
            <input 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              type="date" 
              className="rounded-md border px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Đến ngày</label>
            <input 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              type="date" 
              className="rounded-md border px-3 py-2" 
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
          {data.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Phí giao</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.map((order) => (
                  <tr key={order._id} className="border-t">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">{formatCurrency(order.deliveryFee)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Chưa có đơn hàng" subtitle="Lịch sử đơn hàng sẽ hiển thị ở đây" />
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Trang {page}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50">Trước</button>
            <button disabled={orders.length < limit} onClick={()=>setPage((p)=>p+1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50">Sau</button>
            <select value={limit} onChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(1); }} className="rounded-md border px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </main>
  );
}
