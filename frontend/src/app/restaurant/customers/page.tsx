"use client";
import { useState } from "react";

type Customer = { id: string; name: string; email: string; orders: number; locked: boolean };

export default function RestaurantCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Nguyễn A', email: 'a@ex.com', orders: 5, locked: false },
    { id: '2', name: 'Trần B', email: 'b@ex.com', orders: 2, locked: false },
  ]);
  const [historyOpen, setHistoryOpen] = useState<Customer | null>(null);
  function toggleLock(id: string) { setCustomers(prev=>prev.map(c=>c.id===id?{...c, locked: !c.locked}:c)); }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Khách hàng</h1>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="py-2 px-3">Tên</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Số đơn</th>
              <th className="py-2 px-3">Trạng thái</th>
              <th className="py-2 px-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c=> (
              <tr key={c.id} className="border-t">
                <td className="py-2 px-3">{c.name}</td>
                <td className="py-2 px-3">{c.email}</td>
                <td className="py-2 px-3">{c.orders}</td>
                <td className="py-2 px-3">{c.locked? <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">locked</span> : <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">active</span>}</td>
                <td className="py-2 px-3">
                  <div className="flex gap-2">
                    <button onClick={()=>setHistoryOpen(c)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">Lịch sử</button>
                    <button onClick={()=>toggleLock(c.id)} className={`rounded border px-3 py-1 text-sm ${c.locked? 'text-green-700 hover:bg-green-50':'text-red-700 hover:bg-red-50'}`}>{c.locked? 'Unlock':'Lock'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl rounded-xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Lịch sử đơn - {historyOpen.name}</h2>
              <button onClick={()=>setHistoryOpen(null)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">Đóng</button>
            </div>
            <div className="mt-4 text-sm text-gray-600">[Hiển thị danh sách đơn của khách hàng này - placeholder]</div>
          </div>
        </div>
      )}
    </div>
  );
}


