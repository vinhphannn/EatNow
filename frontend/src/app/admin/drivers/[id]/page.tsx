"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type DriverDetail = {
  id: string;
  userId?: string;
  status: string;
  createdAt?: string;
  user?: { id: string; email: string; name?: string; phone?: string; isActive?: boolean } | null;
  metrics?: { completed?: number; rating?: number };
};

export default function AdminDriverDetailPage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/v1';
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<DriverDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<{ id: string; action: string; reason?: string; createdAt?: string }[]>([]);
  const [showBanModal, setShowBanModal] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string>("");
  const [showWarnModal, setShowWarnModal] = useState<boolean>(false);
  const [warnMessage, setWarnMessage] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${api}/admin/drivers/${id}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
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

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${api}/admin/drivers/${id}/logs`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setLogs(Array.isArray(json) ? json : []);
      } catch {}
    })();
    return () => ctrl.abort();
  }, [api, id, data?.status]);

  const setStatus = async (nextStatus: string) => {
    try {
      const res = await fetch(`${api}/admin/drivers/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      if (!res.ok) throw new Error('Update failed');
      setData(d => d ? { ...d, status: nextStatus } : d);
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const submitBan = async () => {
    // If backend supports 'banned', reuse status
    await setStatus('banned');
    setShowBanModal(false);
    setBanReason("");
  };

  const submitWarn = async () => {
    try {
      const res = await fetch(`${api}/admin/drivers/${id}/warn`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: warnMessage }) });
      if (!res.ok) throw new Error('Warn failed');
      setShowWarnModal(false); setWarnMessage("");
      alert('Đã gửi cảnh báo');
    } catch {
      alert('Gửi cảnh báo thất bại');
    }
  };

  const toggleOwnerActive = async (active: boolean) => {
    if (!data?.user?.id) return;
    try {
      const res = await fetch(`${api}/admin/users/${data.user.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active }) });
      if (!res.ok) throw new Error('Owner update failed');
      setData(d => d ? { ...d, user: d.user ? { ...d.user, isActive: active } : d.user } : d);
      alert(active ? 'Đã mở khóa user' : 'Đã khóa user');
    } catch {
      alert('Cập nhật user thất bại');
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {(data.status === 'banned' || data.user?.isActive === false) && (
          <div className={`mb-4 rounded-md px-4 py-3 text-sm ${data.status === 'banned' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'} border`}>
            {data.status === 'banned' ? 'Tài xế đã bị khóa vĩnh viễn.' : 'Tài khoản user đã bị khóa.'}
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900">Tài xế #{data.id}</h1>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="mt-1"><span className={`rounded-full px-2 py-0.5 text-xs ${data.status==='active'?'bg-green-100 text-green-700': data.status==='suspended'?'bg-amber-100 text-amber-700': data.status==='banned'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-700'}`}>{data.status}</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.status !== 'active' && (
                  <button onClick={()=> setStatus('active')} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Kích hoạt</button>
                )}
                {data.status === 'active' && (
                  <button onClick={()=> setStatus('suspended')} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Tạm dừng</button>
                )}
                <button onClick={()=> setShowBanModal(true)} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Ban vĩnh viễn</button>
                <button onClick={()=> setShowWarnModal(true)} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700">Gửi cảnh báo</button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Thông tin tài xế</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-gray-700">
                <div><span className="font-medium">Driver ID:</span> {data.id}</div>
                <div><span className="font-medium">User ID:</span> {data.userId || '—'}</div>
                <div><span className="font-medium">Email:</span> {data.user?.email || '—'}</div>
                <div><span className="font-medium">Tên:</span> {data.user?.name || '—'}</div>
                <div><span className="font-medium">SĐT:</span> {data.user?.phone || '—'}</div>
                <div><span className="font-medium">Online:</span> {'—'}</div>
                <div><span className="font-medium">Đã hoàn thành:</span> {data.metrics?.completed ?? 0}</div>
                <div><span className="font-medium">Rating:</span> {data.metrics?.rating ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">User</div>
              <div className="mt-2 text-sm text-gray-700">
                {data.user ? (
                  <div className="space-y-1">
                    <div><span className="font-medium">Email:</span> {data.user.email}</div>
                    <div><span className="font-medium">Trạng thái:</span> {data.user.isActive === false ? 'Đã khóa' : 'Đang hoạt động'}</div>
                    <div className="pt-2 flex items-center gap-2">
                      {data.user.isActive === false ? (
                        <button onClick={()=> toggleOwnerActive(true)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700">Mở khóa user</button>
                      ) : (
                        <button onClick={()=> toggleOwnerActive(false)} className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700">Khóa user</button>
                      )}
                      <a href={`/admin/customers?userId=${data.user.id}`} className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">Xem user</a>
                    </div>
                  </div>
                ) : 'Không có thông tin user'}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Log gần đây</div>
              <ul className="space-y-2 text-sm">
                {logs.map(l => (
                  <li key={l.id} className="rounded border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{l.action}</span>
                      <span className="text-gray-500">{l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : ''}</span>
                    </div>
                    {l.reason && (<div className="text-gray-700">{l.reason}</div>)}
                  </li>
                ))}
                {logs.length === 0 && (<li className="text-gray-500">Chưa có log</li>)}
              </ul>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Liên kết nhanh</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li><a className="text-orange-600 hover:underline" href={`/admin/orders?driverId=${id}`}>Xem tất cả đơn hàng của tài xế này</a></li>
                <li><a className="text-orange-600 hover:underline" href={`/admin/drivers/${id}/logs`}>Xem tất cả cảnh báo / logs</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="text-lg font-semibold">Ban vĩnh viễn tài xế</div>
            <div className="mt-2 text-sm text-gray-600">Nhập lý do (hiện chỉ log, chưa lưu kèm driver):</div>
            <textarea value={banReason} onChange={(e)=> setBanReason(e.target.value)} className="mt-3 w-full rounded-md border px-3 py-2 text-sm" rows={3} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=> setShowBanModal(false)} className="rounded-md border px-3 py-1.5 text-sm">Hủy</button>
              <button onClick={submitBan} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Warn Modal */}
      {showWarnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="text-lg font-semibold">Gửi cảnh báo</div>
            <div className="mt-2 text-sm text-gray-600">Nhập nội dung cảnh báo:</div>
            <textarea value={warnMessage} onChange={(e)=> setWarnMessage(e.target.value)} className="mt-3 w-full rounded-md border px-3 py-2 text-sm" rows={3} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=> setShowWarnModal(false)} className="rounded-md border px-3 py-1.5 text-sm">Hủy</button>
              <button onClick={submitWarn} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700">Gửi</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


