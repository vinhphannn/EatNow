"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderRow = {
  id: string;
  code: string;
  customer?: { id: string; name?: string; email?: string };
  restaurant?: { id: string; name?: string };
  driver?: { id: string; name?: string };
  total: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
};

const IN_PROGRESS = ["pending","accepted","preparing","delivering"];
const DONE = ["completed","cancelled","refunded"];

export default function AdminOrdersPage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

  const [tab, setTab] = useState<'progress'|'done'>("progress");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [data, setData] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(limit));
    const defaults = tab === 'progress' ? IN_PROGRESS : DONE;
    if (status) p.set('status', status); else p.set('status', defaults.join(','));
    if (paymentStatus) p.set('paymentStatus', paymentStatus);
    if (restaurantId) p.set('restaurantId', restaurantId);
    if (driverId) p.set('driverId', driverId);
    if (customerId) p.set('customerId', customerId);
    if (fromDate) p.set('from', fromDate);
    if (toDate) p.set('to', toDate);
    return p.toString();
  }, [page, limit, tab, status, paymentStatus, restaurantId, driverId, customerId, fromDate, toDate]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${api}/admin/orders?${query}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows: OrderRow[] = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        setData(rows);
        setTotal(Number(json?.meta?.total ?? json?.total ?? rows.length));
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Tải dữ liệu thất bại');
        setData([]); setTotal(0);
      } finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [api, query]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-2">
          <button onClick={()=> { setTab('progress'); setPage(1); }} className={`rounded-md px-3 py-1.5 text-sm ${tab==='progress'?'bg-gray-900 text-white':'border'}`}>Đang thực hiện</button>
          <button onClick={()=> { setTab('done'); setPage(1); }} className={`rounded-md px-3 py-1.5 text-sm ${tab==='done'?'bg-gray-900 text-white':'border'}`}>Đã hoàn thành</button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <select value={status} onChange={(e)=> { setPage(1); setStatus(e.target.value); }} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Status (all in tab)</option>
            {[...IN_PROGRESS, ...DONE].map(s=> (<option key={s} value={s}>{s}</option>))}
          </select>
          <select value={paymentStatus} onChange={(e)=> { setPage(1); setPaymentStatus(e.target.value); }} className="rounded-md border px-3 py-2 text-sm">
            <option value="">Payment (all)</option>
            <option value="paid">paid</option>
            <option value="unpaid">unpaid</option>
            <option value="refunded">refunded</option>
          </select>
          <input value={restaurantId} onChange={(e)=> { setPage(1); setRestaurantId(e.target.value); }} placeholder="restaurantId" className="rounded-md border px-3 py-2 text-sm" />
          <input value={driverId} onChange={(e)=> { setPage(1); setDriverId(e.target.value); }} placeholder="driverId" className="rounded-md border px-3 py-2 text-sm" />
          <input value={customerId} onChange={(e)=> { setPage(1); setCustomerId(e.target.value); }} placeholder="customerId" className="rounded-md border px-3 py-2 text-sm" />
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={(e)=> { setPage(1); setFromDate(e.target.value); }} className="rounded-md border px-3 py-2 text-sm" />
            <input type="date" value={toDate} onChange={(e)=> { setPage(1); setToDate(e.target.value); }} className="rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        {error && <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {/* Table */}
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Tổng</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>)}
              {!loading && data.map((o)=> (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{o.code || o.id}</td>
                  <td className="px-4 py-3">{o.customer?.name || o.customer?.email || '—'}</td>
                  <td className="px-4 py-3">{o.restaurant?.name || '—'}</td>
                  <td className="px-4 py-3">{o.driver?.name || '—'}</td>
                  <td className="px-4 py-3">{new Intl.NumberFormat('vi-VN').format(o.total || 0)} đ</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{o.status}</span></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{o.paymentStatus || '—'}</span></td>
                  <td className="px-4 py-3">{o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">Chi tiết</Link>
                  </td>
                </tr>
              ))}
              {!loading && data.length === 0 && (<tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Trang {page} / {totalPages} • Tổng {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
            <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
            <select value={limit} onChange={(e)=> { setPage(1); setLimit(Number(e.target.value)); }} className="rounded-lg border px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </main>
  );
}
