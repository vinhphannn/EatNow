"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDriverAuth } from "../../../hooks/useDriverAuth";
import { AuthManager } from '@/utils/authManager';

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
  const { isAuthenticated, loading: authLoading, user, logout } = useDriverAuth();
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
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadProfile();
    }
  }, [isAuthenticated, authLoading]);

  const loadProfile = async () => {
    try {
      const { token } = AuthManager.getDriverAuth();
      if (!token) {
        router.push('/driver/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/driver-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
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
      const { token } = AuthManager.getDriverAuth();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
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

  // Show loading while fetching data
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        
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

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm text-gray-600">Họ và tên</label>
            <input 
              value={profile.name} 
              onChange={(e) => setProfile({...profile, name: e.target.value})} 
              className="mt-1 w-full rounded-md border px-3 py-2" 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input 
              value={profile.email} 
              className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-100" 
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Số điện thoại</label>
            <input 
              value={profile.phone} 
              onChange={(e) => setProfile({...profile, phone: e.target.value})} 
              className="mt-1 w-full rounded-md border px-3 py-2" 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Số bằng lái xe</label>
            <input 
              value={profile.licenseNumber} 
              className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-100" 
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Số bằng lái xe không thể thay đổi</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Loại phương tiện</label>
            <input 
              value={getVehicleTypeText(profile.vehicleType)} 
              className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-100" 
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Loại phương tiện không thể thay đổi</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600">Biển số xe</label>
            <input 
              value={profile.vehicleNumber} 
              className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-100" 
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Biển số xe không thể thay đổi</p>
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
            <div className={`text-sm ${message.includes('thành công') ? 'text-green-700' : 'text-red-700'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
