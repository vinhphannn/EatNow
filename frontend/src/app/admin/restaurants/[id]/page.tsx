"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Detail = {
  id: string;
  name: string;
  status: string;
  banReason?: string;
  description?: string;
  address?: string;
  openingHours?: string;
  city?: string;
  ownerUserId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ItemRow = { id: string; name: string; price: number; type: string; isActive: boolean; createdAt?: string };

export default function AdminRestaurantDetailPage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/v1';
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [showBanModal, setShowBanModal] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string>("");
  const [showWarnModal, setShowWarnModal] = useState<boolean>(false);
  const [warnMessage, setWarnMessage] = useState<string>("");
  const [logs, setLogs] = useState<{ id: string; action: string; reason?: string; createdAt?: string }[]>([]);
  const [owner, setOwner] = useState<{ id: string; email: string; name?: string; phone?: string; role?: string; isActive?: boolean } | null>(null);
  const [ownerLoading, setOwnerLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${api}/restaurants/${id}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
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
    if (!data?.ownerUserId) return;
    const ctrl = new AbortController();
    (async () => {
      setOwnerLoading(true);
      try {
        const res = await fetch(`${api}/admin/users/${data.ownerUserId}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Fetch owner failed');
        const json = await res.json();
        setOwner(json);
      } catch {
        setOwner(null);
      } finally { setOwnerLoading(false); }
    })();
    return () => ctrl.abort();
  }, [api, data?.ownerUserId]);

  const toggleOwnerActive = async (active: boolean) => {
    if (!owner?.id) return;
    try {
      const res = await fetch(`${api}/admin/users/${owner.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active })
      });
      if (!res.ok) throw new Error('Owner update failed');
      setOwner(o => o ? { ...o, isActive: active } : o);
      alert(active ? 'Đã mở khóa owner' : 'Đã khóa owner');
    } catch {
      alert('Cập nhật owner thất bại');
    }
  };

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      setItemsLoading(true);
      try {
        const res = await fetch(`${api}/restaurants/${id}/items?sortBy=createdAt&order=desc`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setItems(Array.isArray(json) ? json.slice(0, 10) : []);
      } catch (e) {
        setItems([]);
      } finally { setItemsLoading(false); }
    })();
    return () => ctrl.abort();
  }, [api, id]);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${api}/admin/restaurants/${id}/logs`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setLogs(Array.isArray(json) ? json : []);
      } catch {}
    })();
    return () => ctrl.abort();
  }, [api, id, data?.status]);

  const setStatus = async (nextStatus: string) => {
    if (!id) return;
    try {
      const res = await fetch(`${api}/restaurants/${id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(d => d ? { ...d, status: nextStatus } : d);
    } catch (e) {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const lockRestaurant = async (locked: boolean) => {
    // For now reuse status suspended/active to simulate lock/unlock
    await setStatus(locked ? 'suspended' : 'active');
  };

  const saveAdminNote = async () => {
    try {
      const res = await fetch(`${api}/admin/restaurants/${id}/notes`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error('Save note failed');
      setNote("");
      alert('Đã lưu ghi chú');
    } catch (e) {
      alert('Lưu ghi chú thất bại');
    }
  };

  const submitBan = async () => {
    try {
      const res = await fetch(`${api}/restaurants/${id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'banned', banReason })
      });
      if (!res.ok) throw new Error('Ban failed');
      setData(d => d ? { ...d, status: 'banned', banReason } as any : d);
      setShowBanModal(false);
      setBanReason("");
      alert('Đã khóa vĩnh viễn');
    } catch {
      alert('Khóa vĩnh viễn thất bại');
    }
  };

  const submitWarn = async () => {
    try {
      const res = await fetch(`${api}/admin/restaurants/${id}/warn`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: warnMessage })
      });
      if (!res.ok) throw new Error('Warn failed');
      setShowWarnModal(false);
      setWarnMessage("");
      alert('Đã gửi cảnh báo');
    } catch {
      alert('Gửi cảnh báo thất bại');
    }
  };

  const toggleItemActive = async (itemId: string, current: boolean) => {
    try {
      const res = await fetch(`${api}/restaurants/items/${itemId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current })
      });
      if (!res.ok) throw new Error('Toggle failed');
      setItems(list => list.map(it => it.id === itemId ? { ...it, isActive: !current } : it));
    } catch {
      alert('Không thể cập nhật món');
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {data.status === 'banned' && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Nhà hàng đã bị khóa vĩnh viễn. Lý do: {data.banReason || '—'}
          </div>
        )}
        {owner && owner.isActive === false && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tài khoản chủ quán đã bị khóa. Email: {owner.email}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="mt-1"><span className={`rounded-full px-2 py-0.5 text-xs ${data.status==='active'?'bg-green-100 text-green-700': data.status==='pending'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-700'}`}>{data.status}</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.status !== 'active' && (
                  <button onClick={()=> setStatus('active')} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Kích hoạt</button>
                )}
                {data.status === 'active' && (
                  <button onClick={()=> setStatus('suspended')} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Tạm dừng</button>
                )}
                <button onClick={()=> setShowBanModal(true)} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Ban vĩnh viễn</button>
                <button onClick={()=> setShowWarnModal(true)} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700">Gửi cảnh báo</button>
                <button onClick={()=> lockRestaurant(false)} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Mở khóa</button>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="mt-1 text-gray-800 whitespace-pre-wrap">{data.description || '—'}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Địa chỉ</div>
              <div className="mt-1 text-gray-800">{data.address || '—'}</div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Menu (10 món gần nhất)</div>
              {itemsLoading ? (
                <div className="text-sm text-gray-500">Đang tải món...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2">Tên</th>
                        <th className="px-3 py-2">Giá</th>
                        <th className="px-3 py-2">Loại</th>
                        <th className="px-3 py-2">Trạng thái</th>
                        <th className="px-3 py-2">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(it => (
                        <tr key={it.id} className="border-t">
                          <td className="px-3 py-2">{it.name}</td>
                          <td className="px-3 py-2">{new Intl.NumberFormat('vi-VN').format(it.price)} đ</td>
                          <td className="px-3 py-2">{it.type}</td>
                          <td className="px-3 py-2">{it.isActive ? 'Đang bán' : 'Ẩn'}</td>
                          <td className="px-3 py-2">
                            <button onClick={()=> toggleItemActive(it.id, it.isActive)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
                              {it.isActive ? 'Ẩn món' : 'Hiện món'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">Không có món</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3">
                <a href={`/admin/items?restaurantId=${id}`} className="text-sm text-orange-600 hover:underline">Xem tất cả món</a>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Chủ quán</div>
              <div className="mt-2 text-sm text-gray-700">
                {ownerLoading ? 'Đang tải...' : owner ? (
                  <div className="space-y-1">
                    <div><span className="font-medium">ID:</span> {owner.id}</div>
                    <div><span className="font-medium">Email:</span> {owner.email}</div>
                    <div><span className="font-medium">Tên:</span> {owner.name || '—'}</div>
                    <div><span className="font-medium">SĐT:</span> {owner.phone || '—'}</div>
                    <div><span className="font-medium">Trạng thái:</span> {owner.isActive === false ? 'Đã khóa' : 'Đang hoạt động'}</div>
                    <div className="pt-2 flex items-center gap-2">
                      {owner.isActive === false ? (
                        <button onClick={()=> toggleOwnerActive(true)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700">Mở khóa owner</button>
                      ) : (
                        <button onClick={()=> toggleOwnerActive(false)} className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700">Khóa owner</button>
                      )}
                      <a href={`/admin/customers?userId=${owner.id}`} className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">Xem user</a>
                    </div>
                  </div>
                ) : 'Không có thông tin owner'}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Thành phố</div>
              <div className="mt-1 text-gray-800">{data.city || '—'}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="text-sm text-gray-500">Ngày tạo</div>
              <div className="mt-1 text-gray-800">{data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '—'}</div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Lịch sử & ghi chú</div>
              <textarea value={note} onChange={(e)=> setNote(e.target.value)} placeholder="Ghi chú của admin..." className="w-full rounded-md border px-3 py-2 text-sm" rows={3} />
              <div className="mt-2 flex justify-end">
                <button onClick={saveAdminNote} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Lưu ghi chú</button>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">10 hoạt động gần nhất</div>
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
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 font-semibold text-gray-800">Liên kết nhanh</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li><a className="text-orange-600 hover:underline" href={`/admin/orders?restaurantId=${id}`}>Xem lịch sử đơn hàng của nhà hàng này</a></li>
                <li><a className="text-orange-600 hover:underline" href={`/admin/items?restaurantId=${id}`}>Xem tất cả món ăn của nhà hàng này</a></li>
                <li><a className="text-orange-600 hover:underline" href={`/admin/restaurants/${id}/logs`}>Xem tất cả cảnh báo / logs</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="text-lg font-semibold">Khóa vĩnh viễn</div>
            <div className="mt-2 text-sm text-gray-600">Vui lòng nhập lý do khóa:</div>
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


