"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type OrderDetail = {
  id: string;
  code?: string;
  status: string;
  paymentStatus?: string;
  total: number;
  createdAt?: string;
  customer?: { id: string; name?: string; email?: string };
  restaurant?: { id: string; name?: string };
  driver?: { id: string; name?: string };
  items?: { name: string; quantity: number; price: number }[];
};

export default function AdminOrderDetailPage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/v1';
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${api}/admin/orders/${id}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Tải dữ liệu thất bại');
      } finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [api, id]);

  const cancelOrder = async () => {
    try {
      // placeholder
      alert('Hủy đơn (placeholder)');
    } catch {}
  };

  const refundOrder = async () => {
    try {
      // placeholder
      alert('Refund (placeholder)');
    } catch {}
  };

  const saveNote = async () => {
    try {
      // placeholder
      alert('Đã lưu ghi chú');
      setNote("");
    } catch {}
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng {data.code || data.id}</h1>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-gray-100 px-2 py-0.5">Trạng thái: {data.status}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">Thanh toán: {data.paymentStatus || '—'}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">Tổng: {new Intl.NumberFormat('vi-VN').format(data.total)} đ</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">Tạo lúc: {data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '—'}</span>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Các món</div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Tên món</th>
                    <th className="px-3 py-2">SL</th>
                    <th className="px-3 py-2">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items||[]).map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2">{it.quantity}</td>
                      <td className="px-3 py-2">{new Intl.NumberFormat('vi-VN').format(it.price)} đ</td>
                    </tr>
                  ))}
                  {(!data.items || data.items.length===0) && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">Không có món</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Thông tin liên quan</div>
              <div className="space-y-1 text-sm text-gray-700">
                <div><span className="font-medium">Khách:</span> {data.customer?.name || data.customer?.email || '—'}</div>
                <div><span className="font-medium">Nhà hàng:</span> {data.restaurant?.name || '—'}</div>
                <div><span className="font-medium">Tài xế:</span> {data.driver?.name || '—'}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Ghi chú admin</div>
              <textarea value={note} onChange={(e)=> setNote(e.target.value)} placeholder="Ghi chú..." className="w-full rounded-md border px-3 py-2 text-sm" rows={3} />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={saveNote} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Lưu ghi chú</button>
                <button onClick={cancelOrder} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Hủy đơn</button>
                <button onClick={refundOrder} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700">Refund</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


