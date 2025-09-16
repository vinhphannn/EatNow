'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverAuth } from '../../../hooks/useDriverAuth';

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  availableBalance: number;
}

export default function DriverEarningsPage() {
  const { isAuthenticated, loading: authLoading } = useDriverAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    availableBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadEarningsData();
    }
  }, [isAuthenticated, authLoading]);

  const loadEarningsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/driver/login');
        return;
      }

      // TODO: Implement earnings API endpoint
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drivers/me/earnings`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });

      // if (response.ok) {
      //   const data = await response.json();
      //   setEarnings(data);
      // }

    } catch (error) {
      console.error('Error loading earnings data:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Thu nhập</h1>
        
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="text-sm text-gray-500">Hôm nay</div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(earnings.today)}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">Tuần này</div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(earnings.thisWeek)}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">Tháng này</div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(earnings.thisMonth)}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">Số dư có thể rút</div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(earnings.availableBalance)}</div>
          </div>
        </div>

        <div className="mt-6 card p-6">
          <div className="font-semibold text-gray-800">Biểu đồ thu nhập</div>
          <div className="mt-3 h-64 w-full rounded-xl bg-gray-100 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">Chưa có dữ liệu</div>
              <div className="text-sm">Biểu đồ thu nhập sẽ hiển thị khi có dữ liệu</div>
            </div>
          </div>
          <div className="mt-4">
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
