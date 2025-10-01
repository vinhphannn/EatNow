"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthManager } from "@/utils/authManager";
import { useDriverAuth } from "@/contexts/AuthContext";
import { DriverGuard } from "@/components/guards/AuthGuard";
import DriverLiveMap from "@/components/map/DriverLiveMap";
import { driverService } from "@/services/driver.service";
import { useDriverAvailability } from "@/store/driverAvailability";
import type { DriverDashboardStats } from "@/types/driver";

export default function DriverDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useDriverAuth();
  const { active, setActive } = useDriverAvailability();
  const [stats, setStats] = useState<DriverDashboardStats | null>(null);
  const [error, setError] = useState<string>("");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || user?.role !== 'driver') {
      router.push('/driver/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await driverService.getMyStats();
        setStats(data);
      } catch (e: any) {
        setError(e?.message || "Không thể tải thống kê");
      }
    };
    fetchStats();
    const id = setInterval(fetchStats, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Periodically send GPS to backend when driver is active
    let watchId: number | null = null;
    if (active && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            await driverService.updateMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          } catch {}
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
      );
    }
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [active]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </main>
    );
  }

  return (
    <DriverGuard fallbackPath="/driver/login">
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Tài xế</h1>
            <p className="mt-1 text-gray-600">{greeting}, {user?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <button
              onClick={async () => {
                try {
                  const next = !active;
                  await driverService.setAvailability(next);
                  setActive(next);
                } catch (e) {
                  // noop: keep previous state
                }
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium shadow ${active ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {active ? 'Đang nhận đơn' : 'Tạm ẩn'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Đơn hôm nay" value={stats?.todayOrders ?? 0} />
          <StatCard label="Thu nhập hôm nay" value={formatCurrency(stats?.todayEarnings ?? 0)} />
          <StatCard label="Hoàn tất" value={stats?.completedOrders ?? 0} />
          <StatCard label="Điểm đánh giá" value={stats?.rating ? stats.rating.toFixed(1) : '—'} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card p-4">
              <div className="mb-3 text-base font-semibold text-gray-800">Bản đồ realtime</div>
              <MapWithFallback />
            </div>
          </div>
          <div>
            <div className="card p-4">
              <div className="text-base font-semibold text-gray-800">Nhanh truy cập</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickLink href="/driver/current" label="Đơn hiện tại" />
                <QuickLink href="/driver/history" label="Lịch sử" />
                <QuickLink href="/driver/earnings" label="Thu nhập" />
                <QuickLink href="/driver/profile" label="Hồ sơ" />
              </div>
            </div>

            <div className="mt-6 card p-4">
              <div className="text-base font-semibold text-gray-800">Tài khoản</div>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <div>Email: {user?.email}</div>
                <div>Tên: {user?.name}</div>
              </div>
              <button
                onClick={() => { AuthManager.clearDriverAuth(); router.push('/driver/login'); }}
                className="mt-4 w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >Đăng xuất</button>
            </div>
          </div>
        </div>
      </div>
    </main>
    </DriverGuard>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function MapWithFallback() {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  return (
    <div className="relative">
      {error ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border bg-gray-50 text-center">
          <div className="text-sm text-red-600">Không thể tải bản đồ</div>
          <button onClick={()=>{ setError(null); setKey((k)=>k+1); }} className="mt-2 rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Thử lại</button>
        </div>
      ) : (
        <div onErrorCapture={()=>setError('Map failed')}>
          <DriverLiveMap key={key} />
        </div>
      )}
    </div>
  );
}

function formatCurrency(v: number) {
  try { return new Intl.NumberFormat('vi-VN').format(v) + ' đ'; } catch { return `${v} đ`; }
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
      {label}
    </a>
  );
}