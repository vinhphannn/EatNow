"use client";
import { useEffect, useState } from "react";

export default function RestaurantDashboard() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [token, setToken] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [revenueToday, setRevenueToday] = useState<number | null>(null);
  const [ordersToday, setOrdersToday] = useState<number | null>(null);
  const [newCustomers, setNewCustomers] = useState<number | null>(null);
  const [bestItem, setBestItem] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
      const rid = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_restaurant_id') : null;
      setToken(t);
      setRestaurantId(rid);
      // Placeholder: gọi API metrics khi có endpoint, hiện tại hiển thị fallback
      // Ví dụ (khi có BE): GET /restaurants/:id/metrics?range=today
    } catch {}
  }, []);

  const numberOrNA = (v: number | null, suffix = "") => (typeof v === 'number' ? new Intl.NumberFormat('vi-VN').format(v) + suffix : 'Chưa có');
  const textOrNA = (v: string | null) => (v && v.length ? v : 'Chưa có');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-500">Doanh thu hôm nay</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{numberOrNA(revenueToday, ' đ')}</div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-500">Đơn hôm nay</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{numberOrNA(ordersToday)}</div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-500">Khách mới</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{numberOrNA(newCustomers)}</div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-500">Món bán chạy</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{textOrNA(bestItem)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 h-64 flex items-center justify-center text-gray-500">Chưa có dữ liệu</div>
        <div className="rounded-xl border bg-white p-5 h-64 flex items-center justify-center text-gray-500">Chưa có dữ liệu</div>
      </div>
    </div>
  );
}


