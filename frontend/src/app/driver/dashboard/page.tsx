"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthManager } from "@/utils/authManager";

export default function DriverDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const { token, user, role } = AuthManager.getDriverAuth();
      console.log("Dashboard - Checking auth:", { token, user, role });
      
      if (!token || !user || role !== "driver") {
        console.log("Dashboard - Not authenticated, redirecting to login");
        router.push("/driver/login");
        return;
      }

      console.log("Dashboard - Authenticated successfully");
      setIsAuthenticated(true);
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chưa đăng nhập, đang chuyển hướng...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Tài Xế</h1>
        <p className="mt-2 text-gray-600">Chào mừng, {user?.name || user?.email}!</p>
        
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Tổng đơn đã giao</div>
            <div className="mt-1 text-3xl font-bold">0</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Đơn đang thực hiện</div>
            <div className="mt-1 text-3xl font-bold">0</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Thu nhập hôm nay</div>
            <div className="mt-1 text-3xl font-bold">0 VND</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Điểm đánh giá</div>
            <div className="mt-1 text-3xl font-bold">Chưa có</div>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800">Thông tin tài khoản</h2>
          <div className="mt-4 space-y-2">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Họ tên:</strong> {user?.name}</p>
            <p><strong>Vai trò:</strong> {user?.role}</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => {
                AuthManager.clearDriverAuth();
                router.push("/driver/login");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}