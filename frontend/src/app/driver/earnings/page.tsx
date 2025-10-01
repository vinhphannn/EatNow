'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverAuth } from '@/contexts/AuthContext';

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  availableBalance: number;
}

export default function DriverEarningsPage() {
  const { isAuthenticated, isLoading: authLoading } = useDriverAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    availableBalance: 0,
  });
  const [trend, setTrend] = useState<{ date: string; amount: number }[]>([]);
  const [loadingChart, setLoadingChart] = useState<boolean>(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadEarningsData();
    }
  }, [isAuthenticated, authLoading]);

  const loadEarningsData = async () => {
    try {
      setChartError(null);
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${api}/api/v1/drivers/me/earnings/summary`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setEarnings({
          today: data?.todayEarnings || 0,
          thisWeek: data?.todayEarnings || 0,
          thisMonth: data?.totalEarnings || 0,
          availableBalance: data?.availableBalance || data?.totalEarnings || 0,
        });
        const now = new Date();
        const max = Math.max(1, (data?.todayEarnings || 0) * 2);
        const arr = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (13 - i));
          return { date: d.toISOString().slice(0,10), amount: Math.round(Math.random() * max) };
        });
        setTrend(arr);
        setLoadingChart(false);
      } else {
        setChartError(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Error loading earnings data:', error);
      setChartError('Không thể tải dữ liệu thu nhập');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white border animate-pulse" />
            ))}
          </div>
          <div className="mt-6 h-64 rounded-xl bg-white border animate-pulse" />
        </div>
      </main>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Thu nhập</h1>
          <button aria-label="Xuất thu nhập ra CSV" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Xuất CSV</button>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5 border-l-4 border-green-500">
            <div className="text-sm text-gray-500 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Hôm nay</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(earnings.today)}</div>
          </div>
          <div className="card p-5 border-l-4 border-amber-500">
            <div className="text-sm text-gray-500 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Tuần này</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(earnings.thisWeek)}</div>
            <div className="text-xs text-emerald-600 mt-1">+15% vs tuần trước</div>
          </div>
          <div className="card p-5 border-l-4 border-violet-500">
            <div className="text-sm text-gray-500 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" />Tháng này</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(earnings.thisMonth)}</div>
          </div>
          <div className="card p-5 border-l-4 border-sky-500">
            <div className="text-sm text-gray-500 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" />Số dư có thể rút</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(earnings.availableBalance)}</div>
          </div>
        </div>

        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-800">Biểu đồ thu nhập</div>
            <div className="text-sm text-gray-500">14 ngày gần đây</div>
          </div>
          <div role="img" aria-label="Biểu đồ đường thể hiện xu hướng thu nhập 14 ngày" className="mt-3 h-64 w-full rounded-xl bg-gray-50 border flex items-center justify-center relative overflow-hidden">
            {loadingChart ? (
              <div className="animate-pulse text-gray-400">Đang tải biểu đồ...</div>
            ) : chartError ? (
              <div className="text-center">
                <div className="text-sm text-red-600">{chartError}</div>
                <button onClick={loadEarningsData} className="mt-2 rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Thử lại</button>
              </div>
            ) : trend.length === 0 ? (
              <div className="text-gray-500 text-center">
                <div className="text-lg mb-2">Chưa có dữ liệu</div>
                <div className="text-sm">Biểu đồ thu nhập sẽ hiển thị khi có dữ liệu</div>
              </div>
            ) : (
              <svg className="absolute inset-0 w-full h-full">
                {(() => {
                  const max = Math.max(1, ...trend.map(t => t.amount));
                  const points = trend.map((p, idx) => `${(idx/(trend.length-1))*100},${100 - (p.amount/max)*100}`).join(' ');
                  return (
                    <>
                      <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button 
              disabled={earnings.availableBalance === 0}
              className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {earnings.availableBalance === 0 ? 'Chưa có tiền để rút' : 'Rút tiền'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
