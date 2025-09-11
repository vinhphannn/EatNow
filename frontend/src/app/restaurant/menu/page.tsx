"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  type?: 'food'|'drink';
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  quantityRemaining?: number | null;
};

type ApiError = { message?: string } | string | null;

export default function RestaurantMenuPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError>(null);
  const [form, setForm] = useState<{ name: string; price: number; type: 'food'|'drink'; description?: string; imageUrl?: string }>({ name: "", price: 0, type: 'food' });

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<ApiError>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    price: number;
    type: 'food'|'drink';
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    isActive?: boolean;
    quantityRemaining?: number | null;
  }>({ name: "", price: 0, type: 'food', description: "", imageUrl: "", categoryId: "", isActive: true, quantityRemaining: null });

  const [restaurantId, setRestaurantId] = useState<string>('');
  const [token, setToken] = useState<string>('');

  async function parseError(res: Response) {
    try {
      const j = await res.json();
      if (Array.isArray((j as any)?.message)) return (j as any).message.join(", ");
      return (j as any)?.message || `HTTP ${res.status}`;
    } catch {
      try { return await res.text(); } catch { return `HTTP ${res.status}`; }
    }
  }

  async function resolveRestaurant(): Promise<string | null> {
    // If we already have it, return
    if (restaurantId) return restaurantId;
    // Try localStorage again
    try {
      if (typeof localStorage !== 'undefined') {
        const rid = localStorage.getItem('eatnow_restaurant_id') || '';
        if (rid) { setRestaurantId(rid); return rid; }
        // If no rid, try resolve from current user
        const u = localStorage.getItem('eatnow_user');
        if (u) {
          const user = JSON.parse(u);
          if (user?.id) {
            const r = await fetch(`${api}/restaurants?ownerUserId=${user.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (r.ok) {
              const list = await r.json();
              const first = Array.isArray(list) && list.length ? list[0] : null;
              // support both id and _id
              const resolvedId = first?.id || first?._id || first?._id?.$oid || null;
              if (resolvedId) {
                localStorage.setItem('eatnow_restaurant_id', resolvedId);
                setRestaurantId(resolvedId);
                return resolvedId;
              }
            }
          }
        }
      }
    } catch {}
    return null;
  }

  async function load() {
    const rid = await resolveRestaurant();
    if (!rid) {
      setItems([]);
      setLoading(false);
      setLoadError(null); // Không chặn bằng banner, chỉ để trống danh sách
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${api}/restaurants/${rid}/items?sortBy=position&order=asc`, { cache: 'no-store' });
      if (!res.ok) {
        setLoadError(await parseError(res));
        setItems([]);
      } else {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      setLoadError("Không thể tải danh sách món. Kiểm tra kết nối mạng.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial read from localStorage and listen for changes (when layout sets ID after login)
    try {
      if (typeof localStorage !== 'undefined') {
        setRestaurantId(localStorage.getItem('eatnow_restaurant_id') || '');
        setToken(localStorage.getItem('eatnow_token') || '');
      }
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'eatnow_restaurant_id') setRestaurantId(e.newValue || '');
      if (e.key === 'eatnow_token') setToken(e.newValue || '');
    };
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  useEffect(() => { load(); }, [restaurantId]);

  function openCreate() {
    setForm({ name: "", price: 0, type: 'food' });
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      price: Number((item as any).price || 0),
      type: (item as any).type || 'food',
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      categoryId: (item as any).categoryId || "",
      isActive: typeof (item as any).isActive === 'boolean' ? (item as any).isActive : true,
      quantityRemaining: typeof (item as any).quantityRemaining === 'number' ? (item as any).quantityRemaining : null,
    });
    setEditError(null);
    setEditOpen(true);
  }

  async function save() {
    setSaveError(null);
    let rid = restaurantId;
    if (!rid) {
      rid = await resolveRestaurant() || '';
    }
    if (!rid) { setSaveError("Thiếu mã nhà hàng. Vui lòng đăng nhập lại."); return; }
    if (!form.name?.trim()) { setSaveError("Tên món không được để trống"); return; }
    if (!form.price || form.price <= 0) { setSaveError("Giá món phải lớn hơn 0"); return; }
    setSaving(true);
    try {
      // Debug log: payload before sending
      try { console.log('[Menu] POST create item payload', { restaurantId: rid, body: form, hasToken: Boolean(token) }); } catch {}
      const res = await fetch(`${api}/restaurants/${rid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        try { const text = await res.clone().text(); console.warn('[Menu] POST create item error', res.status, text); } catch {}
        setSaveError(await parseError(res));
        return;
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setSaveError("Không thể lưu món. Kiểm tra kết nối mạng.");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (!editingId) return;
    setEditError(null);
    setEditSaving(true);
    try {
      const res = await fetch(`${api}/restaurants/items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        setEditError(await parseError(res));
        return;
      }
      setEditOpen(false);
      await load();
    } catch {
      setEditError('Không thể lưu chỉnh sửa');
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleActive(it: Item) {
    const id = it.id;
    try {
      await fetch(`${api}/restaurants/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ isActive: !(it as any).isActive }),
      });
      await load();
    } catch {}
  }

  async function removeItem(it: Item) {
    const id = it.id;
    if (!confirm('Xóa món này?')) return;
    try {
      await fetch(`${api}/restaurants/items/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      await load();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Món ăn</h1>
        <button onClick={openCreate} className="btn-primary">Thêm món</button>
      </div>

      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{String(loadError)}</div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="py-2 px-3">Ảnh</th>
              <th className="py-2 px-3">Tên</th>
              <th className="py-2 px-3">Giá</th>
              <th className="py-2 px-3">Loại</th>
              <th className="py-2 px-3">SL còn</th>
              <th className="py-2 px-3">Trạng thái</th>
              <th className="py-2 px-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it)=> (
              <tr key={it.id} className="border-t">
                <td className="py-2 px-3">
                  {it.imageUrl ? <img src={it.imageUrl} alt={it.name} className="h-10 w-10 rounded object-cover"/> : <div className="h-10 w-10 rounded bg-gray-100" />}
                </td>
                <td className="py-2 px-3 text-gray-800">{it.name}</td>
                <td className="py-2 px-3 font-medium text-orange-600">{new Intl.NumberFormat('vi-VN').format((it as any).price)} đ</td>
                <td className="py-2 px-3">{(it as any).type}</td>
                <td className="py-2 px-3">{(it as any).quantityRemaining ?? ""}</td>
                <td className="py-2 px-3">
                  {(it as any).isActive === false ? <span className="rounded px-2 py-1 text-xs bg-gray-100 text-gray-700">Tắt</span> : <span className="rounded px-2 py-1 text-xs bg-green-100 text-green-700">Bật</span>}
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(it)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Sửa</button>
                    <button onClick={()=>toggleActive(it)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">{(it as any).isActive === false ? 'Bật' : 'Tắt'}</button>
                    <button onClick={()=>removeItem(it)} className="rounded border px-2 py-1 text-xs hover:bg-red-50 text-red-600">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length===0 && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-500">Chưa có món nào.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400">Đang tải...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Thêm món</h2>
            {saveError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{String(saveError)}</div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Tên món</label>
                <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Giá</label>
                <input type="number" value={form.price} onChange={(e)=>setForm({...form, price: Number(e.target.value)})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Loại</label>
                <select value={form.type} onChange={(e)=>setForm({...form, type: e.target.value as any})} className="mt-1 w-full rounded-md border px-3 py-2">
                  <option value="food">Món ăn</option>
                  <option value="drink">Đồ uống</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Mô tả</label>
                <textarea value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Ảnh (URL)</label>
                <input value={form.imageUrl||''} onChange={(e)=>setForm({...form, imageUrl: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={()=>{ if (!saving) setModalOpen(false); }} className="rounded border px-4 py-2 hover:bg-gray-50 disabled:opacity-60" disabled={saving}>Hủy</button>
              <button onClick={save} className="btn-primary disabled:opacity-60" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Sửa món</h2>
            {editError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{String(editError)}</div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Tên món</label>
                <input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Giá</label>
                <input type="number" value={editForm.price} onChange={(e)=>setEditForm({...editForm, price: Number(e.target.value)})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Loại</label>
                <select value={editForm.type} onChange={(e)=>setEditForm({...editForm, type: e.target.value as any})} className="mt-1 w-full rounded-md border px-3 py-2">
                  <option value="food">Món ăn</option>
                  <option value="drink">Đồ uống</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Category ID (tùy chọn)</label>
                <input value={editForm.categoryId || ''} onChange={(e)=>setEditForm({...editForm, categoryId: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm text-gray-600">SL còn lại (tùy chọn)</label>
                <input type="number" value={typeof editForm.quantityRemaining === 'number' ? editForm.quantityRemaining : ''} onChange={(e)=>setEditForm({...editForm, quantityRemaining: e.target.value === '' ? null : Number(e.target.value)})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Mô tả</label>
                <textarea value={editForm.description} onChange={(e)=>setEditForm({...editForm, description: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Ảnh (URL)</label>
                <input value={editForm.imageUrl || ''} onChange={(e)=>setEditForm({...editForm, imageUrl: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Trạng thái</label>
                <select value={editForm.isActive ? 'true' : 'false'} onChange={(e)=>setEditForm({...editForm, isActive: e.target.value === 'true'})} className="mt-1 w-full rounded-md border px-3 py-2">
                  <option value="true">Bật</option>
                  <option value="false">Tắt</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={()=>{ if (!editSaving) setEditOpen(false); }} className="rounded border px-4 py-2 hover:bg-gray-50 disabled:opacity-60" disabled={editSaving}>Hủy</button>
              <button onClick={submitEdit} className="btn-primary disabled:opacity-60" disabled={editSaving}>{editSaving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


