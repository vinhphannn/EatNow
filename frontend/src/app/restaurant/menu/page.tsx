"use client";
import { useEffect, useState } from "react";
import ImageUpload from "../../../components/ImageUpload";

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
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError>(null);
  const [form, setForm] = useState<{ name: string; price: number; type: 'food'|'drink'; description?: string; imageUrl?: string; categoryId?: string; isActive?: boolean; position?: number }>({ name: "", price: 0, type: 'food', isActive: true });

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
    position?: number;
  }>({ name: "", price: 0, type: 'food', description: "", imageUrl: "", categoryId: "", isActive: true, quantityRemaining: null });

  const [restaurantId, setRestaurantId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

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
    // If already in state, return
    if (restaurantId) return restaurantId;

    try {
      // 1) Try from localStorage and validate
      if (typeof localStorage !== 'undefined') {
        const rid = localStorage.getItem('eatnow_restaurant_id') || '';
        if (rid) {
          const check = await fetch(`${api}/api/v1/restaurants/${rid}`, { credentials: 'include' });
          if (check.ok) {
            setRestaurantId(rid);
            return rid;
          }
          // Invalid or not owned → clear
          localStorage.removeItem('eatnow_restaurant_id');
        }
      }

      // 2) Resolve by current authenticated owner
      const mine = await fetch(`${api}/api/v1/restaurants/mine`, { credentials: 'include' });
      if (mine.ok) {
        const rest = await mine.json();
        const resolvedId = rest?.id || rest?._id || rest?._id?.$oid || '';
        if (resolvedId) {
          if (typeof localStorage !== 'undefined') localStorage.setItem('eatnow_restaurant_id', resolvedId);
          setRestaurantId(resolvedId);
          return resolvedId;
        }
      }

      // 3) Final fallback: try ownerUserId from cached user if exists
      if (typeof localStorage !== 'undefined') {
        const u = localStorage.getItem('eatnow_user');
        if (u) {
          const user = JSON.parse(u);
          if (user?.id) {
            const r = await fetch(`${api}/api/v1/restaurants?ownerUserId=${user.id}`, { credentials: 'include' });
            if (r.ok) {
              const list = await r.json();
              const first = Array.isArray(list) && list.length ? list[0] : null;
              const fbId = first?.id || first?._id || first?._id?.$oid || null;
              if (fbId) {
                localStorage.setItem('eatnow_restaurant_id', fbId);
                setRestaurantId(fbId);
                return fbId;
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
      const res = await fetch(`${api}/api/v1/restaurants/${rid}/items?sortBy=position&order=asc`, { cache: 'no-store', credentials: 'include' });
      if (!res.ok) {
        setLoadError(await parseError(res));
        setItems([]);
      } else {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
      // Load categories in parallel
      try {
        const c = await fetch(`${api}/api/v1/restaurants/${rid}/categories`, { credentials: 'include' });
        if (c.ok) {
          const list = await c.json();
          const mapped = Array.isArray(list) ? list.map((x: any) => ({ id: String(x._id || x.id), name: x.name })) : [];
          setCategories(mapped);
        }
      } catch {}
    } catch (e: any) {
      setLoadError("Không thể tải danh sách món. Kiểm tra kết nối mạng.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Cookie-based: không phụ thuộc localStorage
    resolveRestaurant();
  }, []);

  useEffect(() => { load(); }, [restaurantId]);

  function openCreate() {
    setForm({ name: "", price: 0, type: 'food', isActive: true, categoryId: categories[0]?.id });
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
      const res = await fetch(`${api}/api/v1/restaurants/${rid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          type: form.type,
          description: form.description?.trim() || undefined,
          imageUrl: form.imageUrl || undefined,
          categoryId: form.categoryId || undefined,
          isActive: typeof form.isActive === 'boolean' ? form.isActive : undefined,
          position: typeof form.position === 'number' ? form.position : undefined,
        }),
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
      const res = await fetch(`${api}/api/v1/restaurants/items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      await fetch(`${api}/api/v1/restaurants/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !(it as any).isActive }),
      });
      await load();
    } catch {}
  }

  async function removeItem(it: Item) {
    const id = it.id;
    if (!confirm('Xóa món này?')) return;
    try {
      await fetch(`${api}/api/v1/restaurants/items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await load();
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thực đơn</h1>
          <p className="text-gray-600 mt-1">Quản lý món ăn, giá cả và trạng thái bán hàng</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <span className="mr-2">📊</span>
            Xem báo cáo
          </button>
          <button onClick={openCreate} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center">
            <span className="mr-2">➕</span>
            Thêm món ăn
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng món ăn</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600">🍽️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang bán</p>
              <p className="text-2xl font-bold text-green-600">{items.filter(it => (it as any).isActive !== false).length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tạm dừng</p>
              <p className="text-2xl font-bold text-red-600">{items.filter(it => (it as any).isActive === false).length}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600">⏸️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Giá TB</p>
              <p className="text-2xl font-bold text-blue-600">
                ₫{items.length > 0 ? Math.round(items.reduce((sum, it) => sum + ((it as any).price || 0), 0) / items.length).toLocaleString() : 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {String(loadError)}
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có món ăn nào</h3>
          <p className="text-gray-600 mb-6">Hãy thêm món ăn đầu tiên để bắt đầu bán hàng</p>
          <button onClick={openCreate} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Thêm món ăn đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-gray-400">🍽️</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    (item as any).isActive === false 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {(item as any).isActive === false ? 'Tạm dừng' : 'Đang bán'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (item as any).type === 'food' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {(item as any).type === 'food' ? 'Món ăn' : 'Đồ uống'}
                  </span>
                </div>
                
                {item.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-orange-600">
                    ₫{((item as any).price || 0).toLocaleString()}
                  </div>
                  {(item as any).quantityRemaining !== null && (
                    <div className="text-sm text-gray-500">
                      Còn: {(item as any).quantityRemaining}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEdit(item)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    ✏️ Sửa
                  </button>
                  <button 
                    onClick={() => toggleActive(item)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      (item as any).isActive === false
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    {(item as any).isActive === false ? '▶️' : '⏸️'}
                  </button>
                  <button 
                    onClick={() => removeItem(item)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thêm món ăn mới</h2>
                <p className="text-gray-600 text-sm mt-1">Tạo món ăn mới cho thực đơn</p>
              </div>
              <button 
                onClick={() => { if (!saving) setModalOpen(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={saving}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {String(saveError)}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên món ăn *</label>
                    <input 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Ví dụ: Cơm tấm sườn nướng"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (VNĐ) *</label>
                    <input 
                      type="number" 
                      value={form.price} 
                      onChange={(e) => setForm({...form, price: Number(e.target.value)})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="45000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại món</label>
                    <select 
                      value={form.type} 
                      onChange={(e) => setForm({...form, type: e.target.value as any})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="food">🍽️ Món ăn</option>
                      <option value="drink">🥤 Đồ uống</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                      <select
                        value={form.categoryId || ''}
                        onChange={(e)=>setForm({...form, categoryId: e.target.value || undefined})}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      >
                        <option value="">-- Không chọn --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí hiển thị</label>
                      <input
                        type="number"
                        value={typeof form.position === 'number' ? form.position : ''}
                        onChange={(e)=>setForm({...form, position: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Ví dụ: 1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input id="isActive"
                      type="checkbox"
                      checked={form.isActive !== false}
                      onChange={(e)=>setForm({...form, isActive: e.target.checked})}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">Đang bán</label>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh món ăn</label>
                    <ImageUpload
                      value={form.imageUrl}
                      onChange={(imageUrl) => setForm({...form, imageUrl})}
                      placeholder="Nhấp để chọn hình ảnh món ăn"
                    />
                  </div>
                  {/* Live Preview */}
                  <div className="border rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-2">Xem trước</div>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="h-36 bg-gray-100 flex items-center justify-center">
                        {form.imageUrl ? (
                          <img src={form.imageUrl} alt={form.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-gray-400">🍽️</span>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="font-medium text-gray-900 truncate max-w-[60%]">{form.name || 'Tên món'}</div>
                        <div className="text-orange-600 font-semibold">{form.price ? `₫${Number(form.price).toLocaleString()}` : '₫0'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả món ăn</label>
                  <textarea 
                    value={form.description} 
                    onChange={(e) => setForm({...form, description: e.target.value})} 
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                    placeholder="Mô tả chi tiết về món ăn, nguyên liệu, cách chế biến..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => { if (!saving) setModalOpen(false); }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={save} 
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Lưu món ăn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa món ăn</h2>
                <p className="text-gray-600 text-sm mt-1">Cập nhật thông tin món ăn</p>
              </div>
              <button 
                onClick={() => { if (!editSaving) setEditOpen(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={editSaving}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {String(editError)}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên món ăn *</label>
                    <input 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (VNĐ) *</label>
                    <input 
                      type="number" 
                      value={editForm.price} 
                      onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại món</label>
                    <select 
                      value={editForm.type} 
                      onChange={(e) => setEditForm({...editForm, type: e.target.value as any})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="food">🍽️ Món ăn</option>
                      <option value="drink">🥤 Đồ uống</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái bán</label>
                    <select 
                      value={editForm.isActive ? 'true' : 'false'} 
                      onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="true">✅ Đang bán</option>
                      <option value="false">⏸️ Tạm dừng</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh món ăn</label>
                    <ImageUpload
                      value={editForm.imageUrl}
                      onChange={(imageUrl) => setEditForm({...editForm, imageUrl})}
                      placeholder="Nhấp để chọn hình ảnh món ăn"
                      className="h-32"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng còn lại</label>
                    <input 
                      type="number" 
                      value={typeof editForm.quantityRemaining === 'number' ? editForm.quantityRemaining : ''} 
                      onChange={(e) => setEditForm({...editForm, quantityRemaining: e.target.value === '' ? null : Number(e.target.value)})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục (ID)</label>
                    <input 
                      value={editForm.categoryId || ''} 
                      onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})} 
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="ID danh mục (tùy chọn)"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả món ăn</label>
                  <textarea 
                    value={editForm.description} 
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => { if (!editSaving) setEditOpen(false); }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={editSaving}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submitEdit} 
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={editSaving}
              >
                {editSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Cập nhật món ăn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


