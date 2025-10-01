"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDriverAuth } from "@/contexts/AuthContext";

interface DriverProfile {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  status: string;
  rating: number;
  ratingCount: number;
  totalDeliveries: number;
}

export default function DriverProfilePage() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useDriverAuth();
  const [profile, setProfile] = useState<DriverProfile>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    vehicleType: '',
    vehicleNumber: '',
    status: '',
    rating: 0,
    ratingCount: 0,
    totalDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ [k: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadProfile();
    }
  }, [isAuthenticated, authLoading]);

  const loadProfile = async () => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      // Fetch driver profile (cookie-based)
      const [meRes, statsRes] = await Promise.all([
        fetch(`${api}/api/v1/drivers/me`, { credentials: 'include' }),
        fetch(`${api}/api/v1/drivers/me/stats`, { credentials: 'include' }),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setProfile((prev) => ({
          ...prev,
          name: me?.name || '',
          email: me?.email || '',
          phone: me?.phone || '',
          licenseNumber: me?.licenseNumber || '',
          vehicleType: me?.vehicleType || '',
          vehicleNumber: me?.vehicleNumber || '',
          status: me?.status || '',
        }));
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setProfile((prev) => ({
          ...prev,
          rating: stats?.rating ?? 0,
          ratingCount: stats?.ratingCount ?? 0,
          totalDeliveries: stats?.totalDeliveries ?? 0,
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${api}/api/v1/drivers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          vehicleType: profile.vehicleType,
          licensePlate: profile.vehicleNumber,
        }),
      });

      if (response.ok) {
        setMessage("Đã cập nhật thông tin thành công");
      } else {
        setMessage("Có lỗi xảy ra khi cập nhật");
      }
    } catch (error) {
      setMessage("Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save on field blur
  const handleFieldBlur = async (field: keyof DriverProfile) => {
    setEditing((p) => ({ ...p, [field]: false }));
    try {
      await onSubmit(new Event('submit') as any);
      setMessage('Đã lưu thay đổi');
      setTimeout(() => setMessage(null), 2000);
    } catch {}
  };

  const completeness = useMemo(() => {
    const fields = [profile.name, profile.phone, profile.licenseNumber || profile.vehicleNumber, profile.vehicleType];
    const filled = fields.filter((v) => !!(v && String(v).trim())).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Đang hoạt động',
      'inactive': 'Không hoạt động',
      'suspended': 'Tạm khóa',
      'offline': 'Ngoại tuyến',
    };
    return statusMap[status] || status;
  };

  const getVehicleTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'motorcycle': 'Xe máy',
      'bicycle': 'Xe đạp',
      'car': 'Ô tô',
    };
    return typeMap[type] || type;
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show loading while fetching data (skeleton)
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="space-y-4">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="rounded-xl border bg-white p-6 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-10 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="rounded-xl border bg-white p-6 space-y-3">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-10 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ tài xế</h1>
        {/* Completeness bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Mức độ hoàn thiện</span>
            <span>{completeness}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${completeness}%` }} />
          </div>
        </div>
        
        {/* Profile Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{profile.totalDeliveries}</div>
            <div className="text-sm text-gray-500">Tổng đơn đã giao</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {profile.ratingCount > 0 ? profile.rating.toFixed(1) : 'Chưa có'}
            </div>
            <div className="text-sm text-gray-500">Điểm đánh giá</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{getStatusText(profile.status)}</div>
            <div className="text-sm text-gray-500">Trạng thái</div>
          </div>
        </div>

        {/* Cards */}
        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* Card 1: Personal */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-gray-800">Thông tin cá nhân</div>
              <button type="button" className="text-sm text-gray-600 hover:text-gray-900" onClick={()=>setEditing((p)=>({ ...p, name: true, phone: true }))}>Sửa</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Họ và tên</label>
                <input
                  value={profile.name}
                  onChange={(e)=>setProfile({ ...profile, name: e.target.value })}
                  onBlur={()=>handleFieldBlur('name')}
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${!profile.name ? 'border-red-300' : ''}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Email</label>
                <input value={profile.email} className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-100" disabled />
                <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Số điện thoại</label>
                <input
                  value={profile.phone}
                  onChange={(e)=>setProfile({ ...profile, phone: e.target.value })}
                  onBlur={()=>handleFieldBlur('phone')}
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${!profile.phone ? 'border-red-300' : ''}`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Driver */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-gray-800">Thông tin tài xế</div>
              <button type="button" className="text-sm text-gray-600 hover:text-gray-900" onClick={()=>setEditing((p)=>({ ...p, vehicleType: true, vehicleNumber: true }))}>Sửa</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600">Loại phương tiện</label>
                <select
                  value={profile.vehicleType}
                  onChange={(e)=>setProfile({ ...profile, vehicleType: e.target.value })}
                  onBlur={()=>handleFieldBlur('vehicleType')}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                >
                  <option value="motorcycle">Xe máy</option>
                  <option value="bicycle">Xe đạp</option>
                  <option value="car">Ô tô</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Biển số xe</label>
                <input
                  value={profile.vehicleNumber}
                  onChange={(e)=>setProfile({ ...profile, vehicleNumber: e.target.value })}
                  onBlur={()=>handleFieldBlur('vehicleNumber')}
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${!profile.vehicleNumber ? 'border-red-300' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Documents */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-gray-800">Giấy tờ</div>
              <button type="button" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Tải giấy tờ</button>
            </div>
            <p className="mt-2 text-sm text-gray-600">Ảnh CMND/CCCD, giấy phép lái xe...</p>
            <div className="mt-3 text-sm text-gray-400">Chức năng upload sẽ dùng endpoint tài liệu khi sẵn sàng.</div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button 
              type="button" 
              className="rounded-md border px-4 py-2 hover:bg-gray-50"
              onClick={() => router.push('/driver/change-password')}
            >
              Đổi mật khẩu
            </button>
            <button 
              type="button" 
              className="rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700"
              onClick={logout}
            >
              Đăng xuất
            </button>
          </div>

          {message && (
            <div className={`text-sm ${message.includes('lưu') || message.includes('Đã') ? 'text-green-700' : 'text-red-700'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
      {/* Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 rounded-md bg-gray-900 text-white px-4 py-2 shadow-lg">
          {message}
        </div>
      )}
    </main>
  );
}
