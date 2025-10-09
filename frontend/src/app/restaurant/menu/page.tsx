"use client";
import { useEffect, useState } from "react";
import ImageUpload from "../../../components/ImageUpload";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControlLabel, Checkbox, Stack, Typography, IconButton, Box, Card, CardContent, CardActions, Chip, Tooltip } from "@mui/material";
import { PlusIcon, ChartBarIcon, XMarkIcon, PencilSquareIcon, TrashIcon, PauseIcon, PlayIcon, PhotoIcon } from "@heroicons/react/24/outline";
import StatCard from "@/components/ui/StatCard";

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
          <Button variant="outlined" startIcon={<ChartBarIcon width={18} />}>Xem báo cáo</Button>
          <Button variant="contained" disableElevation onClick={openCreate} startIcon={<PlusIcon width={18} />} sx={{ textTransform: 'none' }}>Thêm món ăn</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <StatCard label="Tổng món ăn" value={items.length} icon={<PhotoIcon width={20} />} colorBoxBg="rgba(249,115,22,0.12)" />
        <StatCard label="Đang bán" value={items.filter(it => (it as any).isActive !== false).length} icon={<PlayIcon width={20} />} colorBoxBg="rgba(34,197,94,0.12)" />
        <StatCard label="Tạm dừng" value={items.filter(it => (it as any).isActive === false).length} icon={<PauseIcon width={20} />} colorBoxBg="rgba(239,68,68,0.12)" />
        <StatCard label="Giá TB" value={`₫${(items.length > 0 ? Math.round(items.reduce((sum, it) => sum + ((it as any).price || 0), 0) / items.length) : 0).toLocaleString()}`} icon={<ChartBarIcon width={20} />} colorBoxBg="rgba(59,130,246,0.12)" />
      </Box>

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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {items.map((item) => (
            <Card key={item.id} elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ position: 'relative', height: 192, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <PhotoIcon width={48} />
                )}
                <Chip size="small" color={(item as any).isActive === false ? 'error' : 'success'} label={(item as any).isActive === false ? 'Tạm dừng' : 'Đang bán'} sx={{ position: 'absolute', top: 12, right: 12 }} />
              </Box>
              <CardContent>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>{item.name}</Typography>
                  <Chip size="small" color={(item as any).type === 'food' ? 'warning' : 'info'} label={(item as any).type === 'food' ? 'Món ăn' : 'Đồ uống'} />
                </Stack>
                {item.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} noWrap>
                    {item.description}
                  </Typography>
                )}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" color="warning.main">₫{((item as any).price || 0).toLocaleString()}</Typography>
                  {(item as any).quantityRemaining !== null && (
                    <Typography variant="body2" color="text.secondary">Còn: {(item as any).quantityRemaining}</Typography>
                  )}
                </Stack>
              </CardContent>
              <CardActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button variant="outlined" size="small" onClick={() => openEdit(item)} startIcon={<PencilSquareIcon width={16} />} sx={{ textTransform: 'none' }} aria-label="Sửa món">
                  Sửa
                </Button>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={(item as any).isActive === false ? 'Mở bán' : 'Tạm dừng'}>
                    <IconButton aria-label={(item as any).isActive === false ? 'Mở bán' : 'Tạm dừng'} onClick={() => toggleActive(item)}>
                      {(item as any).isActive === false ? <PlayIcon width={18} /> : <PauseIcon width={18} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton color="error" aria-label="Xóa món" onClick={() => removeItem(item)}>
                      <TrashIcon width={18} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Add Item Modal */}
      <Dialog open={modalOpen} onClose={() => { if (!saving) setModalOpen(false); }} fullWidth maxWidth="md" aria-describedby="add-item-desc">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Thêm món ăn mới</Typography>
              <Typography variant="caption" color="text.secondary" id="add-item-desc">Tạo món ăn mới cho thực đơn</Typography>
            </Box>
            <IconButton aria-label="Đóng" disabled={saving} onClick={() => { if (!saving) setModalOpen(false); }}>
              <XMarkIcon width={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {saveError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>{String(saveError)}</Typography>
          )}
          <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '1fr 1fr' }, gap: 2 }}>
            <Stack spacing={2}>
              <TextField label="Tên món ăn" required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="Ví dụ: Cơm tấm sườn nướng" />
              <TextField label="Giá bán (VNĐ)" type="number" required value={form.price} onChange={(e)=>setForm({...form, price: Number(e.target.value)})} />
              <Select value={form.type} onChange={(e)=>setForm({...form, type: e.target.value as any})} displayEmpty>
                <MenuItem value={'food'}>Món ăn</MenuItem>
                <MenuItem value={'drink'}>Đồ uống</MenuItem>
              </Select>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Select value={form.categoryId || ''} onChange={(e)=>setForm({...form, categoryId: e.target.value || undefined})} displayEmpty fullWidth>
                  <MenuItem value="">-- Không chọn --</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
                <TextField label="Vị trí hiển thị" type="number" value={typeof form.position === 'number' ? form.position : ''} onChange={(e)=>setForm({...form, position: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="Ví dụ: 1" fullWidth />
              </Box>
              <FormControlLabel control={<Checkbox checked={form.isActive !== false} onChange={(e)=>setForm({...form, isActive: e.target.checked})} />} label="Đang bán" />
            </Stack>
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" sx={{ mb: 1 }}>Hình ảnh món ăn</Typography>
                <ImageUpload value={form.imageUrl} onChange={(imageUrl) => setForm({...form, imageUrl})} placeholder="Nhấp để chọn hình ảnh món ăn" />
              </div>
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
            </Stack>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField label="Mô tả món ăn" multiline rows={3} value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { if (!saving) setModalOpen(false); }} disabled={saving}>Hủy bỏ</Button>
          <Button variant="contained" disableElevation onClick={save} disabled={saving} sx={{ textTransform: 'none' }}>{saving ? 'Đang lưu...' : 'Lưu món ăn'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={editOpen} onClose={() => { if (!editSaving) setEditOpen(false); }} fullWidth maxWidth="md" aria-describedby="edit-item-desc">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Chỉnh sửa món ăn</Typography>
              <Typography variant="caption" color="text.secondary" id="edit-item-desc">Cập nhật thông tin món ăn</Typography>
            </Box>
            <IconButton aria-label="Đóng" disabled={editSaving} onClick={() => { if (!editSaving) setEditOpen(false); }}>
              <XMarkIcon width={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {editError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>{String(editError)}</Typography>
          )}
          <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '1fr 1fr' }, gap: 2 }}>
            <Stack spacing={2}>
              <TextField label="Tên món ăn" required value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} />
              <TextField label="Giá bán (VNĐ)" type="number" required value={editForm.price} onChange={(e)=>setEditForm({...editForm, price: Number(e.target.value)})} />
              <Select value={editForm.type} onChange={(e)=>setEditForm({...editForm, type: e.target.value as any})} displayEmpty>
                <MenuItem value={'food'}>Món ăn</MenuItem>
                <MenuItem value={'drink'}>Đồ uống</MenuItem>
              </Select>
              <Select value={editForm.isActive ? 'true' : 'false'} onChange={(e)=>setEditForm({...editForm, isActive: e.target.value === 'true'})} displayEmpty>
                <MenuItem value={'true'}>Đang bán</MenuItem>
                <MenuItem value={'false'}>Tạm dừng</MenuItem>
              </Select>
            </Stack>
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" sx={{ mb: 1 }}>Hình ảnh món ăn</Typography>
                <ImageUpload value={editForm.imageUrl} onChange={(imageUrl) => setEditForm({...editForm, imageUrl})} placeholder="Nhấp để chọn hình ảnh món ăn" className="h-32" />
              </div>
              <TextField label="Số lượng còn lại" type="number" value={typeof editForm.quantityRemaining === 'number' ? editForm.quantityRemaining : ''} onChange={(e)=>setEditForm({...editForm, quantityRemaining: e.target.value === '' ? null : Number(e.target.value)})} placeholder="Để trống nếu không giới hạn" />
              <TextField label="Danh mục (ID)" value={editForm.categoryId || ''} onChange={(e)=>setEditForm({...editForm, categoryId: e.target.value})} placeholder="ID danh mục (tùy chọn)" />
            </Stack>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField label="Mô tả món ăn" multiline rows={3} value={editForm.description} onChange={(e)=>setEditForm({...editForm, description: e.target.value})} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { if (!editSaving) setEditOpen(false); }} disabled={editSaving}>Hủy bỏ</Button>
          <Button variant="contained" disableElevation onClick={submitEdit} disabled={editSaving} sx={{ textTransform: 'none' }}>{editSaving ? 'Đang lưu...' : 'Cập nhật món ăn'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}


