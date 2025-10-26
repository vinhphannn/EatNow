"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type OrderDetail = {
  _id: string;
  code?: string;
  restaurantId?: { _id: string; name?: string; address?: string } | string;
  customerId?: { _id: string; name?: string; phone?: string } | string;
  driverId?: { _id: string; name?: string; phone?: string } | string;
  items?: Array<{ name: string; price: number; quantity: number; subtotal?: number }>;
  deliveryAddress?: { label?: string; addressLine?: string; latitude?: number; longitude?: number; note?: string };
  total?: number;
  deliveryFee?: number;
  finalTotal?: number;
  status?: string;
  createdAt?: string;
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${api}/orders/${id}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setOrder(json);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Không tải được chi tiết đơn hàng');
      } finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [api, id]);

  const r = order;
  const restaurant = r && (typeof r.restaurantId === 'object' ? r.restaurantId : undefined);
  const customer = r && (typeof r.customerId === 'object' ? r.customerId : undefined);
  const driver = r && (typeof r.driverId === 'object' ? r.driverId : undefined);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
          <button onClick={() => router.push('/admin/orders')} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Quay lại</button>
        </div>

        {loading && (
          <div className="rounded border bg-white p-4">Đang tải...</div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}
        {!loading && r && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Thông tin chung</h2>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-500">Mã đơn:</span> <span className="font-medium">{r.code || r._id}</span></div>
                <div><span className="text-gray-500">Trạng thái:</span> <span className="font-medium">{r.status}</span></div>
                <div><span className="text-gray-500">Thời gian đặt:</span> <span className="font-medium">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '—'}</span></div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Nhà hàng</h2>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-500">Tên quán:</span> <span className="font-medium">{restaurant?.name || '—'}</span></div>
                <div><span className="text-gray-500">Đ/c quán:</span> <span className="font-medium">{(restaurant as any)?.address || '—'}</span></div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Khách hàng</h2>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-500">Tên:</span> <span className="font-medium">{customer?.name || '—'}</span></div>
                <div>
                  <span className="text-gray-500">SĐT:</span> <span className="font-medium">{customer?.phone || '—'}</span>
                  {!customer?.phone && (
                    <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Thiếu SĐT người nhận</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Đ/c giao:</span> <span className="font-medium">{r.deliveryAddress?.addressLine || r.deliveryAddress?.label || '—'}</span>
                  {!(r.deliveryAddress?.addressLine || r.deliveryAddress?.label) && (
                    <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Thiếu địa chỉ giao</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Tài xế</h2>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-500">Tên tài xế:</span> <span className="font-medium">{driver?.name || 'Chưa chỉ định'}</span></div>
                <div><span className="text-gray-500">SĐT tài xế:</span> <span className="font-medium">{driver?.phone || (driver ? '—' : 'Chưa chỉ định')}</span></div>
                <div><span className="text-gray-500">Mã tài xế:</span> <span className="font-medium">{(driver as any)?._id || (driver ? '—' : 'Chưa chỉ định')}</span></div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 md:col-span-2">
              <h2 className="mb-3 text-lg font-semibold">Món</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Tên món</th>
                      <th className="px-3 py-2">Số lượng</th>
                      <th className="px-3 py-2">Giá</th>
                      <th className="px-3 py-2">Tạm tính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.items || []).map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2">{new Intl.NumberFormat('vi-VN').format(it.price)} đ</td>
                        <td className="px-3 py-2">{new Intl.NumberFormat('vi-VN').format((it.subtotal ?? (it.price * it.quantity)))} đ</td>
                      </tr>
                    ))}
                    {(!r.items || r.items.length === 0) && (
                      <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">Không có món</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="text-sm"><span className="text-gray-500">Tổng tiền món:</span> <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(r.total || 0)} đ</span></div>
                <div className="text-sm"><span className="text-gray-500">Phí ship:</span> <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(r.deliveryFee || 0)} đ</span></div>
                <div className="text-sm"><span className="text-gray-500">Tổng thanh toán:</span> <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(r.finalTotal || 0)} đ</span></div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 md:col-span-2">
              <h2 className="mb-3 text-lg font-semibold">Lịch sử trạng thái</h2>
              <div className="space-y-2">
                {Array.isArray((r as any).trackingHistory) && (r as any).trackingHistory.length > 0 ? (
                  [...(r as any).trackingHistory]
                    .sort((a: any, b: any) => new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime())
                    .map((h: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{String(h.status)}</div>
                          {h.note ? (<div className="text-gray-600">{h.note}</div>) : null}
                        </div>
                        <div className="text-right text-gray-600">
                          <div>{h.timestamp ? new Date(h.timestamp).toLocaleString('vi-VN') : ''}</div>
                          <div className="text-xs">{h.updatedBy ? `bởi ${h.updatedBy}` : ''}</div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-500">Chưa có lịch sử</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
