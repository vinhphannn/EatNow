"use client";

import { AdminGuard } from "@/components/guards/AuthGuard";
import { useAdvancedAdminAuth } from "@/contexts/AdvancedAuthContext";
import { DeviceManager } from "@/components/device/DeviceManager";
import { useActivityTracker } from "@/hooks/useActivityTracker";

function SecurityPageContent() {
  const { user, logoutAllDevices } = useAdvancedAdminAuth();

  // Track user activity
  useActivityTracker({
    updateInterval: 30000, // Update every 30 seconds
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    onInactivity: () => {
      console.log('User inactive for 30 minutes');
    },
  });

  const handleLogoutAllDevices = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất tất cả thiết bị? Bạn sẽ cần đăng nhập lại trên tất cả thiết bị.')) {
      try {
        await logoutAllDevices();
      } catch (error) {
        console.error('Failed to logout all devices:', error);
        alert('Không thể đăng xuất tất cả thiết bị. Vui lòng thử lại.');
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bảo mật tài khoản</h1>
          <p className="text-gray-600 mt-1">
            Quản lý bảo mật và thiết bị đăng nhập cho {user?.name || user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Device Management */}
          <div className="lg:col-span-2">
            <DeviceManager />
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt bảo mật</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Đăng xuất tự động</h4>
                  <p className="text-sm text-gray-500">Tự động đăng xuất sau 30 phút không hoạt động</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Thông báo đăng nhập</h4>
                  <p className="text-sm text-gray-500">Nhận thông báo khi có đăng nhập từ thiết bị mới</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Xác thực 2 yếu tố</h4>
                  <p className="text-sm text-gray-500">Bảo mật tài khoản với mã xác thực</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleLogoutAllDevices}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Đăng xuất tất cả thiết bị
              </button>
            </div>
          </div>

          {/* Session Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin phiên đăng nhập</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Đăng nhập lần cuối:</span>
                <span className="text-sm text-gray-900">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Không có thông tin'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tài khoản được tạo:</span>
                <span className="text-sm text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : 'Không có thông tin'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cập nhật cuối:</span>
                <span className="text-sm text-gray-900">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleString('vi-VN') : 'Không có thông tin'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Trạng thái:</span>
                <span className={`text-sm font-medium ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Thay đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SecurityPage() {
  return (
    <AdminGuard>
      <SecurityPageContent />
    </AdminGuard>
  );
}
