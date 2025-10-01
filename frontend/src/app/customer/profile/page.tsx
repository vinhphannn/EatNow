"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService, User, UserAddress, UserStats } from "@/services/user.service";
import { CustomerGuard } from "@/components/guards/AuthGuard";
import AvatarUpload from "@/components/profile/AvatarUpload";

function CustomerProfileContent() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'preferences' | 'stats'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await userService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateProfile = async (updateData: any) => {
    try {
      const updatedProfile = await userService.updateProfile(updateData);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy thông tin người dùng</h2>
          <button
            onClick={logout}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <AvatarUpload
                currentAvatarUrl={profile.avatarUrl}
                userName={profile.name}
                onAvatarUpdate={(avatarUrl) => {
                  setProfile(prev => prev ? { ...prev, avatarUrl: avatarUrl || undefined } : null);
                }}
                size="lg"
              />
              <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white ${
                profile.isActive ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userService.getLoyaltyTierColor(profile.loyaltyTier)
                }`}>
                  {userService.getLoyaltyTierIcon(profile.loyaltyTier)} {userService.getLoyaltyTierName(profile.loyaltyTier)}
                </span>
                <span className="text-sm text-gray-500">
                  {userService.formatCurrency(profile.totalSpent)}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'profile', label: 'Thông tin cá nhân', icon: '👤' },
                { key: 'addresses', label: 'Địa chỉ', icon: '📍' },
                { key: 'preferences', label: 'Tùy chọn', icon: '⚙️' },
                { key: 'stats', label: 'Thống kê', icon: '📊' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'profile' && (
            <ProfileTab profile={profile} isEditing={isEditing} onUpdate={handleUpdateProfile} />
          )}
          {activeTab === 'addresses' && (
            <AddressesTab profile={profile} onUpdate={loadProfile} />
          )}
          {activeTab === 'preferences' && (
            <PreferencesTab profile={profile} onUpdate={handleUpdateProfile} />
          )}
          {activeTab === 'stats' && (
            <StatsTab stats={stats} />
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ profile, isEditing, onUpdate }: { profile: User; isEditing: boolean; onUpdate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: profile.name,
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    dateOfBirth: profile.dateOfBirth || '',
    gender: profile.gender || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên đầy đủ</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Giới thiệu về bản thân..."
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
              <p className="text-gray-900">{profile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <p className="text-gray-900">{profile.fullName || 'Chưa thiết lập'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <p className="text-gray-900">{profile.phone || 'Chưa thiết lập'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <p className="text-gray-900">{profile.dateOfBirth ? userService.formatDate(profile.dateOfBirth) : 'Chưa thiết lập'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <p className="text-gray-900">
                {profile.gender === 'male' ? 'Nam' : 
                 profile.gender === 'female' ? 'Nữ' : 
                 profile.gender === 'other' ? 'Khác' : 'Chưa thiết lập'}
              </p>
            </div>
          </div>
          {profile.bio && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu</label>
              <p className="text-gray-900">{profile.bio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Addresses Tab Component
function AddressesTab({ profile, onUpdate }: { profile: User; onUpdate: () => void }) {
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserAddress | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  // Simple two-level admin data: city -> wards (extendable)
  const cityToWards: Record<string, string[]> = {
    'TP. Hồ Chí Minh': ['Bến Nghé', 'Bến Thành', 'Cô Giang', 'Cầu Kho', 'Cầu Ông Lãnh'],
    'Hà Nội': ['Phúc Xá', 'Trúc Bạch', 'Vĩnh Phúc', 'Cống Vị', 'Liễu Giai'],
    'Đà Nẵng': ['Thạch Thang', 'Hải Châu I', 'Hải Châu II', 'Phước Ninh', 'Hòa Thuận Đông'],
  };
  const availableCities = Array.from(
    new Set([
      ...(Object.keys(cityToWards)),
      ...profile.addresses.map(a => a.city).filter(Boolean) as string[],
    ])
  );
  const availableLabels = profile.addressLabels?.length ? profile.addressLabels : ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'];

  const startAdd = () => {
    setForm({
      label: availableLabels[0] || 'Nhà',
      addressLine: '',
      latitude: 0,
      longitude: 0,
      city: availableCities[0] || '',
      ward: '',
      note: '',
      phone: '',
      recipientName: '',
      isDefault: profile.addresses.length === 0,
      isActive: true,
    });
    setIsAddingAddress(true);
    setEditingIndex(null);
  };

  const startEdit = (index: number) => {
    const a = profile.addresses[index];
    // Ensure label exists in availableLabels
    const label = availableLabels.includes(a.label) ? a.label : (availableLabels[0] || 'Nhà');
    setForm({ ...a, label, district: undefined } as UserAddress);
    setEditingIndex(index);
    setIsAddingAddress(false);
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      if (editingIndex !== null) {
        await userService.updateAddress(editingIndex, form);
      } else {
        await userService.addAddress(form);
      }
      setIsAddingAddress(false);
      setEditingIndex(null);
      setForm(null);
      onUpdate();
    } catch (e) {
      console.error('Save address failed:', e);
      alert('Không thể lưu địa chỉ. Vui lòng kiểm tra và thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
      setSaving(true);
      await userService.deleteAddress(index);
      onUpdate();
    } catch (e) {
      console.error('Delete address failed:', e);
      alert('Không thể xóa địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const handleCityChange = (city: string) => {
    if (!form) return;
    const wards = cityToWards[city] || [];
    setForm({ ...form, city, ward: wards[0] || '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h2>
        <button
          onClick={startAdd}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
        >
          Thêm địa chỉ
        </button>
      </div>

      {(isAddingAddress || editingIndex !== null) && form && (
        <div className="border rounded-lg p-4 mb-4 bg-orange-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn</label>
              <select className="w-full border rounded px-3 py-2" value={form.label} onChange={e=>setForm({ ...form, label: e.target.value })}>
                {availableLabels.map(lbl => (
                  <option key={lbl} value={lbl}>{lbl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input className="w-full border rounded px-3 py-2" value={form.phone||''} onChange={e=>setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input className="w-full border rounded px-3 py-2" value={form.addressLine} onChange={e=>setForm({ ...form, addressLine: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
              <select className="w-full border rounded px-3 py-2" value={form.city||''} onChange={e=>handleCityChange(e.target.value)}>
                <option value="">Chọn tỉnh/thành</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
              {cityToWards[form.city||''] && cityToWards[form.city||''].length > 0 ? (
                <select className="w-full border rounded px-3 py-2" value={form.ward||''} onChange={e=>setForm({ ...form, ward: e.target.value })}>
                  {cityToWards[form.city||''].map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              ) : (
                <input className="w-full border rounded px-3 py-2" placeholder="Nhập phường/xã" value={form.ward||''} onChange={e=>setForm({ ...form, ward: e.target.value })} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input className="w-full border rounded px-3 py-2" value={form.note||''} onChange={e=>setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <button type="button" onClick={()=>setMapOpen(true)} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                Chọn vị trí trên bản đồ
              </button>
              {form.latitude && form.longitude ? (
                <span className="ml-3 text-sm text-gray-600">Đã chọn: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>
              ) : (
                <span className="ml-3 text-sm text-gray-500">Chưa chọn vị trí</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <input id="isDefault" type="checkbox" checked={!!form.isDefault} onChange={e=>setForm({ ...form, isDefault: e.target.checked })} />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Đặt làm mặc định</label>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button onClick={handleSave} disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
            <button onClick={()=>{setIsAddingAddress(false); setEditingIndex(null); setForm(null);}} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md">Hủy</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {profile.addresses.map((address, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{address.label}</span>
                  {address.isDefault && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{address.addressLine}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {address.ward}, {address.city}
                </p>
                {address.phone && (
                  <p className="text-sm text-gray-500">📞 {address.phone}</p>
                )}
                {address.note && (
                  <p className="text-sm text-gray-500 mt-1">📝 {address.note}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(index)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}

        {profile.addresses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Bạn chưa có địa chỉ giao hàng nào</p>
            <p className="text-sm mt-1">Thêm địa chỉ để dễ dàng đặt hàng</p>
          </div>
        )}
      </div>

      {mapOpen && (
        <MapPickerModal
          latitude={form?.latitude}
          longitude={form?.longitude}
          onClose={()=> setMapOpen(false)}
          onPick={(lat, lng) => { if (form) setForm({ ...form, latitude: lat, longitude: lng }); setMapOpen(false); }}
        />
      )}
    </div>
  );
}

function MapPickerModal({ latitude, longitude, onClose, onPick }: { latitude?: number; longitude?: number; onClose: ()=>void; onPick: (lat: number, lng: number)=>void }) {
  const [loaded, setLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (!loaded) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const L = (window as any).L;
        if (L && !map) {
          const mapInstance = L.map('cust-map-canvas').setView([latitude || 10.8231, longitude || 106.6297], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
          setMap(mapInstance);

          if (latitude && longitude) {
            L.marker([latitude, longitude]).addTo(mapInstance);
          }

          mapInstance.on('click', (e: any) => {
            mapInstance.eachLayer((layer: any) => {
              if (layer instanceof L.Marker) {
                mapInstance.removeLayer(layer);
              }
            });
            L.marker([e.latlng.lat, e.latlng.lng]).addTo(mapInstance);
            onPick(e.latlng.lat, e.latlng.lng);
          });
        }
        setLoaded(true);
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, [loaded, latitude, longitude, onPick, map]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">Chọn vị trí trên bản đồ</div>
          <button onClick={onClose} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Đóng</button>
        </div>
        <div id="cust-map-canvas" className="h-[480px] w-full rounded-lg border" />
        <div className="mt-2 text-xs text-gray-500">Nhấp vào bản đồ để ghim vị trí. Sử dụng OpenStreetMap miễn phí.</div>
      </div>
    </div>
  );
}

// Preferences Tab Component
function PreferencesTab({ profile, onUpdate }: { profile: User; onUpdate: (data: any) => void }) {
  const [preferences, setPreferences] = useState({
    language: profile.language,
    country: profile.country,
    currency: profile.currency,
    allowPushNotifications: profile.allowPushNotifications,
    allowEmailNotifications: profile.allowEmailNotifications,
    allowSMSNotifications: profile.allowSMSNotifications,
    allowMarketingEmails: profile.allowMarketingEmails,
    allowLocationTracking: profile.allowLocationTracking,
    favoriteCuisines: profile.favoriteCuisines,
    dietaryRestrictions: profile.dietaryRestrictions,
    allergens: profile.allergens,
    spiceLevel: profile.spiceLevel,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(preferences);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tùy chọn</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Preferences */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Thông báo</h3>
          <div className="space-y-2">
            {[
              { key: 'allowPushNotifications', label: 'Thông báo đẩy' },
              { key: 'allowEmailNotifications', label: 'Email thông báo' },
              { key: 'allowSMSNotifications', label: 'SMS thông báo' },
              { key: 'allowMarketingEmails', label: 'Email marketing' },
              { key: 'allowLocationTracking', label: 'Theo dõi vị trí' },
            ].map((pref) => (
              <label key={pref.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences[pref.key as keyof typeof preferences] as boolean}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    [pref.key]: e.target.checked,
                  })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{pref.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Food Preferences */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Sở thích ẩm thực</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ cay</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">0</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={preferences.spiceLevel}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    spiceLevel: parseInt(e.target.value),
                  })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">5</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {userService.getSpiceLevelText(preferences.spiceLevel)} {userService.getSpiceLevelIcon(preferences.spiceLevel)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
          >
            Lưu tùy chọn
          </button>
        </div>
      </form>
    </div>
  );
}

// Stats Tab Component
function StatsTab({ stats }: { stats: UserStats | null }) {
  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải thống kê...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê hoạt động</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
          <div className="text-sm text-blue-600">Tổng đơn hàng</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {userService.formatCurrency(stats.totalSpent)}
          </div>
          <div className="text-sm text-green-600">Tổng chi tiêu</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {userService.formatCurrency(stats.averageOrderValue)}
          </div>
          <div className="text-sm text-purple-600">Giá trị TB/đơn</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.totalReviews}</div>
          <div className="text-sm text-orange-600">Đánh giá đã viết</div>
        </div>
      </div>

      {/* Favorite Cuisines */}
      {stats.favoriteCuisines.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Món ăn yêu thích</h3>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteCuisines.map((cuisine) => (
              <span key={cuisine} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {cuisine}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Most Ordered Restaurants */}
      {stats.mostOrderedRestaurants.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Nhà hàng đặt nhiều nhất</h3>
          <div className="space-y-2">
            {stats.mostOrderedRestaurants.slice(0, 5).map((restaurant) => (
              <div key={restaurant.restaurantId} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-900">{restaurant.restaurantName}</span>
                <span className="text-sm text-gray-500">{restaurant.orderCount} đơn</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerProfilePage() {
  return (
    <CustomerGuard>
      <CustomerProfileContent />
    </CustomerGuard>
  );
}