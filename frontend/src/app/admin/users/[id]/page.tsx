"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserRole } from "@/types/auth";

type UserDetail = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
};

export default function AdminUserDetailPage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/v1';
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<{ id: string; action: string; reason?: string; createdAt?: string }[]>([]);
  const [showBanModal, setShowBanModal] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string>("");
  const [showWarnModal, setShowWarnModal] = useState<boolean>(false);
  const [warnMessage, setWarnMessage] = useState<string>("");
  const roleBadge = (role: string) => {
    switch(role) {
      case UserRole.ADMIN: return 'bg-gray-100 text-gray-700';
      case UserRole.CUSTOMER: return 'bg-blue-100 text-blue-700';
      case UserRole.RESTAURANT: return 'bg-green-100 text-green-700';
      case UserRole.DRIVER: return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${api}/admin/users/${id}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
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
        const res = await fetch(`${api}/admin/users/${id}/logs`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setLogs(Array.isArray(json) ? json : []);
      } catch {}
    })();
    return () => ctrl.abort();
  }, [api, id, data?.isActive]);

  const setActive = async (active: boolean) => {
    try {
      const res = await fetch(`${api}/admin/users/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active }) });
      if (!res.ok) throw new Error('Update failed');
      setData(d => d ? { ...d, isActive: active } : d);
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const submitWarn = async () => {
    try {
      const res = await fetch(`${api}/admin/users/${id}/warn`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: warnMessage }) });
      if (!res.ok) throw new Error('Warn failed');
      setShowWarnModal(false); setWarnMessage("");
      alert('Đã gửi cảnh báo');
    } catch {
      alert('Gửi cảnh báo thất bại');
    }
  };

  const submitNote = async () => {
    try {
      const res = await fetch(`${api}/admin/users/${id}/notes`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: banReason }) });
      if (!res.ok) throw new Error('Note failed');
      setShowBanModal(false); setBanReason("");
      alert('Đã lưu ghi chú');
    } catch {
      alert('Lưu ghi chú thất bại');
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {data.isActive === false && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tài khoản người dùng đã bị khóa.
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900">User #{data.id}</h1>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Thông tin người dùng</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-gray-700">
                <div><span className="font-medium">ID:</span> {data.id}</div>
                <div><span className="font-medium">Email:</span> {data.email}</div>
                <div><span className="font-medium">Tên:</span> {data.name || '—'}</div>
                <div><span className="font-medium">SĐT:</span> {data.phone || '—'}</div>
                <div><span className="font-medium">Vai trò:</span> <span className={`rounded-full px-2 py-0.5 text-xs ${roleBadge(data.role)}`}>{data.role}</span></div>
                <div><span className="font-medium">Ngày tạo:</span> {data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '—'}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.isActive === false ? (
                  <button onClick={()=> setActive(true)} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Mở khóa</button>
                ) : (
                  <button onClick={()=> setActive(false)} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Khóa</button>
                )}
                <button onClick={()=> setShowWarnModal(true)} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700">Gửi cảnh báo</button>
                <button onClick={()=> setShowBanModal(true)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Thêm ghi chú</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
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
                {data.role === UserRole.RESTAURANT && (<li><a className="text-orange-600 hover:underline" href={`/admin/restaurants?ownerId=${data.id}`}>Nhà hàng thuộc user này</a></li>)}
                {data.role === UserRole.DRIVER && (<li><a className="text-orange-600 hover:underline" href={`/admin/drivers/${data.id}`}>Trang tài xế</a></li>)}
                {data.role === UserRole.CUSTOMER && (<li><a className="text-orange-600 hover:underline" href={`/admin/orders?customerId=${data.id}`}>Đơn hàng của khách này</a></li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

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

      {/* Note Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="text-lg font-semibold">Thêm ghi chú</div>
            <div className="mt-2 text-sm text-gray-600">Nhập nội dung ghi chú:</div>
            <textarea value={banReason} onChange={(e)=> setBanReason(e.target.value)} className="mt-3 w-full rounded-md border px-3 py-2 text-sm" rows={3} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=> setShowBanModal(false)} className="rounded-md border px-3 py-1.5 text-sm">Hủy</button>
              <button onClick={submitNote} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


