"use client";
import { useMemo, useState } from "react";

export default function RestaurantStatsPage() {
  const [range, setRange] = useState<'day'|'week'|'month'>('day');
  const chartData = useMemo(()=>{
    if (range==='day') return [12, 9, 7, 11, 14, 8, 10];
    if (range==='week') return [70, 64, 72, 81];
    return [200, 340, 410];
  }, [range]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Thống kê</h1>
        <select value={range} onChange={(e)=>setRange(e.target.value as any)} className="rounded border px-3 py-2 text-sm">
          <option value="day">Ngày</option>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 h-64 flex items-center justify-center text-gray-500">[Doanh thu: {chartData.join(', ')}]</div>
        <div className="rounded-xl border bg-white p-5 h-64 flex items-center justify-center text-gray-500">[Top món bán chạy]</div>
      </div>
      <div className="rounded-xl border bg-white p-5 h-64 flex items-center justify-center text-gray-500">[Giờ cao điểm]</div>
    </div>
  );
}


